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

const PAYMENT_GATEWAYS = [
  { name: "Stripe", value: "stripe" },
  { name: "Razorpay", value: "razorpay" },
  { name: "PayPal", value: "paypal" },
];

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

function generateReadme(target, modules) {
  const readmePath = path.join(target, "README.md");

  const coreModules = ["pages", "posts", "media"];
  const optionalModules = ["forms", "menus", "seo", "ecommerce", "billing"];

  const coreNames = {
    pages: "Pages",
    posts: "Posts",
    media: "Media",
  };

  const optionalNames = {
    forms: "Forms",
    menus: "Menus",
    seo: "SEO",
    ecommerce: "E-commerce",
    billing: "Billing",
  };

  const installedCore = coreModules
    .filter((mod) => modules.includes(mod))
    .map((mod) => `- ${coreNames[mod]}`)
    .join("\n");

  const installedOptional = optionalModules
    .filter((mod) => modules.includes(mod))
    .map((mod) => `- ${optionalNames[mod]}`)
    .join("\n");

  const optionalSection = installedOptional || "No optional modules installed.";

  const content = `# CMSKit Project

<!-- CMSKIT:START -->

## CMSKit

Version: 1.0.0

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
cmskit add <module>
cmskit update
cmskit --version
\`\`\`

<!-- CMSKIT:END -->

## Project Documentation

Add your project-specific documentation here.
`;

  fs.writeFileSync(readmePath, content, "utf8");
}

async function mergePrismaSchemas(target, modules) {
  const prismaDir = path.join(target, "prisma");
  const cacheDir = path.join(target, ".cmskit-modules", "prisma");
  fsExtra.ensureDirSync(cacheDir);
  const readSchema = (file) =>
    fs.readFileSync(path.join(prismaDir, file), "utf8");

  // Always cache the pristine core (needed later to rebuild schema.prisma from scratch)
  fs.copyFileSync(
    path.join(prismaDir, "schema.core.prisma"),
    path.join(cacheDir, "schema.core.prisma"),
  );

  let finalSchema = readSchema("schema.core.prisma");

  for (const mod of modules) {
    const modFile = `schema.${mod}.prisma`;
    const modPath = path.join(prismaDir, modFile);
    if (fs.existsSync(modPath)) {
      finalSchema += "\n\n" + readSchema(modFile);
      fs.copyFileSync(modPath, path.join(cacheDir, modFile)); // cache even installed ones
    }
  }

  // Cache fragments for modules NOT selected too (they still exist in prismaDir at this point)
  const allFragmentFiles = fs
    .readdirSync(prismaDir)
    .filter((f) => f.startsWith("schema.") && f !== "schema.prisma");
  for (const file of allFragmentFiles) {
    fs.copyFileSync(path.join(prismaDir, file), path.join(cacheDir, file));
    fs.unlinkSync(path.join(prismaDir, file));
  }

  finalSchema = stripUnknownRelations(finalSchema);
  await writeFile(path.join(prismaDir, "schema.prisma"), finalSchema, "utf8");

  // Save selected modules list for cmskit add to read later
  fs.writeFileSync(
    path.join(target, "cmskit.installed-modules.json"),
    JSON.stringify(modules, null, 2),
  );
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
  forms: [
    "src/app/admin/forms",
    "src/app/api/form",
    "src/app/lib/services/forms",
    "src/components/admin/form",
  ],
  menus: ["src/app/admin/menus", "src/app/api/menus"],
  media: [
    "src/app/admin/media",
    "src/app/api/media",
    "src/app/lib/services/media",
    "src/components/media-manager",
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
  pages: [
    "src/app/admin/pages",
    "src/app/api/pages",
    "src/app/lib/services/pages",
    "src/components/admin/pages",
  ],
  ecommerce: [
    "src/app/admin/ecommerce",
    "src/app/api/ecommerce",
    "src/app/api/public/ecommerce",
    "src/app/lib/services/ecommerce",
    "src/components/admin/ecommerce",
    "src/app/(public)/account/orders",
  ],
  seo: [
    "src/app/admin/seo",
    "src/app/admin/SeoSettingsSection.tsx",
    "src/app/api/seo",
    "src/app/api/redirects",
    "src/app/api/analytics",
    "src/app/api/internal-link-rules",
    "src/app/api/ai-crawl-content",
    "src/app/api/llms-txt",
    "src/app/llms",
    "src/app/robots.txt",
    "src/app/sitemap.xml",
    "src/app/sitemap.xsl",
    "src/components/admin/seo/sitemap.tsx",
    "src/components/admin/seo/RedirectManager.tsx",
    "src/components/admin/seo/RuleFormDialog.tsx",
    "src/components/SeoEditorPage.tsx",
  ],
  billing: [
    "src/app/admin/plan-management",
    "src/app/admin/subscription",
    "src/app/api/payment",
    "src/app/api/plan-payment",
    "src/app/api/plans",
    "src/app/api/subscription",
    "src/app/api/subscription-user",
    "src/app/subscription",
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
  const paymentGateways =
    optionalModules.includes("billing") || optionalModules.includes("ecommerce")
      ? await checkbox({
          message: "Select payment gateways:",
          choices: PAYMENT_GATEWAYS,
        })
      : [];

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

  // Copy everything (nothing skipped except node_modules/.next/.git/migrations/schema.prisma)
  await copy(template, target, {
    filter: (src) => {
      const normalized = src.replaceAll("\\", "/");
      return (
        !normalized.includes("/node_modules/") &&
        !normalized.includes("/.next/") &&
        !normalized.includes("/.git/") &&
        !normalized.includes("/prisma/migrations/") &&
        !normalized.endsWith("/prisma/schema.prisma")
      );
    },
  });

  // Stash unselected modules' files into a cache, so they can be added later
  function stashUnselectedModules(target, selectedModules) {
    for (const [mod, folders] of Object.entries(MODULE_FOLDERS)) {
      if (selectedModules.includes(mod)) continue;
      for (const folder of folders) {
        const src = path.join(target, folder);
        const dest = path.join(target, ".cmskit-modules", mod, folder);
        if (fs.existsSync(src)) {
          fsExtra.ensureDirSync(path.dirname(dest));
          fsExtra.moveSync(src, dest, { overwrite: true });
        }
      }
    }
  }
  stashUnselectedModules(target, modules);

  const dbUrl = `mysql://${encodeURIComponent(dbUser)}:${encodeURIComponent(dbPassword)}@${dbHost}:${dbPort}/${dbName}`;

  const env = [
    `# Generated by CMSKit`,
    `DATABASE_URL="${dbUrl}"`,
    `NEXT_PUBLIC_APP_URL="http://localhost:3000"`,
    `NEXT_PUBLIC_SITE_URL="http://localhost:3000"`,
    ...(paymentGateways.includes("stripe")
      ? [
          "STRIPE_SECRET_KEY=",
          "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=",
          "STRIPE_WEBHOOK_SECRET=",
        ]
      : []),
    ...(paymentGateways.includes("razorpay")
      ? ["RAZORPAY_KEY_ID=", "RAZORPAY_KEY_SECRET="]
      : []),
    ...(paymentGateways.includes("paypal")
      ? [
          "NEXT_PUBLIC_PAYPAL_CLIENT_ID=",
          "PAYPAL_CLIENT_SECRET=",
          "PAYPAL_MODE=sandbox",
        ]
      : []),
    "",
  ].join("\n");

  await fsExtra.ensureDir(target);
  await writeFile(path.join(target, ".env"), env, "utf8");
  await writeFile(
    path.join(target, "cmskit.config.json"),
    JSON.stringify(
      {
        version: 1,
        cmskitVersion: "1.0.0",
        database,
        modules,
        paymentGateways,
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
  generateReadme(target, modules);
  console.log("✔ CMSKit configuration created");
  console.log("✔ README.md generated");

  console.log("\nInstalling dependencies (this may take a minute)...\n");
  execSync("npm install", { cwd: target, stdio: "inherit" });
  console.log("\n✔ Dependencies installed");

  let dbSetupSucceeded = false;

  try {
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

    console.log("\nSeeding admin user...\n");
    execSync("node prisma/seed.js", { cwd: target, stdio: "inherit" });

    if (sampleContent) {
      console.log("\nSeeding default content...\n");
      execSync("node prisma/seed-cmskit.js", { cwd: target, stdio: "inherit" });
    }

    dbSetupSucceeded = true;
  } catch (dbError) {
    console.log("\n⚠ Could not connect to the database.\n");
    console.log(
      "Your project files were created successfully, but the database setup failed.",
    );
    console.log(
      "This usually means the host/port/username/password in .env is incorrect, or MySQL isn't running.\n",
    );
    console.log("To fix it:");
    console.log(`  1. Open ${projectName}/.env and check DATABASE_URL`);
    console.log("  2. Make sure MySQL is running and reachable");
    console.log(`  3. cd ${projectName}`);
    console.log("  4. npx prisma generate");
    console.log("  5. npx prisma migrate dev --name init");
    console.log("  6. node prisma/seed.js\n");
  }

  if (dbSetupSucceeded) {
    console.log("\n🎉 CMSKit project created and database connected!\n");
  } else {
    console.log(
      "\n📁 CMSKit project created (database setup incomplete — see above).\n",
    );
  }
  console.log(`  cd ${projectName}`);
  console.log("  npm run dev\n");
}

main().catch((error) => {
  console.error("\n❌ CMSKit failed:", error);
  process.exit(1);
});
