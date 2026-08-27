"use client";

import { useEffect, useState } from "react";
import { getBaseUrl } from "@/src/lib/config";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import Editor from "@monaco-editor/react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  variables: string[];
}

interface EmailTemplateResponse {
  template: EmailTemplate;
}

interface SaveTemplateParams {
  id: string;
  subject: string;
  bodyHtml: string;
}

async function fetchTemplate(id: string): Promise<EmailTemplateResponse> {
  const res = await fetch(`${getBaseUrl()}/api/emails/templates/${id}`);

  if (!res.ok) {
    throw new Error("Failed to load");
  }

  return res.json();
}

async function saveTemplate({
  id,
  subject,
  bodyHtml,
}: SaveTemplateParams): Promise<EmailTemplate> {
  const res = await fetch(`${getBaseUrl()}/api/emails/templates/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject,
      bodyHtml,
    }),
  });

  if (!res.ok) {
    throw new Error("Failed to save");
  }

  return res.json();
}

export default function EditTemplatePage() {
  const params = useParams();
  const router = useRouter();

  const id = params.id as string;

  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");

  const { data, isLoading } = useQuery<EmailTemplateResponse>({
    queryKey: ["email-template", id],
    queryFn: () => fetchTemplate(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (data?.template) {
      setSubject(data.template.subject);
      setBodyHtml(data.template.bodyHtml);
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: saveTemplate,
    onSuccess: () => {
      router.push("/admin/emails/templates");
    },
  });

  if (isLoading || !data) {
    return <div className="p-6">Loading...</div>;
  }

  const { template } = data;

  return (
    <div className="max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{template.name}</h1>

        <button
          onClick={() =>
            saveMutation.mutate({
              id,
              subject,
              bodyHtml,
            })
          }
          disabled={saveMutation.isPending}
          className="rounded bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving..." : "Save"}
        </button>
      </div>

      {template.variables.length > 0 && (
        <div className="mb-4 text-sm text-gray-500">
          Available placeholders:{" "}
          {template.variables.map((variable) => (
            <code
              key={variable}
              className="mr-1 rounded bg-gray-100 px-1.5 py-0.5"
            >
              {`{{${variable}}}`}
            </code>
          ))}
        </div>
      )}

      <label className="mb-1 block text-sm font-medium">Subject</label>

      <input
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        className="mb-6 w-full rounded border px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">HTML Body</label>

          <Editor
            height="500px"
            language="html"
            value={bodyHtml}
            onChange={(value: string | undefined) => setBodyHtml(value ?? "")}
            options={{
              minimap: {
                enabled: false,
              },
              fontSize: 13,
            }}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Preview</label>

          <iframe
            srcDoc={bodyHtml}
            className="h-[500px] w-full rounded border"
            sandbox=""
          />
        </div>
      </div>
    </div>
  );
}
