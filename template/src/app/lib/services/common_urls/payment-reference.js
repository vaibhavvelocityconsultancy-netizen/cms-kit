export function getPaymentOrderReference(payment = {}) {
  if (!payment || typeof payment !== "object") return null;

  return (
    payment.paypalOrderId || payment.paypalSubscriptionId || payment.id || null
  );
}
