import { notFound } from "next/navigation";
import Link from "next/link";
import { getCustomerOrderById } from "@/src/app/lib/services/ecommerce/ecom.orders.service";
import { formatMoney } from "@/src/lib/storefront/data";
export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const order = await getCustomerOrderById((await params).id);
  if (!order) notFound();
  return (
    <main className="mx-auto max-w-3xl px-5 py-16 md:px-10">
      <Link
        href="/account/orders"
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← Order history
      </Link>
      <p className="mt-12 text-xs uppercase tracking-[0.2em] text-muted-foreground">
        {order.status}
      </p>
      <h1 className="mt-3 text-5xl tracking-tight">
        Order {order.orderNumber}
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Placed {new Date(order.createdAt).toLocaleDateString()}. We’ll keep you
        posted as your order moves.
      </p>
      <div className="mt-16 divide-y divide-border border-y border-border">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between py-5 text-sm">
            <span>
              {item.productTitle} × {item.quantity}
            </span>
            <span>{formatMoney(Number(item.total))}</span>
          </div>
        ))}
      </div>
      <div className="flex justify-between border-b border-border py-5 text-sm">
        <span>Total</span>
        <span>{formatMoney(Number(order.total))}</span>
      </div>
    </main>
  );
}
