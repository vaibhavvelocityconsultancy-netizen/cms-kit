import { Text } from "@react-email/components";
import { EmailLayout, SummaryRow } from "./components/Layout";

interface OrderPlacedProps {
  name: string;
  planName: string;
  billingCycle: string;
  currency: string;
  amount: number;
}

export default function OrderPlaced({ name, planName, billingCycle, currency, amount }: OrderPlacedProps) {
  return (
    <EmailLayout preview={`Your ${planName} subscription is active`}>
      <Text>Hi {name},</Text>
      <Text>Your payment was successful. Your subscription is now active:</Text>
      <SummaryRow label="Plan" value={planName} />
      <SummaryRow label="Billing Cycle" value={billingCycle} />
      <SummaryRow label="Amount Paid" value={`${currency} ${amount}`} />
    </EmailLayout>
  );
}