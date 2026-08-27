import Link from "next/link";
import { accountOrders, formatMoney } from "@/src/lib/storefront/data";
export default function OrdersPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-16 md:px-10">
      <Link
        href="/account"
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← Account
      </Link>
      <h1 className="mt-8 text-5xl tracking-tight">Order history</h1>
      <div className="mt-16 divide-y divide-border border-y border-border">
        {accountOrders.map((order) => (
          <Link
            key={order.id}
            href={`/account/orders/${order.id}`}
            className="flex items-center justify-between gap-4 py-6 text-sm hover:bg-muted/40"
          >
            <div>
              <p>{order.id}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {order.date} · {order.status}
              </p>
            </div>
            <span>{formatMoney(order.total)}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
