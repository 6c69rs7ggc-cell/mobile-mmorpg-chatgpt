import fs from "node:fs/promises";

const CATALOG = "data/metin2-wiki-catalog-index.json";
const DETAILS = "data/metin2-wiki-page-details.json";

function fail(message) {
  console.error(`VALIDATION FAILED: ${message}`);
  process.exitCode = 1;
}

const catalog = JSON.parse(await fs.readFile(CATALOG, "utf8"));
const details = JSON.parse(await fs.readFile(DETAILS, "utf8"));
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
for (const page of pages) {
  const key = normalize(page.title);
  if (!key) {
    fail("detail record is missing a title");
    continue;
  }
  if (detailTitles.has(key)) duplicateDetailTitles.push(page.title);
  detailTitles.add(key);
  if (typeof page.pageText !== "string") fail(`pageText is not a string: ${page.title}`);
  else if (page.pageText.trim()) pagesWithText++;
  else pagesWithoutText++;
  if (!page.sourceStatus) fail(`sourceStatus is missing: ${page.title}`);
}
if (duplicateDetailTitles.length) {
  fail(`duplicate detail titles: ${duplicateDetailTitles.slice(0, 10).join(", ")}`);
}
if (pagesWithText === 0) fail("no imported page contains text");
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
  catalogTitlesWithoutDetailRecord: missingDetailTitles.length,
  note: "Text extraction is not the same as structured stat, recipe, or drop-rate extraction."
}, null, 2));

if (process.exitCode) process.exit(1);
