const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const ALL_ARTICLES_PATH = path.join(ROOT, "all-articles.html");

const htmlContent = fs.readFileSync(ALL_ARTICLES_PATH, "utf8");
const arrayNames = ["brawlerFiles", "leaderFiles", "featuredQuizFiles"];

function normalizeFilename(value) {
  return path.basename(value.split("#")[0].split("?")[0]);
}

function baseKey(filename) {
  let base = normalizeFilename(filename).replace(/\.html$/i, "").toLowerCase();
  base = base.replace(/^(leaders?|brawlers?|brawler|creator|quiz)-/, "");
  const stripped = base.replace(
    /-(?:q&a|q&a-version|qa|qna|q-and-a|fa|farsi|hi|urdu|ru|ar|fr|es|de|it|pt|tr|cn|jp|kr|en)$/i,
    "",
  );
  return stripped.replace(/[^a-z0-9]+/g, "");
}

function extractArray(content, name) {
  const regex = new RegExp(`const\\s+${name}\\s*=\\s*\\[(.*?)\\];`, "is");
  const match = content.match(regex);
  if (!match) return [];

  const values = [];
  const stringRegex = /"([^"']+?\.html)"/gi;
  let item;
  while ((item = stringRegex.exec(match[1])) !== null) {
    values.push(normalizeFilename(item[1]));
  }
  return values;
}

function extractAnchors(content) {
  const anchors = new Set();
  const anchorRegex = /<a[^>]+href=["']([^"']+?\.html(?:#[^"']*)?)/gi;
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
      if (entry.name === "node_modules" || entry.name === ".git") continue;

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

    const candidateTokens = normalizeFilename(filename)
      .replace(/\.html$/i, "")
      .toLowerCase()
      .split(/[-_]/);
    const itemTokens = normalizeFilename(item)
      .replace(/\.html$/i, "")
      .toLowerCase()
      .split(/[-_]/);
    if (candidateTokens[0] && candidateTokens[0] === itemTokens[0] && candidateTokens[0].length > 2) {
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
