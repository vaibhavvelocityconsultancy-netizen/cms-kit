import { PrismaClient, user_role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: {
      slug: "ipdav",
    },
    update: {},
    create: {
      name: "IPDAV",
      slug: "ipdav",
    },
  });

  const hashedPassword = await bcrypt.hash("admin@123", 10);

  await prisma.user.upsert({
    where: {
      email: "admin@gmail.com",
    },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: user_role.SUPER_ADMIN,
      tenantId: tenant.id,
    },
  });

  console.log("✅ Super Admin created");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
