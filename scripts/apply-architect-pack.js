#!/usr/bin/env node
// Dual-parse file: this script must load under BOTH the CommonJS and the ES-module
// parser, because the customer project's own package.json "type" field decides how
// Node parses every .js file in the folder. Keep these rules or the script breaks
// in half the folders out there:
//   - no import.meta, no static import/export statements, no top-level await;
//   - CommonJS-only globals (require, module, and the directory/filename globals)
//     may be referenced only behind, or after, a `typeof` guard;
//   - builtins load once: synchronously under CommonJS, via dynamic import() in
//     loadBuiltins() under ES-module scope. Function bodies use them unchanged.

let fs;
let path;

if (typeof require !== "undefined") {
  fs = require("fs");
  path = require("path");
}

async function loadBuiltins() {
  if (!fs) {
    fs = (await import("node:fs")).default;
    path = (await import("node:path")).default;
  }
}

const DELIMITER = "============================================================";
const PROTECTED_FILES = new Set([
  "CLAUDE.md",
  "CODEX.md",
  ".gitignore",
  "src/README.md",
  "tests/README.md",
  "scripts/README.md",
  "samples/README.md",
  "references/README.md",
]);

function usage() {
  console.error("Usage: node scripts/apply-architect-pack.js path/to/architect-pack.md [--dry-run]");
}

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function normalizeProjectPath(filePath) {
  if (!filePath || filePath.trim() !== filePath) {
    fail(`Invalid FILE path: "${filePath}"`);
  }

  if (path.isAbsolute(filePath)) {
    fail(`Absolute paths are not allowed: ${filePath}`);
  }

  const normalized = path.posix.normalize(filePath.replace(/\\/g, "/"));

  if (normalized === "." || normalized.startsWith("../") || normalized === "..") {
    fail(`Paths outside the project root are not allowed: ${filePath}`);
  }

  if (PROTECTED_FILES.has(normalized)) {
    fail(`Protected file cannot be overwritten by an Architect Pack: ${normalized}`);
  }

  return normalized;
}

function parseArchitectPack(content) {
  const lines = content.split(/\r?\n/);
  const sections = [];
  let i = 0;

  while (i < lines.length) {
    if (lines[i] !== DELIMITER) {
      i += 1;
      continue;
    }

    const header = lines[i + 1] || "";
    const closing = lines[i + 2] || "";
    const match = header.match(/^FILE: (.+)$/);

    if (!match || closing !== DELIMITER) {
      fail(`Malformed FILE section near line ${i + 1}`);
    }

    const filePath = normalizeProjectPath(match[1]);
    i += 3;

    if (lines[i] === "") {
      i += 1;
    }

    const body = [];
    while (i < lines.length && lines[i] !== DELIMITER) {
      body.push(lines[i]);
      i += 1;
    }

    sections.push({
      filePath,
      content: body.join("\n").replace(/\n*$/, "\n"),
    });
  }

  return sections;
}

// Sprint 136: the distinct first path segments under planning/sprints/ for every
// section that writes INSIDE a sprint folder (the path must continue below the
// segment; a bare file directly under planning/sprints/ creates no folder). A
// segment that does not match /^\d+-.+$/ is an offender. That regex deliberately
// mirrors the dashboard's SPRINT_DIR_RE in
// apps/hosted/lib/cockpit/sprint-chain.js (/^(\d+)-(.+)$/): the warning fires on
// dashboard-invisibility, not on doctrine style, so "12-short" stays silent even
// though the doctrine writes ###. Warn-only: exit codes and writes never change.
function collectDashboardInvisibleSprintFolders(sections) {
  const offenders = [];
  const seen = new Set();
  for (const section of sections) {
    const match = /^planning\/sprints\/([^/]+)\//.exec(section.filePath);
    if (!match) {
      continue;
    }
    const segment = match[1];
    if (seen.has(segment)) {
      continue;
    }
    seen.add(segment);
    if (!/^\d+-.+$/.test(segment)) {
      offenders.push(segment);
    }
  }
  return offenders;
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const packArgs = args.filter((arg) => arg !== "--dry-run");

  if (packArgs.length !== 1 || args.some((arg) => arg !== "--dry-run" && arg.startsWith("--"))) {
    usage();
    process.exit(1);
  }

  const packPath = path.resolve(process.cwd(), packArgs[0]);
  if (!fs.existsSync(packPath)) {
    fail(`Architect Pack not found: ${packArgs[0]}`);
  }

  const projectRoot = path.resolve(path.dirname(process.argv[1]), "..");
  const packContent = fs.readFileSync(packPath, "utf8");
  const sections = parseArchitectPack(packContent);

  if (sections.length === 0) {
    fail("No FILE sections found.");
  }

  const seen = new Set();
  for (const section of sections) {
    if (seen.has(section.filePath)) {
      fail(`Duplicate FILE section: ${section.filePath}`);
    }
    seen.add(section.filePath);
  }

  const results = [];

  for (const section of sections) {
    const targetPath = path.resolve(projectRoot, section.filePath);
    const relativeCheck = path.relative(projectRoot, targetPath);

    if (relativeCheck.startsWith("..") || path.isAbsolute(relativeCheck)) {
      fail(`Resolved path escapes project root: ${section.filePath}`);
    }

    const exists = fs.existsSync(targetPath);
    const action = exists ? "updated" : "created";

    if (!dryRun) {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, section.content, "utf8");
    }

    results.push({ action, filePath: section.filePath });
  }

  console.log(dryRun ? "Dry run: no files written." : "Architect Pack applied.");
  for (const result of results) {
    const verb = dryRun ? `would be ${result.action}` : result.action;
    console.log(`- ${verb}: ${result.filePath}`);
  }

  for (const folder of collectDashboardInvisibleSprintFolders(sections)) {
    console.error(
      `Warning: sprint folder "${folder}" does not match the ###-name format; the Mission Control dashboard will not show it.`
    );
  }
}

loadBuiltins()
  .then(() => main())
  .catch((err) => {
    console.error(err && err.stack ? err.stack : String(err));
    process.exit(1);
  });
