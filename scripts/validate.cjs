#!/usr/bin/env node
// Automatic checks for every plugin in plugins/. Runs on each pull request (see
// .github/workflows/validate.yml) and before the featured list is built.
//
// It catches the obvious problems so the human review can focus on what the code does. Passing
// it does NOT mean a plugin is safe — every plugin is still read by a person before merging.
//
// Usage: node scripts/validate.cjs [pluginsDir]

const fs = require("fs");
const path = require("path");

const root = path.resolve(process.argv[2] || path.join(__dirname, "..", "plugins"));
const MAX_FILE = 10 * 1024 * 1024;
const MAX_TOTAL = 20 * 1024 * 1024;
const MAX_FILES = 200;
const ALLOWED_EXT = new Set([".js", ".json", ".md", ".png", ".svg", ".css", ".txt"]);

// Hard failures: things featured plugins may never do.
const BANNED = [
  [/\beval\s*\(/, "eval()"],
  [/\bnew\s+Function\b|\bFunction\s*\(/, "the Function constructor"],
  [/\bimport\s*\(/, "dynamic import()"],
  [/__TAURI|tauri\.invoke|\binvoke\s*\(|ipc\.localhost|launcher_invoke/i, "Ruby's native layer (IPC)"],
  [/document\s*\.\s*cookie/, "document.cookie"],
  [/ROBLOSECURITY/i, "the Roblox session cookie"],
  [/\bfetch\s*\(/, "fetch()"],
  [/XMLHttpRequest|\bWebSocket\b|EventSource|navigator\s*\.\s*sendBeacon/, "network requests"],
  [/\blocalStorage\b|\bsessionStorage\b|\bindexedDB\b/, "direct browser storage (use ruby.storage)"],
  [/window\s*\.\s*open\s*\(/, "window.open (use ruby.openExternal)"],
  [/\b(?:top|parent|opener)\s*\.\s*(?:location|postMessage|document)/, "other windows"],
  [/createElement\s*\(\s*["'`]script["'`]\s*\)/, "injecting <script> tags"],
  [/\bsetTimeout\s*\(\s*["'`]|\bsetInterval\s*\(\s*["'`]/, "string timers (eval in disguise)"],
];

// Warnings: allowed only with a good reason, the reviewer looks closely.
const WARN = [
  [/\.innerHTML\s*=|\.outerHTML\s*=|insertAdjacentHTML/, "HTML built from strings (prefer createElement + textContent)"],
  [/\batob\s*\(|\bbtoa\s*\(|\\x[0-9a-f]{2}(?:\\x[0-9a-f]{2}){8,}/i, "encoded strings (possible obfuscation)"],
  [/\bdocument\s*\.\s*(?:body|head|documentElement)\b/, "touching the page outside its container"],
  [/\bMutationObserver\b/, "watching Ruby's page"],
];

let failures = 0;
let warnings = 0;
const fail = (id, msg) => {
  failures++;
  console.log(`FAIL  ${id}: ${msg}`);
};
const warn = (id, msg) => {
  warnings++;
  console.log(`WARN  ${id}: ${msg}`);
};

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isSymbolicLink()) return [{ p, symlink: true }];
    return e.isDirectory() ? walk(p) : [{ p }];
  });
}

if (!fs.existsSync(root)) {
  console.log(`No plugins folder at ${root}`);
  process.exit(1);
}

const ids = fs.readdirSync(root, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
for (const id of ids) {
  const dir = path.join(root, id);
  if (!/^[a-z0-9.-]{1,64}$/.test(id) || id.includes("..")) fail(id, "folder name must be lowercase letters, digits, '-' or '.'");

  // Manifest.
  let m;
  try {
    m = JSON.parse(fs.readFileSync(path.join(dir, "plugin.json"), "utf8"));
  } catch {
    fail(id, "missing or invalid plugin.json");
    continue;
  }
  if (m.id !== id) fail(id, `plugin.json id "${m.id}" must match the folder name`);
  if (!m.name || typeof m.name !== "string" || !m.name.trim()) fail(id, "plugin.json needs a name");
  if (!/^\d+\.\d+\.\d+$/.test(String(m.version || ""))) fail(id, "plugin.json version must look like 1.0.0");
  if (!m.author || typeof m.author !== "string") fail(id, "plugin.json needs an author");
  if (!m.description || String(m.description).length > 200) fail(id, "plugin.json needs a description (max 200 characters)");
  const entry = m.entry || "index.js";
  if (/\.\.|^\/|\\|:/.test(entry)) fail(id, "entry must be a plain relative path");
  if (!fs.existsSync(path.join(dir, entry))) fail(id, `entry file ${entry} is missing`);
  if (/ruby launcher|^ruby$/i.test(m.name)) fail(id, "plugin name can't be 'Ruby' / 'Ruby Launcher' (see TRADEMARK)");
  if (!fs.existsSync(path.join(dir, "README.md"))) warn(id, "no README.md");
  if (m.icon !== undefined) {
    const icon = String(m.icon);
    if (/\.\.|^\/|\\|:/.test(icon) || !/\.(png|svg|webp)$/i.test(icon)) fail(id, "icon must be a png, svg or webp file in the plugin folder");
    else if (!fs.existsSync(path.join(dir, icon))) fail(id, `icon file ${icon} is missing`);
    else if (fs.statSync(path.join(dir, icon)).size > 256 * 1024) fail(id, "icon is over 256 KB");
  } else warn(id, "no icon (add one: a square png, svg or webp)");

  // Files.
  const files = walk(dir);
  if (files.length > MAX_FILES) fail(id, `too many files (${files.length} > ${MAX_FILES})`);
  let total = 0;
  for (const f of files) {
    const rel = path.relative(dir, f.p).replace(/\\/g, "/");
    if (f.symlink) {
      fail(id, `${rel}: symlinks aren't allowed`);
      continue;
    }
    if (rel.split("/").length > 6) fail(id, `${rel}: too deeply nested`);
    if (rel.startsWith(".") || rel.includes("/.")) fail(id, `${rel}: hidden files aren't allowed`);
    const ext = path.extname(rel).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) fail(id, `${rel}: file type ${ext || "(none)"} isn't allowed`);
    const size = fs.statSync(f.p).size;
    total += size;
    if (size > MAX_FILE) fail(id, `${rel}: over 10 MB`);

    if (ext === ".svg") {
      const svg = fs.readFileSync(f.p, "utf8");
      if (/<script|\bon[a-z]+\s*=|javascript:|<foreignObject|xlink:href\s*=\s*["'](?!#)|\bhref\s*=\s*["'](?!#)/i.test(svg)) {
        fail(id, `${rel}: SVGs can't contain scripts, event handlers or external links`);
      }
    }
    if (ext === ".js" || ext === ".css") {
      const src = fs.readFileSync(f.p, "utf8");
      const longest = src.split("\n").reduce((n, l) => Math.max(n, l.length), 0);
      if (longest > 1000) fail(id, `${rel}: a line is ${longest} characters long; minified or obfuscated code isn't allowed`);
      if (ext === ".js") {
        // Ignore comments so explanations don't trip the checks.
        const code = src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`\\])\/\/.*$/gm, "$1");
        for (const [re, what] of BANNED) if (re.test(code)) fail(id, `${rel}: uses ${what}`);
        for (const [re, what] of WARN) if (re.test(code)) warn(id, `${rel}: ${what}`);
      }
    }
  }
  if (total > MAX_TOTAL) fail(id, `plugin is ${(total / 1048576).toFixed(1)} MB; the limit is 20 MB`);
}

// featured.json may only name plugins that exist.
const featuredPath = path.join(root, "..", "featured.json");
if (fs.existsSync(featuredPath)) {
  try {
    const list = JSON.parse(fs.readFileSync(featuredPath, "utf8"));
    if (!Array.isArray(list)) fail("featured.json", "must be an array of plugin ids");
    else for (const id of list) if (!ids.includes(id)) fail("featured.json", `lists "${id}", which isn't in plugins/`);
  } catch {
    fail("featured.json", "isn't valid JSON");
  }
}

console.log(`\n${ids.length} plugin(s) checked: ${failures} failure(s), ${warnings} warning(s).`);
process.exit(failures ? 1 : 0);
