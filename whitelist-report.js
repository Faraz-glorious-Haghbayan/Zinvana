const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const ALL_ARTICLES_PATH = path.join(ROOT, "all-articles.html");
const MIN_TOKEN_MATCH_LENGTH = 3;
const EXCLUDED_DIRS = new Set(["node_modules", ".git"]);
const FORCE_DELETE_SUFFIXES = ["-ru.html", "-fa.html", "-hi.html"];
const FORCE_DELETE_CONTAINS = ["-q&a", "-q-and-a", "-qa"];
const FORCE_DELETE_NAMES = [
  "aztec.html",
  "inca.html",
  "mongolempire.html",
  "mughal.html",
  "ottoman.html",
  "romanempire.html",
  "british.html",
  "empire.html",
  "all-empires.html",
  "persian_kings-quiz.html",
];
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const htmlContent = fs.readFileSync(ALL_ARTICLES_PATH, "utf8");
// If new arrays get added to all-articles.html, include their names here so they are scanned.
const arrayNames = ["brawlerFiles", "leaderFiles", "featuredQuizFiles"];
const anchorTagRegex = /<a[^>]*>/gi;
const hrefPatterns = [
  /href\s*=\s*"([^"]+?\.html(?:#[^"]*)?)"/gi,
  /href\s*=\s*'([^']+?\.html(?:#[^']*)?)'/gi,
  /href\s*=\s*([^\s>]+?\.html(?:#[^\s>"']*)?)/gi,
];

function normalizeFilename(value) {
  const cleaned = value.trim().replace(/^['"]+|['"]+$/g, "");
  return path.basename(cleaned.split("#")[0].split("?")[0]);
}

function isForcedDelete(filename) {
  const lower = normalizeFilename(filename).toLowerCase();
  if (FORCE_DELETE_NAMES.includes(lower)) return true;
  if (FORCE_DELETE_SUFFIXES.some((s) => lower.endsWith(s))) return true;
  if (FORCE_DELETE_CONTAINS.some((c) => lower.includes(c))) return true;
  return false;
}

function splitTokens(value) {
  return normalizeFilename(value).replace(/\.html$/i, "").toLowerCase().split(/[-_]/);
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
  const safeName = escapeRegExp(name);
  const regex = new RegExp(`(?:const|let|var)\\s+${safeName}\\s*=\\s*\\[([^\\]]*?)\\]\\s*;?`, "i");
  const match = content.match(regex);
  if (!match) return [];

  const values = [];
  const stringRegex = /(['"`])([^'"`]*?\.html)\1/gi;
  let item;
  while ((item = stringRegex.exec(match[1])) !== null) {
    values.push(normalizeFilename(item[2]));
  }
  return values;
}

function extractAnchors(content) {
  const anchors = new Set();
  let tagMatch;
  while ((tagMatch = anchorTagRegex.exec(content)) !== null) {
    const tag = tagMatch[0];
    for (const pattern of hrefPatterns) {
      pattern.lastIndex = 0;
      let hrefMatch;
      while ((hrefMatch = pattern.exec(tag)) !== null) {
        const href = hrefMatch[1];
        if (href) anchors.add(normalizeFilename(href));
      }
    }
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
for (const item of [...whitelistSet]) {
  if (isForcedDelete(item)) whitelistSet.delete(item);
}
const whitelistBases = new Set([...whitelistSet].map(baseKey));
const whitelistTokens = new Map([...whitelistSet].map((item) => [item, splitTokens(item)]));

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
    const longEnoughBases =
      base.length >= MIN_TOKEN_MATCH_LENGTH && itemBase.length >= MIN_TOKEN_MATCH_LENGTH;
    if (longEnoughBases && (base.startsWith(itemBase) || itemBase.startsWith(base))) return true;

    const candidateTokens = splitTokens(filename);
    const itemTokens = whitelistTokens.get(item) ?? splitTokens(item);
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
  if (isForcedDelete(normalized)) {
    safeToDelete.push(file);
    continue;
  }
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
