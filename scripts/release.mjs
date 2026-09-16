#!/usr/bin/env node
/**
 * Release helper for Agamiz Cinema.
 *
 * Bumps the app version, keeps the three version files in sync
 * (package.json, src-tauri/Cargo.toml, src-tauri/tauri.conf.json), runs the
 * production build, then creates a commit and git tag ready to push so the
 * GitHub Actions release workflow picks it up.
 *
 * Usage:
 *   node scripts/release.mjs                 # patch bump (1.0.0 -> 1.0.1)
 *   node scripts/release.mjs minor           # 1.0.0 -> 1.1.0
 *   node scripts/release.mjs major           # 1.0.0 -> 2.0.0
 *   node scripts/release.mjs 1.2.3           # explicit version
 *   node scripts/release.mjs --no-build      # skip the production build
 *   node scripts/release.mjs --no-tag        # commit but do not tag
 *   node scripts/release.mjs --no-commit     # bump + build only
 *   node scripts/release.mjs --dry-run       # print plan without changing files
 */

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const PKG = resolve(root, "package.json");
const CARGO = resolve(root, "src-tauri", "Cargo.toml");
const TAURI = resolve(root, "src-tauri", "tauri.conf.json");

const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const positionals = args.filter((a) => !a.startsWith("--"));

const doBuild = !flags.has("--no-build");
const doTag = !flags.has("--no-tag");
const doCommit = !flags.has("--no-commit");
const dryRun = flags.has("--dry-run");

function fail(msg) {
  console.error(`[release] error: ${msg}`);
  process.exit(1);
}

function readJson(file) {
  return JSON.parse(readFileSync(file, "utf8"));
}

function writeJson(file, data) {
  writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function bumpVersion(current, kind) {
  const [major, minor, patch] = current.split(".").map((n) => parseInt(n, 10) || 0);
  switch (kind) {
    case "major":
      return `${major + 1}.0.0`;
    case "minor":
      return `${major}.${minor + 1}.0`;
    case "patch":
    default:
      return `${major}.${minor}.${patch + 1}`;
  }
}

function currentVersion() {
  return readJson(PKG).version;
}

function syncVersion(version) {
  const pkg = readJson(PKG);
  pkg.version = version;
  writeJson(PKG, pkg);

  const tauri = readJson(TAURI);
  tauri.version = version;
  writeJson(TAURI, tauri);

  const cargo = readFileSync(CARGO, "utf8").replace(
    /^version\s*=\s*"[^"]+"/m,
    `version = "${version}"`,
  );
  writeFileSync(CARGO, cargo);
}

function git(args) {
  execSync(`git ${args}`, { stdio: "inherit", cwd: root });
}

const raw = currentVersion();
let version;
if (positionals.length === 0) {
  version = bumpVersion(raw, "patch");
} else if (/^\d+\.\d+\.\d+$/.test(positionals[0])) {
  version = positionals[0];
} else {
  version = bumpVersion(raw, positionals[0]);
}

if (!/^\d+\.\d+\.\d+$/.test(version)) {
  fail(`invalid version "${version}" - expected x.y.z or patch|minor|major`);
}

console.log(`[release] ${raw} -> ${version}`);

if (dryRun) {
  console.log(`[release] dry run - files would be updated, no build/commit/tag performed`);
  process.exit(0);
}

syncVersion(version);
console.log(`[release] version synced in package.json, Cargo.toml, tauri.conf.json`);

if (doBuild) {
  console.log(`[release] building production bundle...`);
  execSync("npm run tauri:build", { stdio: "inherit", cwd: root });
} else {
  console.log(`[release] skipping build (--no-build)`);
}

if (!doCommit) {
  console.log(`[release] done - no commit/tag created (--no-commit)`);
  process.exit(0);
}

git("add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json");
git(`commit -m "chore: release v${version}"`);

if (doTag) {
  git(`tag -a v${version} -m "Agamiz Cinema v${version}"`);
  console.log(`[release] tag v${version} created. Push with:\n  git push --follow-tags`);
} else {
  console.log(`[release] commit created (no tag). Push with:\n  git push`);
}

console.log(`[release] done.`);
