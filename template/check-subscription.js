import { prisma } from "./src/app/prisma.js";

async function checkSubscription() {
  const subscription = await prisma.planSubscription.findFirst({
    where: { userId: 18 },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });

  console.log("Current subscription in DB:");
  console.log(JSON.stringify(subscription, null, 2));

  const now = new Date();
  console.log("\nCurrent server time:", now.toISOString());

  if (subscription) {
    console.log("Trial ends at:", subscription.trialEndsAt?.toISOString());
    console.log("Has expired?", subscription.trialEndsAt <= now);
    console.log("Status:", subscription.status);
  }

  process.exit(0);
}

checkSubscription();
