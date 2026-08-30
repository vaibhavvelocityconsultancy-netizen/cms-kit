#!/usr/bin/env node
import path from "node:path";
import process from "node:process";
import fs from "node:fs";
import fsExtra from "fs-extra";
import { checkbox, input, select, confirm } from "@inquirer/prompts";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import mysql from "mysql2/promise";

const { copy, pathExists, remove, writeFile } = fsExtra;

const args = process.argv.slice(2);
const cliProjectName = args[0];

const DEFAULT_MODULES = ["pages", "posts", "media"];

const MODULES = [
  { name: "Forms", value: "forms" },
  { name: "Menus", value: "menus" },
  { name: "E-commerce", value: "ecommerce" },
  {
    name: "SEO (redirects, sitemap, analytics, internal linking)",
    value: "seo",
  },
  { name: "Billing / Subscriptions", value: "billing" },
];
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

async function mergePrismaSchemas(target, modules) {
  const prismaDir = path.join(target, "prisma");
  const readSchema = (file) =>
    fs.readFileSync(path.join(prismaDir, file), "utf8");

  let finalSchema = readSchema("schema.core.prisma");

  for (const mod of modules) {
    const modFile = `schema.${mod}.prisma`;
    const modPath = path.join(prismaDir, modFile);
    if (fs.existsSync(modPath)) {
      finalSchema += "\n\n" + readSchema(modFile);
    }
  }

  finalSchema = stripUnknownRelations(finalSchema);

  for (const file of [
    "schema.core.prisma",
    "schema.pages.prisma",
    "schema.posts.prisma",
    "schema.media.prisma",
    "schema.forms.prisma",
    "schema.menus.prisma",
    "schema.ecommerce.prisma",
    "schema.seo.prisma",
    "schema.billing.prisma",
  ]) {
    const p = path.join(prismaDir, file);
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }

  await writeFile(path.join(prismaDir, "schema.prisma"), finalSchema, "utf8");
}

async function ensureDatabaseExists({ host, port, user, password, database }) {
  const connection = await mysql.createConnection({
    host,
    port: Number(port),
    user,
    password,
  });
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\`;`);
  await connection.end();
}

const MODULE_FOLDERS = {
  pages: [
    "src/app/admin/pages",
    "src/app/api/pages",
    "src/app/lib/services/pages",
    "src/components/admin/pages",
  ],
  posts: [
    "src/app/admin/posts",
    "src/app/api/posts",
    "src/app/(public)/posts",
    "src/app/lib/services/posts",
    "src/components/admin/posts",
    "src/app/admin/categories",
    "src/app/api/categories",
    "src/components/admin/category",
    "src/app/admin/tags",
    "src/app/api/tags",
    "src/components/admin/tags",
    "src/app/admin/comments",
    "src/app/api/comments",
    "src/components/admin/comments",
  ],
  media: [
    "src/app/admin/media",
    "src/app/api/media",
    "src/app/lib/services/media",
    "src/components/media-manager",
  ],
  forms: [
    "src/app/admin/forms",
    "src/app/api/form",
    "src/app/lib/services/forms",
    "src/components/admin/form",
  ],
  menus: ["src/app/admin/menus", "src/app/api/menus"],
  billing: [
    "src/app/admin/plan-management",
    "src/app/admin/subscription",
    "src/app/api/payment",
    "src/app/api/plan-payment",
    "src/app/api/plans",
    "src/app/api/subscription",
    "src/app/api/subscription-user",
    "src/app/subscription",
    "src/app/lib/services/subscription",
    "src/components/admin/plans",
    "src/components/subscription",
    "src/hooks/use-subscription.ts",
    "src/lib/subscription",
  ],
};

function isExcludedModuleFolder(normalizedPath, selectedModules) {
  for (const [modName, folders] of Object.entries(MODULE_FOLDERS)) {
    if (selectedModules.includes(modName)) continue;
    for (const folder of folders) {
      if (
        normalizedPath.includes(`/${folder}/`) ||
        normalizedPath.endsWith(`/${folder}`)
      ) {
        return true;
      }
    }
  }
  return false;
}

async function main() {
  console.log("\n🚀 CMSKit\n");

  const projectName =
    cliProjectName ||
    (await input({
      message: "Project name:",
      default: "my-cms",
      validate(value) {
        return /^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(value)
          ? true
          : "Use letters, numbers, dots, hyphens or underscores.";
      },
    }));

  const target = path.resolve(process.cwd(), projectName);

  if ((await pathExists(target)) && fs.readdirSync(target).length > 0) {
    console.error(`\n❌ ${target} already exists and is not empty.\n`);
    process.exit(1);
  }

  const database = await select({
    message: "Database:",
    choices: [
      { name: "MySQL (current CMS schema)", value: "mysql" },
      {
        name: "SQLite (coming in the database adapter phase)",
        value: "sqlite",
      },
    ],
  });

  const optionalModules = await checkbox({
    message: "Select additional modules:",
    choices: MODULES,
  });

  const modules = [...DEFAULT_MODULES, ...optionalModules];

  const sampleContent = await confirm({
    message: "Create default Home and Posts pages?",
    default: true,
  });

  const dbHost = await input({
    message: "Database host:",
    default: "localhost",
  });
  const dbPort = await input({ message: "Database port:", default: "3306" });
  const dbName = await input({
    message: "Database name:",
    default: projectName.replace(/[^a-zA-Z0-9_]/g, "_"),
  });
  const dbUser = await input({ message: "Database user:", default: "root" });
  const dbPassword = await input({
    message: "Database password:",
    default: "",
  });
  if (database === "sqlite") {
    console.log(
      "\n⚠ SQLite is selected, but the current Prisma schema contains MySQL-specific/enumerated features.",
    );
    console.log("CMSKit will not silently generate a broken SQLite project.");
    console.log(
      "For this first version, choose MySQL. SQLite support will be added by converting the Prisma schema safely.\n",
    );
    process.exit(1);
  }

  console.log("\nCreating project...\n");

  const template = fileURLToPath(new URL("../template", import.meta.url));

  await copy(template, target, {
    filter: (src) => {
      const normalized = src.replaceAll("\\", "/");
      if (
        normalized.includes("/node_modules/") ||
        normalized.includes("/.next/") ||
        normalized.includes("/.git/") ||
        normalized.includes("/prisma/migrations/") ||
        normalized.endsWith("/prisma/schema.prisma")
      ) {
        return false;
      }
      if (isExcludedModuleFolder(normalized, modules)) return false;
      return true;
    },
  });

  const dbUrl = `mysql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;

const env = [
  `# Generated by CMSKit`,
  `DATABASE_URL="${dbUrl}"`,
  `NEXT_PUBLIC_APP_URL="http://localhost:3000"`,
  `NEXT_PUBLIC_SITE_URL="http://localhost:3000"`,
  "",
].join("\n"); 

  await writeFile(path.join(target, ".env"), env, "utf8");

  await writeFile(
    path.join(target, "cmskit.config.json"),
    JSON.stringify(
      {
        version: 1,
        database,
        modules,
        sampleContent,
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );

  console.log("✔ Project files copied");
  await mergePrismaSchemas(target, modules);
  console.log("✔ Prisma schema generated for selected modules");
  console.log("✔ .env created");
  console.log(`✔ Modules selected: ${modules.join(", ")}`);
  console.log("✔ CMSKit configuration created");

  console.log("\nInstalling dependencies (this may take a minute)...\n");
  execSync("npm install", { cwd: target, stdio: "inherit" });
  console.log("\n✔ Dependencies installed");
  console.log("\nCreating database if it doesn't exist...\n");
  await ensureDatabaseExists({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });
  console.log("✔ Database ready");

  console.log("\nSetting up Prisma...\n");
  execSync("npx prisma generate", { cwd: target, stdio: "inherit" });
  execSync("npx prisma migrate dev --name init", {
    cwd: target,
    stdio: "inherit",
  });
  console.log("\n✔ Database ready");

  console.log("\nSeeding admin user...\n");
  execSync("node prisma/seed.js", { cwd: target, stdio: "inherit" });

  if (sampleContent) {
    console.log("\nSeeding default content...\n");
    execSync("node prisma/seed-cmskit.js", { cwd: target, stdio: "inherit" });
  }

  console.log("\n🎉 CMSKit project created!\n");
  console.log(`  cd ${projectName}`);
  console.log("  npm run dev\n");
}

main().catch((error) => {
  console.error("\n❌ CMSKit failed:", error);
  process.exit(1);
});
