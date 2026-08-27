import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr,
  Preview,
} from "@react-email/components";

interface EmailLayoutProps {
  preview: string;
  siteName?: string;
  children: React.ReactNode;
}

export function EmailLayout({
  preview,
  siteName = "IPDAV",
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "32px 0",
          background: "#f4f5f7",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <Container
          style={{
            background: "#ffffff",
            borderRadius: 8,
            overflow: "hidden",
            maxWidth: 480,
          }}
        >
          <Section style={{ background: "#111827", padding: "20px 32px" }}>
            <Text
              style={{
                color: "#fff",
                fontSize: 18,
                fontWeight: 600,
                margin: 0,
              }}
            >
              {siteName}
            </Text>
          </Section>
          <Section
            style={{
              padding: "32px",
              color: "#1f2937",
              fontSize: 15,
              lineHeight: 1.6,
            }}
          >
            {children}
          </Section>
          <Hr style={{ borderColor: "#e5e7eb", margin: 0 }} />
          <Section style={{ padding: "20px 32px", background: "#f9fafb" }}>
            <Text style={{ color: "#9ca3af", fontSize: 12, margin: 0 }}>
              This is an automated email. Please don't reply directly.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
}

export function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <table
      width="100%"
      cellPadding="0"
      cellSpacing="0"
      style={{ marginTop: 4 }}
    >
      <tbody>
        <tr>
          <td style={{ padding: "6px 0", color: "#6b7280" }}>{label}</td>
          <td
            style={{
              padding: "6px 0",
              textAlign: "right",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            {value}
          </td>
        </tr>
      </tbody>
    </table>
  );
}
