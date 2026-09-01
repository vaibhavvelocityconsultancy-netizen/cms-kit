import { prisma } from "@/src/app/lib/prisma";
import GatewaySelector from "@/src/components/storefront/GatewaySelector";

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ plan?: string; billingCycle?: string }> }) {
  const params = await searchParams;
  const plan = params.plan ? await prisma.plan.findUnique({ where: { id: Number(params.plan) } }) : null;
  if (!plan) return <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6"><p>Choose a plan to continue.</p></main>;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-2"><p className="text-sm text-muted-foreground">Subscription checkout</p><h1 className="text-balance text-4xl font-semibold">{plan.name}</h1><p className="text-muted-foreground">{plan.description ?? "Complete your subscription securely."}</p></header>
      <section className="flex flex-col gap-6 border border-border p-6"><div className="flex items-center justify-between"><span>Due today</span><strong>{plan.price ? `$${Number(plan.price).toFixed(2)}` : "Free"}</strong></div><GatewaySelector amount={Number(plan.price ?? 0)} createPayment={async (provider) => { const response = await fetch("/api/plan-payment/create-order", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ planId: plan.id, billingCycle: params.billingCycle ?? "MONTHLY", provider }) }); const data = await response.json(); if (!response.ok) throw new Error(data.message ?? "Unable to start checkout"); return data.data ?? data; }} submitLabel="Pay and subscribe" /></section>
    </main>
  );
}
