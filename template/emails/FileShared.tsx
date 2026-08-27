import {
  Body,
  Button,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

interface FileSharedProps {
  title: string;
  category: string;
  message: string;
  link: string;
  password: string;
}

export default function FileShared({
  title = "Rohan",
  category = "Contract",
  message = "this is test email dont reply please",
  link = "#",
  password = "123456",
}: FileSharedProps) {
  return (
    <Html>
      <Tailwind>
        <Head />
        <Preview>A file has been shared with you.</Preview>

        <Body className="bg-slate-50 py-12 font-sans">
          <Container className="mx-auto max-w-md rounded-xl border border-slate-200 bg-white p-0">
            {/* Header */}
            <Section className="border-b border-slate-100 px-8 py-6">
              <Text className="m-0 text-lg font-semibold text-slate-900">
                File Shared
              </Text>
              <Text className="m-0 mt-1 text-sm text-slate-500">
                Someone shared a file with you
              </Text>
            </Section>

            {/* Content */}
            <Section className="px-8 py-6">
              {/* File details */}
              <Text className="m-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                File name
              </Text>
              <Text className="m-0 mt-1 text-base font-medium text-slate-900">
                {title ?? "Untitled"}
              </Text>

              <Text className="m-0 mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">
                Category
              </Text>
              <Text className="m-0 mt-1 text-sm text-slate-700">
                {category ?? "Uncategorized"}
              </Text>

              {/* Message */}
              {message && (
                <>
                  <Hr className="my-5 border-slate-100" />
                  <Text className="m-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                    Message
                  </Text>
                  <Text className="m-0 mt-1 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {message}
                  </Text>
                </>
              )}

              {/* CTA */}
              <Section className="mt-6">
                <Button
                  href={link}
                  className="block w-full rounded-lg bg-blue-600 px-6 py-3 text-center text-sm font-semibold text-white"
                >
                  Open File
                </Button>
              </Section>

              {/* Password */}
              <Section className="mt-4 rounded-lg bg-slate-50 px-5 py-4 text-center">
                <Text className="m-0 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Access password
                </Text>
                <Text className="m-0 mt-1 font-mono text-xl font-semibold tracking-widest text-slate-900">
                  {password}
                </Text>
              </Section>
            </Section>

            {/* Footer */}
            <Section className="border-t border-slate-100 px-8 py-5">
              <Text className="m-0 text-xs leading-relaxed text-slate-400">
                If you weren't expecting this email, you can safely ignore it.
                This is an automated message — please don't reply.
              </Text>
              <Text className="m-0 mt-3 text-xs text-slate-400">
                © 2026 FileShare
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}