import fs from "node:fs/promises";

const API = "https://en-wiki.metin2.gameforge.com/api.php";
const INPUT = "data/metin2-wiki-catalog-index.json";
const OUTPUT = "data/metin2-wiki-page-details.json";
const BATCH_SIZE = 40;
const PAUSE_MS = 250;
const MAX_RETRIES = 4;

const catalog = JSON.parse(await fs.readFile(INPUT, "utf8"));
const catalogItems = catalog.items ?? catalog.records;
if (!Array.isArray(catalogItems) || catalogItems.length === 0) {
  throw new Error("Catalog index is empty. Run the catalog importer first.");
}

async function fetchBatch(titles, attempt = 0) {
  const url = new URL(API);
  const params = {
    action: "query",
    prop: "extracts|categories|info|pageprops",
    titles: titles.join("|"),
    exintro: "0",
    explaintext: "1",
    exchars: "12000",
    cllimit: "max",
    inprop: "url",
    redirects: "1",
    format: "json",
    formatversion: "2",
  };
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await fetch(url, {
    headers: { "User-Agent": "ASHEN-REALM-Wiki-Details/1.0 (GitHub Actions)" },
  });
  if (!response.ok) {
    if (attempt < MAX_RETRIES && (response.status === 429 || response.status >= 500)) {
      await new Promise(resolve => setTimeout(resolve, PAUSE_MS * (attempt + 1) * 2));
      return fetchBatch(titles, attempt + 1);
    }
    throw new Error(`Wiki API HTTP ${response.status}`);
  }
  const data = await response.json();
  if (data.error) throw new Error(JSON.stringify(data.error));
  return data.query?.pages ?? [];
}

const details = [];
const indexedByTitle = new Map(catalogItems.map(item => [item.title.toLocaleLowerCase("en"), item]));
for (let offset = 0; offset < catalogItems.length; offset += BATCH_SIZE) {
  const batch = catalogItems.slice(offset, offset + BATCH_SIZE);
  const pages = await fetchBatch(batch.map(item => item.title));
  for (const page of pages) {
    const indexed = indexedByTitle.get(page.title.toLocaleLowerCase("en"));
    details.push({
      title: page.title,
      pageId: page.pageid ?? indexed?.pageId ?? null,
      sourceUrl: page.fullurl ?? indexed?.url ?? null,
      categories: (page.categories ?? []).map(c => c.title.replace(/^Category:/, "")),
      pageText: page.extract ?? "",
      pageProperties: page.pageprops ?? {},
      sourceStatus: page.missing ? "source_page_missing" : "official_wiki_page_text_extracted",
      structuredStatsStatus: "needs_infobox_parser_validation",
      dropRatesStatus: "not_extracted",
    });
  }
  console.log(`Processed ${Math.min(offset + batch.length, catalogItems.length)} / ${catalog.items.length} pages`);
  if (offset + BATCH_SIZE < catalog.items.length) await new Promise(resolve => setTimeout(resolve, PAUSE_MS));
}

const unique = new Map();
for (const row of details) unique.set(row.title.toLocaleLowerCase("en"), row);
const output = {
  _meta: {
    title: "ASHEN REALM — official Metin2 Wiki page details",
    source: "Gameforge Metin2 Wiki API",
    generatedAt: new Date().toISOString(),
    requestedPages: catalogItems.length,
    returnedPages: unique.size,
    scope: "Introductory text and categories for catalogued pages. This file does not claim complete infobox/stat/recipe/drop extraction.",
  },
  pages: [...unique.values()].sort((a, b) => a.title.localeCompare(b.title, "en")),
};
await fs.writeFile(OUTPUT, JSON.stringify(output, null, 2) + "\n");
console.log(`Wrote details for ${unique.size} pages to ${OUTPUT}`);
