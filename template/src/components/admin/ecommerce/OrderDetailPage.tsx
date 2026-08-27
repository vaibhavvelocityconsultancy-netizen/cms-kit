"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  ArrowLeft,
  Printer,
  Receipt,
  User as UserIcon,
  MapPin,
  CreditCard,
  MessageSquare,
  Loader2,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";
import { Button } from "@/src/ui/button";
import { Badge } from "@/src/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/src/ui/card";
import { Textarea } from "@/src/ui/textarea";
import { Switch } from "@/src/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/ui/alert-dialog";
import { toast } from "@/src/hooks/use-toast";
import { useEcomSettings } from "@/src/lib/ecom/useEcomSettings";
import { formatMoney, formatDateTime } from "@/src/lib/ecom/format";
import { orderService } from "@/src/services/OrderServices";

const ORDER_STATUSES = ["PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"];
const PAYMENT_STATUSES = ["PENDING", "PAID", "FAILED", "REFUNDED", "PARTIAL"];

interface Address {
  fullName?: string;
  phone?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

function AddressBlock({ address, label }: { address?: Address | null; label: string }) {
  if (!address) return <p className="text-xs text-muted-foreground">Not provided</p>;
  return (
    <div className="text-sm space-y-0.5">
      {address.fullName && <p className="font-medium">{address.fullName}</p>}
      {address.addressLine1 && <p>{address.addressLine1}</p>}
      {address.addressLine2 && <p>{address.addressLine2}</p>}
      <p>
        {[address.city, address.state, address.postalCode].filter(Boolean).join(", ")}
      </p>
      {address.country && <p>{address.country}</p>}
      {address.phone && <p className="text-muted-foreground text-xs pt-1">📞 {address.phone}</p>}
    </div>
  );
}

export function OrderDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { settings } = useEcomSettings();
  const { data, isLoading, error, mutate } = useSWR(
    id ? `ecom-order-${id}` : null,
    () => orderService.getById(id),
  );
  const order = data?.data;

  const [newNote, setNewNote] = useState("");
  const [customerVisible, setCustomerVisible] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<"status" | "paymentStatus" | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function updateStatus(field: "status" | "paymentStatus", value: string) {
    setUpdatingStatus(field);
    try {
      await orderService.update(id, { [field]: value });
      toast({ title: "Order updated" });
      await mutate();
    } catch (err: any) {
      toast({ title: "Update failed", description: err?.message, variant: "destructive" });
    } finally {
      setUpdatingStatus(null);
    }
  }

  async function addNote() {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await orderService.addNote(id, {
        note: newNote.trim(),
        isCustomerVisible: customerVisible,
      });
      setNewNote("");
      setCustomerVisible(false);
      toast({ title: "Note added" });
      await mutate();
    } catch (err: any) {
      toast({ title: "Failed to add note", description: err?.message, variant: "destructive" });
    } finally {
      setAddingNote(false);
    }
  }

  async function deleteOrder() {
    setDeleting(true);
    try {
      await orderService.delete(id);
      toast({ title: "Order deleted" });
      router.push("/admin/ecommerce/orders");
    } catch (err: any) {
      toast({ title: "Delete failed", description: err?.message, variant: "destructive" });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading order…
      </div>
    );
  }
  if (error || !order) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 text-center">
        <p className="text-destructive font-medium mb-2">Failed to load order</p>
        <Button variant="outline" onClick={() => mutate()}>Retry</Button>
      </div>
    );
  }

  const currency = order.currency || settings.currency;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4" data-testid="order-detail-page">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Button
            variant="ghost" size="sm"
            onClick={() => router.push("/admin/ecommerce/orders")}
            className="mb-2 gap-1.5 text-muted-foreground -ml-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to orders
          </Button>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-2xl font-bold font-mono">{order.orderNumber}</h1>
            <span className="text-sm text-muted-foreground">
              · {formatDateTime(order.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()} data-testid="order-print-btn">
            <Printer className="h-4 w-4 mr-2" />
            Print / invoice
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            data-testid="order-delete-btn"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Line items */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Line items</CardTitle>
              <CardDescription className="text-xs">{order.items?.length ?? 0} item(s)</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead className="w-[120px]">SKU</TableHead>
                    <TableHead className="w-[80px] text-right">Qty</TableHead>
                    <TableHead className="w-[110px] text-right">Price</TableHead>
                    <TableHead className="w-[110px] text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(order.items ?? []).map((it: any) => (
                    <TableRow key={it.id}>
                      <TableCell className="text-sm font-medium">{it.productTitle}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{it.sku || "—"}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{it.quantity}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{formatMoney(it.price, currency)}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums font-medium">{formatMoney(it.total, currency)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t bg-muted/20 p-4 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="tabular-nums">{formatMoney(order.subtotal, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="tabular-nums">{formatMoney(order.shippingCost, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="tabular-nums">{formatMoney(order.taxAmount, currency)}</span>
                </div>
                {Number(order.discountAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</span>
                    <span className="tabular-nums">− {formatMoney(order.discountAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border/50 font-semibold text-base">
                  <span>Total</span>
                  <span className="tabular-nums">{formatMoney(order.total, currency)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base">Notes</CardTitle>
                  <CardDescription className="text-xs">Internal or customer-visible</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {(order.notes ?? []).length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No notes yet.</p>
                )}
                {(order.notes ?? []).map((n: any) => (
                  <div key={n.id} className="rounded-md border p-3 bg-card">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                      <span>{formatDateTime(n.createdAt)}</span>
                      <span>·</span>
                      {n.isCustomerVisible ? (
                        <Badge variant="secondary" className="text-[10px] gap-1 py-0">
                          <Eye className="h-2.5 w-2.5" />
                          Visible to customer
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] gap-1 py-0">
                          <EyeOff className="h-2.5 w-2.5" />
                          Internal
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{n.note}</p>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  placeholder="Add a note about this order…"
                  data-testid="order-note-input"
                />
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <Switch
                      checked={customerVisible}
                      onCheckedChange={(v: boolean) => setCustomerVisible(v)}
                    />
                    <span>Visible to customer</span>
                  </label>
                  <Button
                    size="sm"
                    onClick={addNote}
                    disabled={!newNote.trim() || addingNote}
                    data-testid="order-note-add-btn"
                  >
                    {addingNote ? "Adding…" : "Add note"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Status controls */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Order status</label>
                <Select
                  value={order.status}
                  onValueChange={(v) => updateStatus("status", v)}
                  disabled={updatingStatus === "status"}
                >
                  <SelectTrigger data-testid="order-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Payment status</label>
                <Select
                  value={order.paymentStatus}
                  onValueChange={(v) => updateStatus("paymentStatus", v)}
                  disabled={updatingStatus === "paymentStatus"}
                >
                  <SelectTrigger data-testid="order-payment-status-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Customer */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Customer</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              {order.user ? (
                <>
                  <p className="font-medium">{order.user.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">{order.user.email}</p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">Guest checkout</p>
              )}
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Shipping address</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <AddressBlock address={order.shippingAddress} label="Shipping" />
            </CardContent>
          </Card>

          {/* Billing */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Billing address</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <AddressBlock address={order.billingAddress} label="Billing" />
            </CardContent>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Payment</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Method:</span> {order.paymentMethod}</p>
              {order.razorpayOrderId && (
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {order.razorpayOrderId}
                </p>
              )}
              {order.razorpayPaymentId && (
                <p className="text-xs text-muted-foreground font-mono truncate">
                  Payment: {order.razorpayPaymentId}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete order?</AlertDialogTitle>
            <AlertDialogDescription>
              Delete <span className="font-mono font-medium">{order.orderNumber}</span>? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteOrder}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default OrderDetailPage;
