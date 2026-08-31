import paypal from "@paypal/checkout-server-sdk";

function client() {
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) throw new Error("paypal provider not configured");
  const Environment = process.env.PAYPAL_MODE === "live" ? paypal.core.LiveEnvironment : paypal.core.SandboxEnvironment;
  return new paypal.core.PayPalHttpClient(new Environment(process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET));
}

export async function createPayment({ amount, currency = "USD", returnUrl, cancelUrl, userId, paymentType, referenceId }) {
  const request = new paypal.orders.OrdersCreateRequest();
  request.prefer("return=representation");
  request.requestBody({ intent: "CAPTURE", application_context: { return_url: returnUrl, cancel_url: cancelUrl }, purchase_units: [{ amount: { currency_code: currency.toUpperCase(), value: Number(amount).toFixed(2) }, custom_id: `${userId ?? ""}:${paymentType ?? ""}:${referenceId ?? ""}` }] });
  const { result } = await client().execute(request);
  return { id: result.id, orderId: result.id, status: result.status, approvalUrl: result.links?.find((link) => link.rel === "approve")?.href };
}

export async function capturePayment(orderId) {
  const request = new paypal.orders.OrdersCaptureRequest(orderId);
  request.requestBody({});
  const { result } = await client().execute(request);
  if (result.status !== "COMPLETED") throw new Error("PayPal payment not completed");
  return result;
}
export async function retrievePayment(orderId) { const request = new paypal.orders.OrdersGetRequest(orderId); return (await client().execute(request)).result; }
export default { createPayment, capturePayment, retrievePayment };
