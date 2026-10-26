import fs from "node:fs/promises";

const CATALOG = "data/metin2-wiki-catalog-index.json";
const DETAILS = "data/metin2-wiki-page-details.json";
const STRUCTURED = "data/metin2-wiki-structured-index.json";

function fail(message) {
  console.error(`VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

const catalog = JSON.parse(await fs.readFile(CATALOG, "utf8"));
const details = JSON.parse(await fs.readFile(DETAILS, "utf8"));
const structured = JSON.parse(await fs.readFile(STRUCTURED, "utf8"));
const catalogItems = catalog.items ?? catalog.records;
const pages = details.pages;

if (!Array.isArray(catalogItems) || catalogItems.length === 0) {
  fail("catalog has no items/records");
}
if (!Array.isArray(pages) || pages.length === 0) {
  fail("details file has no pages");
}
if (process.exitCode) process.exit();

const normalize = value => String(value ?? "").trim().toLocaleLowerCase("en");
const catalogTitles = new Set();
const duplicateCatalogTitles = [];
for (const item of catalogItems) {
  const key = normalize(item.title);
  if (!key) {
    fail("catalog record is missing a title");
    continue;
  }
  if (catalogTitles.has(key)) duplicateCatalogTitles.push(item.title);
  catalogTitles.add(key);
  if (!item.url) fail(`catalog record has no source URL: ${item.title}`);
}
if (duplicateCatalogTitles.length) {
  fail(`duplicate catalog titles: ${duplicateCatalogTitles.slice(0, 10).join(", ")}`);
}

const detailTitles = new Set();
const duplicateDetailTitles = [];
let pagesWithText = 0;
let pagesWithoutText = 0;
let pagesWithRawWikitext = 0;
for (const page of pages) {
  const key = normalize(page.title);
  if (!key) {
    fail("detail record is missing a title");
    continue;
  }
  if (detailTitles.has(key)) duplicateDetailTitles.push(page.title);
  detailTitles.add(key);
  if (typeof page.pageText !== "string") fail(`pageText is not a string: ${page.title}`);
  const hasPlainText = typeof page.pageText === "string" && page.pageText.trim().length > 0;
  const hasRawWikitext = typeof page.rawWikitext === "string" && page.rawWikitext.trim().length > 0;
  if (hasPlainText || hasRawWikitext) pagesWithText++;
  else pagesWithoutText++;
  if (hasRawWikitext) pagesWithRawWikitext++;
  if (!page.sourceStatus) fail(`sourceStatus is missing: ${page.title}`);
}
if (duplicateDetailTitles.length) {
  fail(`duplicate detail titles: ${duplicateDetailTitles.slice(0, 10).join(", ")}`);
}
if (pagesWithText === 0 && pagesWithRawWikitext === 0) fail("no imported page contains plain text or raw wikitext");
if (!Array.isArray(structured.pages) || structured.pages.length === 0) fail("structured index has no pages");
if (Array.isArray(structured.pages) && structured.pages.length < catalogItems.length * 0.8) fail("structured index covers less than 80% of the catalog");

const structuredTitles = new Set((structured.pages ?? []).map(page => normalize(page.title)).filter(Boolean));
const structuredMissingTitles = [...detailTitles].filter(title => !structuredTitles.has(title));
if (structuredTitles.size !== (structured.pages ?? []).length) fail("structured index has duplicate or blank page titles");
if (structuredMissingTitles.length) {
  fail(`structured index is missing ${structuredMissingTitles.length} detail-page titles; examples: ${structuredMissingTitles.slice(0, 5).join(", ")}`);
}
const structuredRawPages = (structured.pages ?? []).filter(page => Number(page.rawWikitextLength) > 0).length;
if (pagesWithRawWikitext > 0 && structuredRawPages === 0) fail("raw wikitext exists in details but parser found no raw wikitext on any structured page");
if (pagesWithRawWikitext > 0 && structuredRawPages < pagesWithRawWikitext * 0.8) {
  fail(`structured parser retained raw wikitext for only ${structuredRawPages}/${pagesWithRawWikitext} pages (below 80% threshold)`);
}
if (detailTitles.size < catalogTitles.size * 0.8) {
  fail(`only ${detailTitles.size}/${catalogTitles.size} catalog titles have detail records (below 80% threshold)`);
}

const missingDetailTitles = [...catalogTitles].filter(title => !detailTitles.has(title));
console.log(JSON.stringify({
  valid: !process.exitCode,
  catalogRecords: catalogItems.length,
  uniqueCatalogTitles: catalogTitles.size,
  detailRecords: pages.length,
  uniqueDetailTitles: detailTitles.size,
  pagesWithText,
  pagesWithoutText,
  pagesWithRawWikitext,
  structuredPages: structured.pages?.length ?? 0,
  structuredPagesWithRawWikitext: structuredRawPages,
  structuredPagesMissingDetailTitles: structuredMissingTitles.length,
  catalogTitlesWithoutDetailRecord: missingDetailTitles.length,
  note: "Text extraction is not the same as structured stat, recipe, or drop-rate extraction."
}, null, 2));

if (process.exitCode) process.exit(1);
