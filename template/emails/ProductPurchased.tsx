import { Text } from "@react-email/components";
import { EmailLayout, SummaryRow } from "./components/Layout";

interface ProductPurchasedProps {
  name: string;
  orderNumber: string;
  currency: string;
  amount: number;
}

export default function ProductPurchased({ name, orderNumber, currency, amount }: ProductPurchasedProps) {
  return (
    <EmailLayout preview={`Order confirmed — #${orderNumber}`}>
      <Text>Hi {name},</Text>
      <Text>Thanks for your order! Here's a summary:</Text>
      <SummaryRow label="Order Number" value={`#${orderNumber}`} />
      <SummaryRow label="Amount Paid" value={`${currency} ${amount}`} />
      <Text style={{ marginTop: 24 }}>We'll notify you once it ships.</Text>
    </EmailLayout>
  );
}