import { Text, Heading } from "@react-email/components";
import { EmailLayout, SummaryRow } from "./components/Layout";


interface CourseEnrolledProps {
  name: string;
  email: string;
  courseName: string;
  currency: string;
  amount: number;
}

export default function CourseEnrolled({ name, email, courseName, currency, amount }: CourseEnrolledProps) {
  return (
    <EmailLayout preview={`You're enrolled in ${courseName}`}>
      <Text>Hi {name},</Text>
      <Text>Your payment was successful and you now have lifetime access to:</Text>
      <Heading as="h2" style={{ margin: "16px 0", color: "#111827" }}>{courseName}</Heading>
      <SummaryRow label="Amount Paid" value={`${currency} ${amount}`} />
      <Text style={{ marginTop: 24 }}>Happy learning!</Text>
    </EmailLayout>
  );
}