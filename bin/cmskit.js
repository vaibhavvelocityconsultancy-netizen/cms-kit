#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const projectRoot = process.cwd();
const [, , command, moduleArg] = process.argv;

const VALID_MODULES = ["forms", "menus", "ecommerce", "seo", "billing"];

function fail(msg) {
  console.error(`❌ ${msg}`);
  process.exit(1);
}

if (!command) {
  fail(
    `Usage:
  cmskit status
  cmskit list
  cmskit doctor
  cmskit add <module>

Available modules: ${VALID_MODULES.join(", ")}`,
  );
}

if (command === "add" && !moduleArg) {
  fail(
    `Usage: cmskit add <module>\nAvailable modules: ${VALID_MODULES.join(", ")}`,
  );
}

if (
  command !== "add" &&
  command !== "status" &&
  command !== "doctor" &&
  command !== "list"
) {
  fail(
    `Unknown command "${command}". Use "cmskit status", "cmskit doctor", "cmskit list", or "cmskit add <module>".`,
  );
}

if (command === "add" && !VALID_MODULES.includes(moduleArg)) {
  fail(`Unknown module "${moduleArg}". Available: ${VALID_MODULES.join(", ")}`);
}

const configPath = path.join(projectRoot, "cmskit.config.json");
if (!fs.existsSync(configPath)) {
  fail("cmskit.config.json not found. Run this inside a CMSKit project.");
}

const config = JSON.parse(fs.readFileSync(configPath, "utf8"));

if (command === "status") {
  showStatus(config, projectRoot);
  process.exit(0);
}

if (command === "list") {
  showModules(config);
  process.exit(0);
}

if (command === "doctor") {
  await runDoctor(config, projectRoot);
  process.exit(0);
}

function showStatus(config, projectRoot) {
  const coreModules = ["pages", "posts", "media"];

  const optionalModules = {
    forms: "Forms",
    menus: "Menus",
    ecommerce: "E-commerce",
    seo: "SEO",
    billing: "Billing",
  };

  console.log("\n╭────────────────────────────────────╮");
  console.log("│           CMSKit Status             │");
  console.log("╰────────────────────────────────────╯\n");
 
  console.log("CMSKit");
  console.log(`  Version: ${config.cmskitVersion || "1.0.0"}\n`);

  console.log("Core Modules");

  for (const module of coreModules) {
    const installed = config.modules?.includes(module);

    console.log(`  ${installed ? "✓" : "✗"} ${capitalize(module)}`);
  }

  console.log("\nOptional Modules");

  for (const [module, name] of Object.entries(optionalModules)) {
    const installed = config.modules?.includes(module);

    console.log(`  ${installed ? "✓" : "○"} ${name}`);
  }

  console.log("\nProject");

  console.log(
    `  ${fs.existsSync(path.join(projectRoot, "package.json")) ? "✓" : "✗"} package.json`,
  );

  console.log(
    `  ${fs.existsSync(path.join(projectRoot, "prisma")) ? "✓" : "✗"} Prisma`,
  );

  console.log(
    `  ${
      fs.existsSync(path.join(projectRoot, "cmskit.config.json")) ? "✓" : "✗"
    } cmskit.config.json`,
  );

  console.log(
    `  ${
      fs.existsSync(path.join(projectRoot, "README.md")) ? "✓" : "✗"
    } README.md`,
  );

  console.log("\n");
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

if (config.modules.includes(moduleArg)) {
  fail(`"${moduleArg}" is already installed.`);
}

const cacheDir = path.join(projectRoot, ".cmskit-modules");
if (!fs.existsSync(cacheDir)) {
  fail(
    "No cached module files found (.cmskit-modules missing). Cannot add modules to this project.",
  );
}

console.log(`\n📦 Adding "${moduleArg}" module...\n`);

// 1. Restore cached source files for this module back into src/
const moduleCacheDir = path.join(cacheDir, moduleArg);
if (fs.existsSync(moduleCacheDir)) {
  copyRecursive(moduleCacheDir, projectRoot);
  console.log(`✔ Files restored for "${moduleArg}"`);
} else {
  console.log(
    `⚠ No cached files found for "${moduleArg}" (may have none, continuing)`,
  );
}

// 2. Rebuild prisma/schema.prisma from cached fragments
const prismaCacheDir = path.join(cacheDir, "prisma");
const prismaDir = path.join(projectRoot, "prisma");

const coreSchemaPath = path.join(prismaCacheDir, "schema.core.prisma");
if (!fs.existsSync(coreSchemaPath)) {
  fail("Cached schema.core.prisma not found. Cannot rebuild schema.");
}

let finalSchema = fs.readFileSync(coreSchemaPath, "utf8");

const updatedModules = [...config.modules, moduleArg];
for (const mod of updatedModules) {
  const fragPath = path.join(prismaCacheDir, `schema.${mod}.prisma`);
  if (fs.existsSync(fragPath)) {
    finalSchema += "\n\n" + fs.readFileSync(fragPath, "utf8");
  }
}

finalSchema = stripUnknownRelations(finalSchema);
fs.writeFileSync(path.join(prismaDir, "schema.prisma"), finalSchema, "utf8");
console.log("✔ Prisma schema updated");

// 3. Update config
config.modules = updatedModules;
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
console.log("✔ cmskit.config.json updated");
const readmeUpdated = updateReadme(projectRoot, config);
if (readmeUpdated) {
  console.log("✔ README.md updated");
}

// 4. Run prisma generate + migrate (adds new tables, keeps existing data)
console.log("\nRunning database migration...\n");
execSync("npx prisma generate", { cwd: projectRoot, stdio: "inherit" });
execSync(`npx prisma migrate dev --name add_${moduleArg}`, {
  cwd: projectRoot,
  stdio: "inherit",
});

console.log(`\n🎉 "${moduleArg}" module installed successfully!\n`);
console.log("  npm run dev\n");

// ── helpers ──────────────────────────────────────────────

function showModules(config) {
  const coreModules = {
    pages: "Pages",
    posts: "Posts",
    media: "Media",
  };

  const optionalModules = {
    forms: "Forms",
    menus: "Menus",
    ecommerce: "E-commerce",
    seo: "SEO",
    billing: "Billing",
  };

  console.log("\n╭────────────────────────────────────╮");
  console.log("│           CMSKit Modules            │");
  console.log("╰────────────────────────────────────╯\n");

  console.log("Core Modules");

  for (const [module, name] of Object.entries(coreModules)) {
    const installed = config.modules?.includes(module);

    console.log(`  ${installed ? "✓" : "✗"} ${name}`);
  }

  console.log("\nOptional Modules");

  for (const [module, name] of Object.entries(optionalModules)) {
    const installed = config.modules?.includes(module);

    console.log(`  ${installed ? "✓" : "○"} ${name}`);
  }

  console.log("\n");
}

async function runDoctor(config, projectRoot) {
  console.log("\n╭────────────────────────────────────╮");
  console.log("│           CMSKit Doctor             │");
  console.log("╰────────────────────────────────────╯\n");

  let problems = 0;

  function check(name, passed, message = "") {
    if (passed) {
      console.log(`✓ ${name}`);
    } else {
      console.log(`✗ ${name}`);

      if (message) {
        console.log(`  ${message}`);
      }

      problems++;
    }
  }

  const nodeMajor = Number(process.versions.node.split(".")[0]);

  check(
    `Node.js ${process.versions.node}`,
    nodeMajor >= 20,
    "CMSKit requires Node.js 20 or newer.",
  );

  const packagePath = path.join(projectRoot, "package.json");

  check("package.json", fs.existsSync(packagePath), "package.json is missing.");

  check(
    "cmskit.config.json",
    fs.existsSync(path.join(projectRoot, "cmskit.config.json")),
    "cmskit.config.json is missing.",
  );

  const prismaDir = path.join(projectRoot, "prisma");

  check(
    "Prisma directory",
    fs.existsSync(prismaDir),
    "prisma/ directory is missing.",
  );

  const schemaPath = path.join(prismaDir, "schema.prisma");

  check(
    "Prisma schema",
    fs.existsSync(schemaPath),
    "prisma/schema.prisma is missing.",
  );

  const prismaClientPath = path.join(
    projectRoot,
    "node_modules",
    "@prisma",
    "client",
  );

  check(
    "Prisma Client",
    fs.existsSync(prismaClientPath),
    "Run: npx prisma generate",
  );

  check(
    "README.md",
    fs.existsSync(path.join(projectRoot, "README.md")),
    "README.md is missing.",
  );

  if (fs.existsSync(schemaPath)) {
    try {
      execSync("npx prisma migrate status", {
        cwd: projectRoot,
        stdio: "pipe",
      });

      check("Database / Prisma", true);
    } catch (error) {
      check(
        "Database / Prisma",
        false,
        "Prisma could not connect to the configured database or migration status could not be read.",
      );
    }
  } else {
    check("Database / Prisma", false, "Prisma schema is missing.");
  }

  console.log("");

  if (problems === 0) {
    console.log("🎉 No problems found.\n");
  } else {
    console.log(`⚠ ${problems} problem${problems === 1 ? "" : "s"} found.\n`);
  }
}

function updateReadme(projectRoot, config) {
  const readmePath = path.join(projectRoot, "README.md");

  if (!fs.existsSync(readmePath)) {
    return false;
  }

  const startMarker = "<!-- CMSKIT:START -->";
  const endMarker = "<!-- CMSKIT:END -->";

  const existing = fs.readFileSync(readmePath, "utf8");

  const startIndex = existing.indexOf(startMarker);
  const endIndex = existing.indexOf(endMarker);

  if (startIndex === -1 || endIndex === -1) {
    console.log("⚠ CMSKit README section not found. Skipping README update.");
    return false;
  }

  const coreModules = ["pages", "posts", "media"];

  const optionalModules = {
    forms: "Forms",
    menus: "Menus",
    seo: "SEO",
    ecommerce: "E-commerce",
    billing: "Billing",
  };

  const coreNames = {
    pages: "Pages",
    posts: "Posts",
    media: "Media",
  };

  const installedCore = coreModules
    .filter((mod) => config.modules.includes(mod))
    .map((mod) => `- ${coreNames[mod]}`)
    .join("\n");

  const installedOptional = Object.entries(optionalModules)
    .filter(([mod]) => config.modules.includes(mod))
    .map(([, name]) => `- ${name}`)
    .join("\n");

  const optionalSection = installedOptional || "No optional modules installed.";

  const cmskitSection = `<!-- CMSKIT:START -->

## CMSKit

Version: ${config.cmskitVersion || "1.0.0"}

## Installed Modules

### Core

${installedCore}

### Optional

${optionalSection}

## Available Modules

### Forms

\`\`\`bash
cmskit add forms
\`\`\`

### Menus

\`\`\`bash
cmskit add menus
\`\`\`

### SEO

\`\`\`bash
cmskit add seo
\`\`\`

### Ecommerce

\`\`\`bash
cmskit add ecommerce
\`\`\`

### Billing

\`\`\`bash
cmskit add billing
\`\`\`

## CMSKit Commands

\`\`\`bash
cmskit status
cmskit list
cmskit doctor
cmskit add <module>
cmskit update
cmskit --version
\`\`\`

<!-- CMSKIT:END -->`;

  const before = existing.slice(0, startIndex);
  const after = existing.slice(endIndex + endMarker.length);

  fs.writeFileSync(readmePath, `${before}${cmskitSection}${after}`, "utf8");
  return true;
}

function copyRecursive(src, destRoot) {
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const relative = path.relative(
      path.join(projectRoot, ".cmskit-modules", moduleArg),
      srcPath,
    );
    const destPath = path.join(destRoot, relative);
    if (entry.isDirectory()) {
      fs.mkdirSync(destPath, { recursive: true });
      copyRecursive(srcPath, destRoot);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function stripUnknownRelations(schemaText) {
  const definedTypes = new Set();
  const typeRegex = /^(model|enum)\s+(\w+)/gm;
  let match;
  while ((match = typeRegex.exec(schemaText))) {
    definedTypes.add(match[2]);
  }
  const builtins = new Set([
    "String",
    "Int",
    "Boolean",
    "DateTime",
    "Json",
    "Decimal",
    "Float",
    "BigInt",
    "Bytes",
  ]);

  return schemaText.replace(
    /model\s+(\w+)\s*\{([\s\S]*?)\n\}/g,
    (full, modelName, body) => {
      const keptLines = body.split("\n").filter((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("@@"))
          return true;
        const fieldMatch = trimmed.match(/^(\w+)\s+([A-Za-z_]\w*)(\[\])?(\?)?/);
        if (!fieldMatch) return true;
        const typeName = fieldMatch[2];
        if (builtins.has(typeName)) return true;
        return definedTypes.has(typeName);
      });
      return `model ${modelName} {${keptLines.join("\n")}\n}`;
    },
  );
}
