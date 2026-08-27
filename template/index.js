import { config } from "dotenv";
config({ path: ".env" });

import { prisma } from "./src/app/lib/prisma.js";
import { updatePlan } from "./src/app/lib/services/subscription/subscription.service.js";

console.log("PAYPAL_PRODUCT_ID:", process.env.PAYPAL_PRODUCT_ID);

async function run() {
  console.log("Fetching plans...");
  const plans = await prisma.plan.findMany();
  console.log(`Found ${plans.length} plans`);

  for (const plan of plans) {
    console.log(`Updating: ${plan.title}`);
    try {
      await updatePlan(plan.id, plan.tenantId, {
        title: plan.title,
        monthlyPrice: plan.monthlyPrice,
        yearlyPrice: plan.yearlyPrice,
        allowMonthly: plan.allowMonthly,
        allowYearly: plan.allowYearly,
        trialDays: plan.trialDays,
        features: [],
      });
      console.log(`✅ Done: ${plan.title}`);
    } catch (err) {
      console.error(`❌ Failed: ${plan.title}`, err.message);
    }
  }

  console.log("All done.");
  process.exit(0);
}

run().catch((err) => {
  console.error("Script crashed:", err);
  process.exit(1);
});