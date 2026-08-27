// prisma/seed-cmskit.js
// Seeds default sample content based on cmskit.config.json module selection.
// Runs only when the user opted into "Create default Home and Posts pages?"

import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const configPath = path.resolve(process.cwd(), "cmskit.config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const modules = config.modules || [];

  const tenant = await prisma.tenant.findFirst();
  if (!tenant) {
    console.error("No tenant found — run prisma/seed.js first.");
    process.exit(1);
  }

  if (modules.includes("pages")) {
    await prisma.page.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: "home" } },
      update: {},
      create: {
        title: "Home",
        slug: "home",
        html: "<h1>Welcome to your new CMSKit site</h1>",
        tenantId: tenant.id,
      },
    });
    console.log("✔ Default Home page seeded");
  }

  if (modules.includes("posts")) {
    await prisma.post.upsert({
      where: { tenantId_slug: { tenantId: tenant.id, slug: "hello-world" } },
      update: {},
      create: {
        id: "hello-world",
        title: "Hello World",
        slug: "hello-world",
        content: "<p>This is your first post. Edit or delete it to get started.</p>",
        tenantId: tenant.id,
      },
    });
    console.log("✔ Sample post seeded");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });