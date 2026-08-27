import { Text } from "@react-email/components";
import { EmailLayout, SummaryRow } from "./components/Layout";

interface OrderPlacedAdminProps {
  name: string;
  email: string;
  planName: string;
  billingCycle: string;
  currency: string;
  amount: number;
}

export default function OrderPlacedAdmin({ name, email, planName, billingCycle, currency, amount }: OrderPlacedAdminProps   ) {
  return (
    <EmailLayout preview={`New plan purchase: ${planName}`}>
      <Text><b>{name}</b> ({email}) just purchased <b>{planName}</b>.</Text>
      <SummaryRow label="Billing Cycle" value={billingCycle} />
      <SummaryRow label="Amount" value={`${currency} ${amount}`} />
    </EmailLayout>
  );
}