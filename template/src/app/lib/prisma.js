import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

const getPrismaUrl = () => {
  const baseUrl =
    process.env.DATABASE_URL ||
    process.env.MYSQL_URL ||
    process.env.PRISMA_DATABASE_URL ||
    "";

  if (!baseUrl) return baseUrl;

  if (baseUrl.includes("connection_limit=")) return baseUrl;

  return `${baseUrl}${baseUrl.includes("?") ? "&" : "?"}connection_limit=10`;
};

const createPrismaClient = () =>
  new PrismaClient({
    datasources: {
      db: {
        url: getPrismaUrl(),
      },
    },
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

const delegateAliases = {
  footerSettings: "footersettings",
  formSubmission: "formsubmission",
  menuItem: "menuitem",
  rolePermission: "rolepermission",
  siteSettings: "sitesettings",
  userPermission: "userpermission",
};

const createPrismaProxy = (client) =>
  new Proxy(client, {
    get(target, prop, receiver) {
      const value = Reflect.get(target, prop, receiver);
      if (value !== undefined || typeof prop !== "string") {
        return value;
      }
      const alias = delegateAliases[prop];
      return alias ? Reflect.get(target, alias, receiver) : value;
    },
  });

const prisma =
  globalForPrisma.prisma ?? createPrismaProxy(createPrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export { prisma };
