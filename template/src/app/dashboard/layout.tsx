import SubscriptionLayout from "../subscription/layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SubscriptionLayout>{children}</SubscriptionLayout>;
}
