const API = "https://en-wiki.metin2.gameforge.com/api.php";
const CATEGORIES = [
  "Items",
  "Items/Books",
  "Items/Chest",
  "Items/Costumes",
  "Items/Dragon Soul Alchemy",
  "Items/Event",
  "Items/Fishing",
  "Items/Item-Shop",
  "Items/Mining",
  "Items/Mounts",
  "Items/Other",
  "Items/Pets",
  "Items/Potions",
  "Items/Quest",
  "Items/Special",
  "Items/Spirit Stone",
  "Items/Upgrade",
];

async function fetchCategory(category) {
  const pages = new Map();
  let continuation = "";
  do {
    const params = new URLSearchParams({
      action: "query",
      list: "categorymembers",
      cmtitle: `Category:${category}`,
      cmtype: "page",
      cmlimit: "max",
      format: "json",
      formatversion: "2",
    });
    if (continuation) params.set("cmcontinue", continuation);
    const response = await fetch(`${API}?${params.toString()}`, {
      headers: { "User-Agent": "ASHEN-REALM-Wiki-Catalog/1.0 (GitHub Actions)" },
    });
    if (!response.ok) throw new Error(`Wiki API HTTP ${response.status} for ${category}`);
    const json = await response.json();
    if (json.error) throw new Error(`Wiki API error for ${category}: ${JSON.stringify(json.error)}`);
    for (const page of json.query?.categorymembers ?? []) {
      if (page.ns === 0) {
        const title = page.title;
        const key = title.toLocaleLowerCase("en");
        const current = pages.get(key) ?? {
          title,
          pageId: page.pageid,
          url: `https://en-wiki.metin2.gameforge.com/index.php/${encodeURIComponent(title.replaceAll(" ", "_"))}`,
          categories: [],
          sourceVerified: true,
          detailStatus: "title_and_category_indexed_only",
        };
        if (!current.categories.includes(category)) current.categories.push(category);
        pages.set(key, current);
      }
    }
    continuation = json.continue?.cmcontinue ?? "";
  } while (continuation);
  return [...pages.values()];
}

const all = new Map();
for (const category of CATEGORIES) {
  const pages = await fetchCategory(category);
  for (const page of pages) {
    const key = page.title.toLocaleLowerCase("en");
    const current = all.get(key) ?? page;
    current.categories = [...new Set([...current.categories, ...page.categories])].sort();
    all.set(key, current);
  }
  console.log(`${category}: ${pages.length} pages`);
}

const items = [...all.values()].sort((a, b) => a.title.localeCompare(b.title, "en"));
const output = {
  _meta: {
    title: "ASHEN REALM — official Metin2 Wiki catalog index",
    source: "Gameforge Metin2 Wiki",
    sourceApi: API,
    generatedAt: new Date().toISOString(),
    categoryCount: CATEGORIES.length,
    uniquePageCount: items.length,
    scope: "Bulk index of item page titles and official source links. This is not a claim that detailed stats, recipes, or drop rates have been extracted.",
    dataPolicy: "Only title, page ID, category membership, and source URL are imported here. Detailed properties must be extracted from individual source pages; unknown values stay null/unset.",
  },
  categories: CATEGORIES,
  items,
};
await import("node:fs/promises").then(fs => fs.mkdir("data", { recursive: true }));
await import("node:fs/promises").then(fs => fs.writeFile("data/metin2-wiki-catalog-index.json", JSON.stringify(output, null, 2) + "\n"));
console.log(`Wrote ${items.length} unique official Wiki item pages.`);
