import { Text } from "@react-email/components";
import { EmailLayout, SummaryRow } from "./components/Layout";

interface ProductPurchasedAdminProps {
    name: string;
    email: string;
    orderNumber: string;
    currency: string;
    amount: number;
}

export default function ProductPurchasedAdmin({ name, email, orderNumber, currency, amount }: ProductPurchasedAdminProps) {
  return (
    <EmailLayout preview={`New order: #${orderNumber}`}>
      <Text><b>{name}</b> ({email}) placed order <b>#{orderNumber}</b>.</Text>
      <SummaryRow label="Amount" value={`${currency} ${amount}`} />
    </EmailLayout>
  );
}