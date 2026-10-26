/**
 * Small regression test for the Wiki template parser's core parsing rules.
 * Run with: node scripts/test-metin2-wiki-template-parser.mjs
 */

import assert from "node:assert/strict";

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
      for (const part of parts) {
        const equals = part.indexOf("=");
        if (equals < 1) continue;
        const key = part.slice(0, equals).trim();
        const value = part.slice(equals + 1).trim();
        if (key && value) fields[key] = value;
      }
      if (name) found.push({ name, fields });
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

const sample = `{{Item
|name=Moon Blade
|description=Power = mystery
|image={{Icon|moon|size=32}}
|upgrade={{Upgrade table|material={{Item link|Moon Shard}}|cost=1000}}
|link=[[Moon Blade|blade|rare]]
}}
`;
const parsed = templatesIn(sample);

const commentedTemplate = templatesIn(`{{Item/LayoutV2

<!-- Exact ingame description -->
|Description = Test item
|width = 32
}}`);
assert.ok(
  commentedTemplate.some(t => t.name === "Item/LayoutV2"),
  "HTML comments after a template name must not become part of its name"
);
assert.equal(
  commentedTemplate.find(t => t.name === "Item/LayoutV2").fields.Description,
  "Test item",
  "fields after an HTML comment should still parse"
);

const layoutProperties = extractItemProperties(templatesIn(`{{Item/LayoutV2
|Description = Test blade
|Function = Increases attack
|Origin = Monster drop
|Dropable = Yes
|Stackable = No
}}`));
assert.equal(layoutProperties.description.rawValue, "Test blade");
assert.equal(layoutProperties.function.rawValue, "Increases attack");
assert.equal(layoutProperties.origin.rawValue, "Monster drop");
assert.equal(layoutProperties.dropable.sourceField, "Dropable");
assert.equal(layoutProperties.stackable.rawValue, "No");
assert.equal(extractItemProperties(templatesIn("No item layout here")), null);

const acquisition = extractAcquisitionSources(`:*'''[[Boxes]]:'''
::*{{Ti|Balathor's Frost Chest}}
:*'''[[NPC]]:''' {{Tm|Yu-Hwan}} (Crafted - 40%):
::*{{Ti|Catalyst}} 2x`);
assert.equal(acquisition.length, 3, "origin sources should be grouped and extracted");
assert.equal(acquisition[0].section, "Boxes");
assert.equal(acquisition[0].target, "Balathor's Frost Chest");
assert.equal(acquisition[1].section, "Crafting", "crafted NPC sources should be marked as crafting");
assert.equal(acquisition[1].target, "Yu-Hwan");\nassert.equal(acquisition[2].section, "Crafting");\nassert.equal(acquisition[2].target, "Catalyst");


const progressionTables = extractWikiTables(`{| class="wikitable"
! Upgrade !! +0 !! +1 !! +2
|-
! Defence
| 12 || 18 || 24
|-
! Upgrade Yang
| - || 600 || 1.200
|}`);
assert.equal(progressionTables.length, 1, "Wiki tables should be retained");
assert.ok(progressionTables[0].rows.some(row => row.includes("Defence")), "table row labels should be retained");
assert.ok(progressionTables[0].rows.some(row => row.includes("Upgrade Yang")), "upgrade cost rows should be retained");

assert.ok(parsed.some(t => t.name === "Item"), "outer Item template should be found");
assert.ok(parsed.some(t => t.name === "Icon"), "nested Icon template should be found");
assert.ok(parsed.some(t => t.name === "Upgrade table"), "nested Upgrade table should be found");
assert.ok(parsed.some(t => t.name === "Item link"), "deeply nested Item link template should be found");

const item = parsed.find(t => t.name === "Item");
assert.equal(item.fields.name, "Moon Blade");
assert.equal(item.fields.description, "Power = mystery", "equals inside values must be preserved");
assert.equal(item.fields.link, "[[Moon Blade|blade|rare]]", "pipes inside links must not split fields");
assert.match(item.fields.upgrade, /material={{Item link\|Moon Shard}}/);


function extractCraftingRecipes(originRawValue) {
  const source = String(originRawValue ?? "").replace(/<!--[\s\S]*?-->/g, "");
  const recipes = [];
  const pattern = /\{\{Tm\|([^}|]+)(?:\|[^}]*)?\}\}\s*\(Crafted\s*-\s*([\d.,]+)\s*%\)\s*:([\s\S]*?)(?=\n\s*:\*'''|\n\s*\*'''|$)/gi;
  for (const match of source.matchAll(pattern)) {
    const ingredients = [];
    const ingredientPattern = /\{\{Ti\|([^}|]+)(?:\|([^}]*))?\}\}([^\n]*)/gi;
    for (const item of match[3].matchAll(ingredientPattern)) {
      const note = (item[2] ?? "").trim();
      const trailing = item[3].trim().replace(/^[*: ]+/, "");
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
      sourceText: match[0].trim()
    });
  }
  return recipes;
}

const crafting = extractCraftingRecipes(`{{Tm|Yu-Hwan}} (Crafted - 40%):
::*{{Ti|1* Catalyst}} 2x
::*{{Ti|Gaya|2 Gaya}}
::*{{Ti|Yang|200.000 Yang}}`);
assert.equal(crafting.length, 1, "explicit crafting annotation should produce one recipe");
assert.equal(crafting[0].npc, "Yu-Hwan");
assert.equal(crafting[0].successRatePercent, 40);
assert.equal(crafting[0].ingredients.length, 3);
assert.equal(crafting[0].ingredients[0].item, "1* Catalyst");
assert.equal(crafting[0].ingredients[0].parsedQuantity, "2");
assert.equal(crafting[0].ingredients[1].item, "Gaya");
assert.equal(crafting[0].ingredients[1].parsedQuantity, "2");
assert.equal(crafting[0].ingredients[2].item, "Yang");
assert.equal(crafting[0].ingredients[2].parsedQuantity, "200.000");

console.log("Wiki template parser regression tests passed.");
