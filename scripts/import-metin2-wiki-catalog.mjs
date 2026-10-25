const API = "https://en-wiki.metin2.gameforge.com/api.php";
const ROOT_CATEGORIES = ["Items"];

async function api(params) {
  const url = new URL(API);
  for (const [key, value] of Object.entries({ ...params, format: "json", formatversion: "2" })) url.searchParams.set(key, value);
  const response = await fetch(url, { headers: { "User-Agent": "ASHEN-REALM-Wiki-Catalog/1.0 (GitHub Actions)" } });
  if (!response.ok) throw new Error(`Wiki API HTTP ${response.status}: ${url}`);
  const json = await response.json();
  if (json.error) throw new Error(`Wiki API error: ${JSON.stringify(json.error)}`);
  return json;
}

async function fetchCategory(category) {
  const pages = new Map();
  const subcategories = new Set();
  let continuation = "";
  do {
    const params = {
      action: "query", list: "categorymembers", cmtitle: `Category:${category}`,
      cmtype: "page|subcat", cmlimit: "max",
    };
    if (continuation) params.cmcontinue = continuation;
    const json = await api(params);
    for (const page of json.query?.categorymembers ?? []) {
      if (page.ns === 14) subcategories.add(page.title.replace(/^Category:/, ""));
      else if (page.ns === 0) {
        const title = page.title;
        const key = title.toLocaleLowerCase("en");
        const current = pages.get(key) ?? {
          title, pageId: page.pageid,
          url: `https://en-wiki.metin2.gameforge.com/index.php/${encodeURIComponent(title.replaceAll(" ", "_"))}`,
          categories: [], sourceVerified: true, detailStatus: "title_and_category_indexed_only",
        };
        if (!current.categories.includes(category)) current.categories.push(category);
        pages.set(key, current);
      }
    }
    continuation = json.continue?.cmcontinue ?? "";
  } while (continuation);
  return { pages: [...pages.values()], subcategories: [...subcategories] };
}

const all = new Map();
const categories = new Set();
const queue = [...ROOT_CATEGORIES];
while (queue.length) {
  const category = queue.shift();
  if (categories.has(category)) continue;
  categories.add(category);
  const result = await fetchCategory(category);
  for (const subcategory of result.subcategories) if (!categories.has(subcategory)) queue.push(subcategory);
  for (const page of result.pages) {
    const key = page.title.toLocaleLowerCase("en");
    const current = all.get(key) ?? page;
    current.categories = [...new Set([...current.categories, ...page.categories])].sort();
    all.set(key, current);
  }
  console.log(`Category:${category}: ${result.pages.length} pages; discovered ${result.subcategories.length} subcategories`);
}

const categoryList = [...categories].sort();
const items = [...all.values()].sort((a, b) => a.title.localeCompare(b.title, "en"));
const output = {
  _meta: {
    title: "ASHEN REALM — official Metin2 Wiki catalog index",
    source: "Gameforge Metin2 Wiki",
    sourceApi: API,
    generatedAt: new Date().toISOString(),
    categoryCount: categoryList.length,
    uniquePageCount: items.length,
    scope: "Bulk index of item page titles and official source links. This is not a claim that detailed stats, recipes, or drop rates have been extracted.",
    dataPolicy: "Only title, page ID, category membership, and source URL are imported here. Detailed properties must be extracted from individual source pages; unknown values stay null/unset.",
  },
  categories: categoryList,
  items,
};
await import("node:fs/promises").then(fs => fs.mkdir("data", { recursive: true }));
await import("node:fs/promises").then(fs => fs.writeFile("data/metin2-wiki-catalog-index.json", JSON.stringify(output, null, 2) + "\n"));
console.log(`Wrote ${items.length} unique official Wiki item pages.`);
