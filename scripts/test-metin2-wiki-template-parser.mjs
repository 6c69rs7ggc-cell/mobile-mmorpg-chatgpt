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
    .replace(/<!--[\\s\\S]*?-->/g, " ")
    .replace(/[\\r\\n\\t]+/g, " ")
    .replace(/\\s+/g, " ")
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

assert.ok(parsed.some(t => t.name === "Item"), "outer Item template should be found");
assert.ok(parsed.some(t => t.name === "Icon"), "nested Icon template should be found");
assert.ok(parsed.some(t => t.name === "Upgrade table"), "nested Upgrade table should be found");
assert.ok(parsed.some(t => t.name === "Item link"), "deeply nested Item link template should be found");

const item = parsed.find(t => t.name === "Item");
assert.equal(item.fields.name, "Moon Blade");
assert.equal(item.fields.description, "Power = mystery", "equals inside values must be preserved");
assert.equal(item.fields.link, "[[Moon Blade|blade|rare]]", "pipes inside links must not split fields");
assert.match(item.fields.upgrade, /material={{Item link\|Moon Shard}}/);

console.log("Wiki template parser regression tests passed.");
