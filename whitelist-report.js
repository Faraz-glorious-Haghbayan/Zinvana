const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const ALL_ARTICLES_PATH = path.join(ROOT, "all-articles.html");
const MIN_TOKEN_MATCH_LENGTH = 3;
const EXCLUDED_DIRS = new Set(["node_modules", ".git"]);
const VARIANT_SUFFIXES = [
  "q&a",
  "q&a-version",
  "qa",
  "qna",
  "q-and-a",
  "fa",
  "farsi",
  "hi",
  "urdu",
  "ru",
  "ar",
  "fr",
  "es",
  "de",
  "it",
  "pt",
  "tr",
  "cn",
  "jp",
  "kr",
  "en",
];

const htmlContent = fs.readFileSync(ALL_ARTICLES_PATH, "utf8");
// If new arrays get added to all-articles.html, include their names here so they are scanned.
const arrayNames = ["brawlerFiles", "leaderFiles", "featuredQuizFiles"];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeFilename(value) {
  return path.basename(value.split("#")[0].split("?")[0]);
}

function baseKey(filename) {
  let base = normalizeFilename(filename).replace(/\.html$/i, "").toLowerCase();
  base = base.replace(/^(leaders?|brawlers?|brawler|creator|quiz)-/, "");
  const suffixPattern = VARIANT_SUFFIXES.map(escapeRegExp).join("|");
  const variantSuffixRegex = new RegExp(`-(?:${suffixPattern})$`, "i");
  const stripped = base.replace(
    variantSuffixRegex,
    "",
  );
  return stripped.replace(/[^a-z0-9]+/g, "");
}

function extractArray(content, name) {
  const regex = new RegExp(`(?:const|let|var)\\s+${name}\\s*=\\s*\\[(.*?)\\]\\s*;?`, "is");
  const match = content.match(regex);
  if (!match) return [];

  const values = [];
  const stringRegex = /"([^"]+?\.html)"/gi;
  let item;
  while ((item = stringRegex.exec(match[1])) !== null) {
    values.push(normalizeFilename(item[1]));
  }
  return values;
}

function extractAnchors(content) {
  const anchors = new Set();
  const anchorRegex = /<a[^>]+href=["']([^"']+?\.html(?:#[^"']*)?)["']/gi;
  let match;
  while ((match = anchorRegex.exec(content)) !== null) {
    anchors.add(normalizeFilename(match[1]));
  }
  return [...anchors];
}

function collectHtmlFiles(root) {
  const results = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;

      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".html")) {
        results.push(path.relative(root, full));
      }
    }
  }
  walk(root);
  return results.sort();
}

const whitelistFromArrays = arrayNames.flatMap((name) => extractArray(htmlContent, name));
const whitelistFromLinks = extractAnchors(htmlContent);
const whitelistSet = new Set([...whitelistFromArrays, ...whitelistFromLinks].map(normalizeFilename));
const whitelistBases = new Set([...whitelistSet].map(baseKey));

const allHtmlFiles = collectHtmlFiles(ROOT);
const whitelist = [...whitelistSet].sort();
const uncertain = [];
const safeToDelete = [];

function looksRelated(filename) {
  const base = baseKey(filename);
  if (!base) return false;
  if (whitelistBases.has(base)) return true;

  for (const item of whitelistSet) {
    const itemBase = baseKey(item);
    if (!itemBase) continue;
    if (base.startsWith(itemBase) || itemBase.startsWith(base)) return true;

    const candidateTokens = normalizeFilename(filename).replace(/\.html$/i, "").toLowerCase().split(/[-_]/);
    const itemTokens = normalizeFilename(item)
      .replace(/\.html$/i, "")
      .toLowerCase()
      .split(/[-_]/);
    // Treat matching first tokens as a conservative fallback to avoid deleting potential variants.
    if (
      candidateTokens[0] &&
      candidateTokens[0] === itemTokens[0] &&
      candidateTokens[0].length >= MIN_TOKEN_MATCH_LENGTH
    ) {
      return true;
    }
  }
  return false;
}

for (const file of allHtmlFiles) {
  const normalized = normalizeFilename(file);
  if (whitelistSet.has(normalized)) continue;

  if (looksRelated(normalized)) {
    uncertain.push(file);
  } else {
    safeToDelete.push(file);
  }
}

function printList(title, items) {
  console.log(`\n${title} (${items.length})`);
  console.log("-".repeat(title.length + items.length.toString().length + 3));
  items.forEach((item) => console.log(item));
}

printList("WHITELIST (arrays + <a href>)", whitelist);
printList("UNCERTAIN (related to whitelist)", uncertain.sort());
printList("SAFE TO DELETE (not whitelisted or related)", safeToDelete.sort());
