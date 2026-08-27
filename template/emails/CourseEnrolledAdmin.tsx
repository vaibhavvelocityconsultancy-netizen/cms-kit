import { Text } from "@react-email/components";
import { EmailLayout, SummaryRow } from "./components/Layout";

interface CourseEnrolledAdminProps {
  name: string;
  email: string;
  courseName: string;
  currency: string;
  amount: number;
}

export default function CourseEnrolledAdmin({ name, email, courseName, currency, amount }: CourseEnrolledAdminProps) {
  return (
    <EmailLayout preview={`New enrollment: ${courseName}`}>
      <Text><b>{name}</b> ({email}) just enrolled in <b>{courseName}</b>.</Text>
      <SummaryRow label="Amount" value={`${currency} ${amount}`} />
    </EmailLayout>
  );
}