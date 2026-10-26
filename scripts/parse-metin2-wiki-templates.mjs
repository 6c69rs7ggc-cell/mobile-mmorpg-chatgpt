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

function cleanTemplateName(rawName) {
  // Wiki pages commonly place HTML comments between a template name and its first field.
  // Those comments are not part of the MediaWiki template name.
  return rawName
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
      const name = cleanTemplateName(parts.shift() ?? "");
      const fields = {};
      const positional = [];
      for (const part of parts) {
        const equals = part.indexOf("=");
        if (equals < 1) {
          const value = part.trim();
          if (value) positional.push(value);
          continue;
        }
        const key = part.slice(0, equals).trim();
        const value = part.slice(equals + 1).trim();
        if (key && value) fields[key] = value;
      }
      if (name) found.push({ name, fields, positional });
    }
  }
  return found;
}

const ITEM_PROPERTY_FIELDS = {
  description: ["Description"],
  function: ["Function"],
  quest: ["Quest"],
  origin: ["Origin"],
  tradableNpc: ["Tradable NPC"],
  tradableWindow: ["Tradable Window"],
  privateShop: ["Private Shop"],
  mailbox: ["Mailbox"],
  storable: ["Storable"],
  dropable: ["Dropable", "Droppable"],
  stackable: ["Stackable"],
  category: ["Category"],
  category2: ["Category2"],
  other: ["Other"]
};

function extractItemProperties(templates) {
  const layout = templates.find(template => template.name.toLocaleLowerCase("en") === "item/layoutv2")
    ?? templates.find(template => template.name.toLocaleLowerCase("en") === "item/layout");
  if (!layout) return null;
  const properties = {};
  for (const [normalizedName, sourceNames] of Object.entries(ITEM_PROPERTY_FIELDS)) {
    for (const sourceName of sourceNames) {
      const value = layout.fields[sourceName];
      if (typeof value === "string" && value.trim()) {
        properties[normalizedName] = { sourceField: sourceName, rawValue: value.trim() };
        break;
      }
    }
  }
  return Object.keys(properties).length ? properties : null;
}

function extractLinkedReferences(templates, layout) {
  const sourceFields = ["Origin", "Content-items", "Content-other", "Content-weapons", "Content-armours", "Content-accessories", "Content-helmshield", "Function", "Other"];
  const references = [];
  for (const template of templates) {
    const name = template.name.toLocaleLowerCase("en");
    if (!["ti", "ti2", "tm"].includes(name)) continue;
    const target = (template.positional?.[0] ?? template.fields.name ?? "").trim();
    if (!target) continue;
    let contextField = null;
    if (layout) {
      for (const field of sourceFields) {
        if (typeof layout.fields[field] === "string" && layout.fields[field].includes("{{" + template.name + "|")) {
          contextField = field;
          break;
        }
      }
    }
    references.push({
      template: template.name,
      target,
      kind: name === "tm" ? "monster_or_npc" : "item",
      quantityOrNote: (template.positional ?? []).slice(1).join("|") || null,
      contextField,
      source: "nested Wiki template"
    });
  }
  const seen = new Set();
  return references.filter(ref => {
    const key = [ref.template.toLowerCase(), ref.target.toLowerCase(), ref.contextField ?? "", ref.quantityOrNote ?? ""].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractCraftingRecipes(originRawValue) {
  const source = String(originRawValue ?? "").replace(/<!--[\s\S]*?-->/g, "");
  const recipes = [];
  const pattern = /\{\{Tm\|([^}|]+)(?:\|[^}]*)?\}\}\s*\(Crafted\s*-\s*([\d.,]+)\s*%\)\s*:([\s\S]*?)(?=\n\s*:\*'''|\n\s*\*'''|$)/gi;
  for (const match of source.matchAll(pattern)) {
    const ingredients = [];
    const ingredientPattern = /\{\{Ti\|([^}|]+)(?:\|([^}]*))?\}\}([^\n]*)/gi;
    for (const item of match[3].matchAll(ingredientPattern)) {
      const note = (item[2] ?? "").trim();
      const trailing = item[3].replace(/^[\s*:]*$/, "").trim();
      const quantityMatch = (note + " " + trailing).match(/(?:^|\b)([\d][\d.,]*)\s*(x|times|yang|gaya)?\b/i);
      ingredients.push({
        item: item[1].trim(),
        quantityOrCost: note || trailing || null,
        parsedQuantity: quantityMatch ? quantityMatch[1].replace(/,/g, "") : null,
        sourceText: item[0].trim()
      });
    }
    recipes.push({
      npc: match[1].trim(),
      successRatePercent: Number(match[2].replace(",", ".")),
      ingredients,
      sourceText: match[0].trim(),
      sourceField: "Origin",
      note: "Extracted from an explicit Wiki crafting annotation; quantities are kept alongside original source text."
    });
  }
  return recipes;
}

function extractAcquisitionSources(originRawValue) {
  const source = String(originRawValue ?? "").replace(/<!--[\s\S]*?-->/g, "");
  const lines = source.split(/\r?\n/);
  let section = "Unclassified";
  const sources = [];
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    const heading = line.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
    if (/^:?\*+/.test(line) && heading && /'''/.test(line)) {
      section = heading[1].trim();
    }
    const templatePattern = /\{\{(Ti2?|Tm)\|([^}|]+)(?:\|([^}]*))?\}\}/gi;
    for (const match of line.matchAll(templatePattern)) {
      const template = match[1].toLocaleLowerCase("en");
      const target = match[2].trim();
      if (!target) continue;
      const annotation = line.replace(match[0], "").replace(/^[:*\s]+/, "").trim();
      const crafting = /crafted|crafting/i.test(line);
      sources.push({
        section: crafting ? "Crafting" : section,
        target,
        kind: template === "tm" ? "npc_or_monster" : "item_or_container",
        annotation: annotation || null,
        sourceText: line
      });
    }
  }
  const seen = new Set();
  return sources.filter(entry => {
    const key = [entry.section, entry.target.toLocaleLowerCase("en"), entry.annotation ?? ""].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function extractUpgradeSignals(itemProperties, linkedReferences) {
  const functionText = itemProperties?.function?.rawValue ?? "";
  const originText = itemProperties?.origin?.rawValue ?? "";
  const upgradeTerms = /upgrade|refin|smith|enhanc|improv|craft|success rate|refinement/i;
  return {
    mentionedInFunction: upgradeTerms.test(functionText),
    originMentionsCrafting: /crafted|crafting|smith|upgrade|refin/i.test(originText),
    materialReferences: linkedReferences.filter(ref => ref.kind === "item" && ["Origin", "Function"].includes(ref.contextField)),
    craftingRecipes: extractCraftingRecipes(originText),
    acquisitionSources: extractAcquisitionSources(originText),
    sourceFields: ["Function", "Origin"].filter(field => {
      const key = field === "Function" ? "function" : "origin";
      return Boolean(itemProperties?.[key]?.rawValue);
    }),
    note: "Signals and references are extracted from Wiki source fields; they do not establish a complete upgrade recipe or success probability."
  };
}

function extractWikiTables(wikitext) {
  const tables = [];
  const blocks = wikitext.match(/\{\|[\s\S]*?\|\}/g) ?? [];
  for (const block of blocks) {
    const rows = [];
    let row = [];
    const pushRow = () => {
      const cleaned = row
        .map(cell => cell.replace(/<!--[\s\S]*?-->/g, "").trim())
        .filter(Boolean);
      if (cleaned.length) rows.push(cleaned);
      row = [];
    };
    for (const rawLine of block.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (line.startsWith("|}")) { pushRow(); break; }
      if (line.startsWith("|-")) { pushRow(); continue; }
      if (!(line.startsWith("|") || line.startsWith("!"))) continue;
      if (line.startsWith("|+") || line.startsWith("|-")) continue;
      const marker = line[0];
      const separator = marker === "!" ? "!!" : "||";
      let cells = line.slice(1).split(separator);
      if (cells.length === 1) {
        const pipe = cells[0].indexOf("|");
        if (pipe >= 0 && /^[^|=]+\s*=/.test(cells[0].slice(0, pipe))) {
          cells = [cells[0].slice(pipe + 1)];
        }
      }
      row.push(...cells.map(cell => cell.replace(/^\s*[^|]*?\s\|\s*/, "").trim()));
    }
    pushRow();
    if (rows.length) tables.push({ rowCount: rows.length, rows });
  }
  return tables;
}

const pages = details.pages.map(page => {
  const wikitext = page.rawWikitext ?? "";
  const templates = templatesIn(wikitext);
  const wikiTables = extractWikiTables(wikitext);
  const allKeys = [...new Set(templates.flatMap(template => Object.keys(template.fields)))];
  const lowerText = wikitext.toLocaleLowerCase("en");
  const statKeys = allKeys.filter(key => /attack|defen[cs]e|level|hp|hit points|bonus|strength|dexterity|intelligence|vitality|speed|magic|value|price|sell|duration|class|type/i.test(key));
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
    wikiTables,
    itemProperties: extractItemProperties(templates),
    linkedReferences: extractLinkedReferences(templates, templates.find(template => template.name.toLocaleLowerCase("en") === "item/layoutv2") ?? templates.find(template => template.name.toLocaleLowerCase("en") === "item/layout")),
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

for (const page of pages) {
  page.upgradeSignals = extractUpgradeSignals(page.itemProperties, page.linkedReferences);
}

const output = {
  _meta: {
    title: "ASHEN REALM — parsed official Metin2 Wiki template index",
    source: "Raw wikitext extracted from Gameforge Metin2 Wiki",
    generatedAt: new Date().toISOString(),
    inputPages: pages.length,
    pagesWithRawWikitext: pages.filter(page => page.rawWikitextLength > 0).length,
    pagesWithTemplates: pages.filter(page => page.templateCount > 0).length,
    pagesWithItemProperties: pages.filter(page => page.itemProperties !== null).length,
    pagesWithWikiTables: pages.filter(page => page.wikiTables.length > 0).length,
    totalWikiTables: pages.reduce((sum, page) => sum + page.wikiTables.length, 0),
    pagesWithPotentialStatFields: pages.filter(page => page.signals.hasPotentialStatFields).length,
    pagesWithPotentialDropFields: pages.filter(page => page.signals.hasPotentialDropFields).length,
    pagesWithPotentialUpgradeFields: pages.filter(page => page.signals.hasPotentialUpgradeFields).length,
    pagesWithLinkedReferences: pages.filter(page => page.linkedReferences.length > 0).length,
    totalLinkedReferences: pages.reduce((sum, page) => sum + page.linkedReferences.length, 0),
    pagesWithUpgradeSignals: pages.filter(page => page.upgradeSignals.mentionedInFunction || page.upgradeSignals.originMentionsCrafting).length,
    pagesWithParsedCraftingRecipes: pages.filter(page => page.upgradeSignals.craftingRecipes.length > 0).length,
    pagesWithAcquisitionSources: pages.filter(page => page.upgradeSignals.acquisitionSources.length > 0).length,\n    totalAcquisitionSources: pages.reduce((sum, page) => sum + page.upgradeSignals.acquisitionSources.length, 0),\n    sampleAcquisitionSources: pages.filter(page => page.upgradeSignals.acquisitionSources.length > 0).slice(0, 8).map(page => ({ title: page.title, sources: page.upgradeSignals.acquisitionSources.slice(0, 12) })),
    totalParsedCraftingRecipes: pages.reduce((sum, page) => sum + page.upgradeSignals.craftingRecipes.length, 0),
    sampleCraftingRecipes: pages.filter(page => page.upgradeSignals.craftingRecipes.length > 0).slice(0, 8).map(page => ({ title: page.title, recipes: page.upgradeSignals.craftingRecipes })),
    sampleLinkedReferences: pages.filter(page => page.linkedReferences.length > 0).slice(0, 8).map(page => ({ title: page.title, references: page.linkedReferences.slice(0, 8) })),
    commonTemplateNames: [...pages.flatMap(page => page.templates.map(template => template.name))].reduce((counts, name) => { counts[name] = (counts[name] ?? 0) + 1; return counts; }, {}),
    templatesWithPositionalArguments: pages.reduce((sum, page) => sum + page.templates.filter(template => template.positional?.length).length, 0),
    commonTemplatesWithPositionalArgs: [...pages.flatMap(page => page.templates.filter(template => template.positional?.length).map(template => template.name))].reduce((counts, name) => { counts[name] = (counts[name] ?? 0) + 1; return counts; }, {}),
    samplePositionalTemplates: pages.flatMap(page => page.templates.filter(template => template.positional?.length).map(template => ({ page: page.title, template: template.name, positional: template.positional.slice(0, 8) }))).slice(0, 12),
    sampleItemLayoutTemplates: pages.flatMap(page => page.templates.filter(template => /item\/layoutv?2?/i.test(template.name)).map(template => ({ page: page.title, template: template.name, fields: template.fields, positional: template.positional }))).slice(0, 8),
    sampleFieldNames: [...new Set(pages.flatMap(page => page.detectedFieldNames))].sort((a, b) => a.localeCompare(b, "en")).slice(0, 300),
    scope: "Generic template/field extraction. Field names and values remain source-native; no drop chances or game mechanics are inferred."
  },
  pages
};
await fs.writeFile(OUTPUT, JSON.stringify(output, null, 2) + "\n");
console.log(JSON.stringify(output._meta, null, 2));
