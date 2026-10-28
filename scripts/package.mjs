#!/usr/bin/env node
// Builds the two release packages into dist/:
//   imbrace-claude-marketplace-v<version>.zip    the marketplace repo (Claude Code)
//   imbrace-openai-skills-only-v<version>.zip    skills-only plugin (OpenAI / Codex)
// and checks the limits each target enforces. No dependencies: Node 20.15+.

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, rmSync } from "node:fs";
import { join, relative, posix, sep } from "node:path";
import { deflateRawSync, crc32 } from "node:zlib";

const ROOT = join(import.meta.dirname, "..");
const PLUGIN = join(ROOT, "plugins", "imbrace-developer");
const DIST = join(ROOT, "dist");

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
const claudeManifest = readJson(join(PLUGIN, ".claude-plugin", "plugin.json"));
const codexManifest = readJson(join(ROOT, "openai", "codex-plugin.json"));
const marketplace = readJson(join(ROOT, ".claude-plugin", "marketplace.json"));
const version = claudeManifest.version;

// ---- checks -----------------------------------------------------------------
const errors = [];
const check = (ok, msg) => { if (!ok) errors.push(msg); };

check(codexManifest.version === version, `openai/codex-plugin.json version ${codexManifest.version} != ${version}`);
check(marketplace.metadata?.version === version, `marketplace.json metadata.version != ${version}`);
check(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(codexManifest.name) && codexManifest.name.length <= 64, "name: lowercase, single hyphens, <= 64");
check(codexManifest.description.length <= 4000, "description > 4000");
const ui = codexManifest.interface;
for (const [field, max] of [["displayName", 30], ["shortDescription", 30], ["longDescription", 4000], ["developerName", 80]]) {
  check(ui[field] && ui[field].length <= max, `interface.${field} missing or > ${max} chars`);
}
check((ui.defaultPrompt ?? []).length <= 3 && ui.defaultPrompt.every((p) => p.length <= 128), "defaultPrompt: max 3, each <= 128");
for (const url of ["websiteURL", "supportURL", "privacyPolicyURL", "termsOfServiceURL"]) {
  check(!ui[url] || ui[url].startsWith("https://"), `interface.${url} must be https`);
}

const skillsDir = join(PLUGIN, "skills");
const skills = readdirSync(skillsDir).filter((d) => statSync(join(skillsDir, d)).isDirectory());
for (const s of skills) {
  const text = readFileSync(join(skillsDir, s, "SKILL.md"), "utf8");
  const fm = /^---\n([\s\S]*?)\n---/.exec(text.replace(/\r\n/g, "\n"))?.[1] ?? "";
  const name = /^name:\s*(.+)$/m.exec(fm)?.[1]?.trim();
  const desc = /^description:\s*(.+)$/m.exec(fm)?.[1]?.trim();
  check(name === s, `skills/${s}: frontmatter name "${name}" must match the folder`);
  check(desc && desc.length <= 1024, `skills/${s}: description missing or > 1024 chars`);
  // OpenAI asks for provider-neutral skill text.
  check(!/\bClaude\b(?! (Code|Desktop))/.test(text.replace(/^---[\s\S]*?---/, "")), `skills/${s}: refers to "Claude" as the model; use neutral wording`);
  check(!/api_[A-Za-z0-9]{16,}/.test(text), `skills/${s}: looks like a real API key`);
}
check(skills.length > 0, "no skills");
// No real key in any shipped text file other than the skills (checked above).
for (const f of [
  join(ROOT, "README.md"), join(PLUGIN, "README.md"), join(ROOT, "openai", "README.md"),
  join(PLUGIN, ".claude-plugin", "plugin.json"), join(ROOT, "openai", "codex-plugin.json"), join(PLUGIN, ".mcp.json"),
]) {
  check(!/api_[A-Za-z0-9]{16,}/.test(readFileSync(f, "utf8")), `${relative(ROOT, f).split(sep).join(posix.sep)}: looks like a real API key`);
}
check(existsRel(PLUGIN, ui.logo) && existsRel(PLUGIN, ui.composerIcon), "logo / composerIcon file missing");

if (errors.length) {
  console.error("Package checks failed:\n  - " + errors.join("\n  - "));
  process.exit(1);
}

// ---- zip writer (store + deflate, no deps) -----------------------------------
// Fixed timestamp so builds are reproducible: time 00:00, date 1980-01-01 (DOS date 0x0021).
const DOS_DATE = 0x0021;

function zip(entries) {
  const files = [], central = [];
  let offset = 0;
  for (const { path, data } of entries) {
    const name = Buffer.from(path, "utf8");
    const raw = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const comp = deflateRawSync(raw);
    const crc = crc32(raw);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x0800, 6);
    local.writeUInt16LE(8, 8); local.writeUInt16LE(0, 10); local.writeUInt16LE(DOS_DATE, 12); local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(raw.length, 22);
    local.writeUInt16LE(name.length, 26); local.writeUInt16LE(0, 28);
    files.push(local, name, comp);
    const c = Buffer.alloc(46);
    c.writeUInt32LE(0x02014b50, 0); c.writeUInt16LE(0x031e, 4); c.writeUInt16LE(20, 6); c.writeUInt16LE(0x0800, 8);
    c.writeUInt16LE(8, 10); c.writeUInt16LE(0, 12); c.writeUInt16LE(DOS_DATE, 14); c.writeUInt32LE(crc, 16);
    c.writeUInt32LE(comp.length, 20); c.writeUInt32LE(raw.length, 24); c.writeUInt16LE(name.length, 28);
    c.writeUInt32LE((0o100644 << 16) >>> 0, 38); c.writeUInt32LE(offset, 42);
    central.push(c, name);
    offset += 30 + name.length + comp.length;
  }
  const cd = Buffer.concat(central);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(entries.length, 8); end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...files, cd, end]);
}

function walk(dir, skip = () => false) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(ROOT, full).split(sep).join(posix.sep);
    if (skip(rel, name)) continue;
    if (statSync(full).isDirectory()) out.push(...walk(full, skip));
    else out.push(full);
  }
  return out.sort();
}

function existsRel(base, p) {
  try { return !!p && statSync(join(base, p)).isFile(); } catch { return false; }
}

const toPosix = (p) => p.split(sep).join(posix.sep);

// ---- build -------------------------------------------------------------------
rmSync(DIST, { recursive: true, force: true });
mkdirSync(DIST, { recursive: true });

// Never ship local or hidden files (.env, .DS_Store, .claude-flow/, editor state, ...). Dot-paths that are part
// of the published layout are listed here explicitly.
const ALLOWED_DOTFILES = new Set([".claude-plugin", ".mcp.json", ".github", ".gitignore"]);
const skipLocal = (rel, name) =>
  (name.startsWith(".") && !ALLOWED_DOTFILES.has(name)) || ["node_modules", "dist"].includes(name);

// 1. Claude Code marketplace: the repo as it will be published, from an explicit allowlist of top-level paths.
const REPO_PATHS = [".claude-plugin", "plugins", "openai", "scripts", "docs", ".github", "README.md", "LICENSE", "CHANGELOG.md", ".gitignore"];
const repoFiles = [];
for (const p of REPO_PATHS) {
  const full = join(ROOT, p);
  if (statSync(full).isDirectory()) repoFiles.push(...walk(full, skipLocal)); // throws if a listed path is missing
  else repoFiles.push(full);
}
const claudeEntries = repoFiles.sort().map((f) => ({
  path: "imbrace-agent-toolkit/" + toPosix(relative(ROOT, f)),
  data: readFileSync(f),
}));
const claudeZip = join(DIST, `imbrace-claude-marketplace-v${version}.zip`);
writeFileSync(claudeZip, zip(claudeEntries));

// 2. OpenAI skills-only: Codex manifest + skills + assets + README. No MCP config, no userConfig.
const top = "imbrace-developer/";
const openaiEntries = [
  { path: top + ".codex-plugin/plugin.json", data: JSON.stringify(codexManifest, null, 2) + "\n" },
  { path: top + "README.md", data: readFileSync(join(ROOT, "openai", "README.md")) },
  ...walk(PLUGIN, (rel, name) => skipLocal(rel, name) || [".claude-plugin", ".mcp.json", "README.md"].includes(name))
    .map((f) => ({ path: top + toPosix(relative(PLUGIN, f)), data: readFileSync(f) })),
];
const openaiZip = join(DIST, `imbrace-openai-skills-only-v${version}.zip`);
writeFileSync(openaiZip, zip(openaiEntries));

for (const [file, entries] of [[claudeZip, claudeEntries], [openaiZip, openaiEntries]]) {
  console.log(`${relative(ROOT, file)}  (${entries.length} files)`);
  for (const e of entries) console.log("   " + e.path);
}
console.log(`\nChecks passed: ${skills.length} skills, version ${version}.`);
