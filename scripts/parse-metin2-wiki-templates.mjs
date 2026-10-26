import fs from "node:fs/promises";

const INPUT = "data/metin2-wiki-page-details.json";
const OUTPUT = "data/metin2-wiki-structured-index.json";
const details = JSON.parse(await fs.readFile(INPUT, "utf8"));
if (!Array.isArray(details.pages) || details.pages.length === 0) {
  throw new Error("No page details found. Run the Wiki detail importer first.");
}

function splitTopLevel(source, delimiter = "|") {
  const parts = [];
  let start = 0, braces = 0, brackets = 0;
  for (let i = 0; i < source.length; i++) {
    const pair = source.slice(i, i + 2);
    if (pair === "{{") { braces++; i++; continue; }
    if (pair === "}}") { braces = Math.max(0, braces - 1); i++; continue; }
    if (pair === "[[") { brackets++; i++; continue; }
    if (pair === "]]") { brackets = Math.max(0, brackets - 1); i++; continue; }
    if (source[i] === delimiter && braces === 0 && brackets === 0) {
      parts.push(source.slice(start, i));
      start = i + 1;
    }
  }
  parts.push(source.slice(start));
  return parts;
}

function templatesIn(wikitext) {
  const found = [];
  for (let i = 0; i < wikitext.length - 1; i++) {
    if (wikitext.slice(i, i + 2) !== "{{") continue;
    let depth = 1, j = i + 2;
    for (; j < wikitext.length - 1 && depth > 0; j++) {
      const pair = wikitext.slice(j, j + 2);
      if (pair === "{{") { depth++; j++; }
      else if (pair === "}}") { depth--; j++; }
    }
    if (depth === 0) {
      const body = wikitext.slice(i + 2, j - 2);
      const parts = splitTopLevel(body);
      const name = (parts.shift() ?? "").trim();
      const fields = {};
      for (const part of parts) {
        const equals = part.indexOf("=");
        if (equals < 1) continue;
        const key = part.slice(0, equals).trim();
        const value = part.slice(equals + 1).trim();
        if (key && value) fields[key] = value;
      }
      if (name) found.push({ name, fields });
      i = j - 1;
    }
  }
  return found;
}

const pages = details.pages.map(page => {
  const wikitext = page.rawWikitext ?? "";
  const templates = templatesIn(wikitext);
  const allKeys = [...new Set(templates.flatMap(template => Object.keys(template.fields)))];
  const lowerText = wikitext.toLocaleLowerCase("en");
  const lowerKeys = allKeys.map(key => key.toLocaleLowerCase("en"));
  const statKeys = allKeys.filter(key => /attack|defen[cs]e|level|level|hp|hit points|bonus|strength|dexterity|intelligence|vitality|speed|magic|value|price|sell|duration|class|type/i.test(key));
  const dropKeys = allKeys.filter(key => /drop|loot|monster|mob|chance|probability|rate/i.test(key));
  const upgradeKeys = allKeys.filter(key => /upgrade|refine|smith|material|recipe|success|fail|failure|stone|scroll/i.test(key));
  return {
    title: page.title,
    pageId: page.pageId ?? null,
    sourceUrl: page.sourceUrl ?? null,
    categories: page.categories ?? [],
    sourceStatus: page.sourceStatus ?? "unknown",
    rawWikitextLength: wikitext.length,
    templateCount: templates.length,
    templates,
    detectedFieldNames: allKeys,
    candidateStatFieldNames: statKeys,
    candidateDropFieldNames: dropKeys,
    candidateUpgradeFieldNames: upgradeKeys,
    signals: {
      mentionsDropTerms: /drop|loot|droprate|drop rate/i.test(lowerText),
      mentionsUpgradeTerms: /upgrade|refine|smith|improve|enhance/i.test(lowerText),
      hasPotentialStatFields: statKeys.length > 0,
      hasPotentialDropFields: dropKeys.length > 0,
      hasPotentialUpgradeFields: upgradeKeys.length > 0,
      note: "Candidates are source-text/template signals, not verified game mechanics or drop probabilities."
    }
  };
});

const output = {
  _meta: {
    title: "ASHEN REALM — parsed official Metin2 Wiki template index",
    source: "Raw wikitext extracted from Gameforge Metin2 Wiki",
    generatedAt: new Date().toISOString(),
    inputPages: pages.length,
    pagesWithRawWikitext: pages.filter(page => page.rawWikitextLength > 0).length,
    pagesWithTemplates: pages.filter(page => page.templateCount > 0).length,
    pagesWithPotentialStatFields: pages.filter(page => page.signals.hasPotentialStatFields).length,
    pagesWithPotentialDropFields: pages.filter(page => page.signals.hasPotentialDropFields).length,
    pagesWithPotentialUpgradeFields: pages.filter(page => page.signals.hasPotentialUpgradeFields).length,
    scope: "Generic template/field extraction. Field names and values remain source-native; no drop chances or game mechanics are inferred."
  },
  pages
};
await fs.writeFile(OUTPUT, JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify(output._meta, null, 2));
