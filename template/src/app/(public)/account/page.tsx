import Link from "next/link";
import { accountOrders, formatMoney } from "@/src/lib/storefront/data";
export default function AccountPage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-16 md:px-10">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
        Account
      </p>
      <h1 className="mt-3 text-5xl tracking-tight">Welcome back.</h1>
      <div className="mt-16 grid gap-12 md:grid-cols-2">
        <div className="border-t border-border pt-5">
          <p className="text-sm">Order history</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Sign in to view saved details and order history.
          </p>
          <Link
            href="/account/orders"
            className="mt-6 inline-block text-sm underline underline-offset-4"
          >
            View orders
          </Link>
        </div>
        <div className="border-t border-border pt-5">
          <p className="text-sm">Saved details</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Keep your shipping details close for a quicker checkout.
          </p>
          <button className="mt-6 text-sm underline underline-offset-4">
            Sign in
          </button>
        </div>
      </div>
      <div className="mt-20 border-t border-border pt-6">
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Recent order
        </p>
        <Link
          href={`/account/orders/${accountOrders[0].id}`}
          className="mt-5 flex items-center justify-between text-sm"
        >
          <span>
            {accountOrders[0].id} · {accountOrders[0].status}
          </span>
          <span>{formatMoney(accountOrders[0].total)}</span>
        </Link>
      </div>
    </main>
  );
}
