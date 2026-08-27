"use client";

import { useState, useEffect } from "react";
import { getBaseUrl } from "@/src/lib/config";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CircleCheck, CircleX, Loader2, Send } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  variables: string[];
}

async function fetchSettings() {
  const res = await fetch(`${getBaseUrl()}/api/emails/settings`);
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json();
}

async function saveSettings(data) {
  const res = await fetch(`${getBaseUrl()}/api/emails/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to save");
  return res.json();
}

async function sendTest(testEmail) {
  const res = await fetch(`${getBaseUrl()}/api/emails/settings/tests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ testEmail }),
  });
  return res.json();
}

export default function EmailSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [testEmail, setTestEmail] = useState("");
  const [testResult, setTestResult] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ["email-settings"],
    queryFn: fetchSettings,
  });

  useEffect(() => {
    if (data?.settings) setForm(data.settings);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: saveSettings,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["email-settings"] }),
  });

  const testMutation = useMutation({
    mutationFn: () => sendTest(testEmail),
    onSuccess: (res) => {
      setTestResult(res);
      queryClient.invalidateQueries({ queryKey: ["email-settings"] });
    },
  });

  if (isLoading || !form) {
    return (
      <div className="p-8 max-w-2xl mx-auto text-sm text-gray-400">
        Loading...
      </div>
    );
  }

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold text-gray-900">Email Settings</h1>
        <button
          onClick={() => saveMutation.mutate(form)}
          disabled={saveMutation.isPending}
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50"
        >
          {saveMutation.isPending ? "Saving..." : "Save changes"}
        </button>
      </div>
      <p className="text-sm text-gray-500 mb-8">
        Manage how your outgoing emails identify themselves to recipients.
      </p>

      <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100">
        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Sender identity
          </h2>

          <div className="space-y-5">
            <Field
              label="Sender name"
              value={form.senderName}
              onChange={(v) => update("senderName", v)}
              placeholder="IPDAV"
              help='Shown to recipients instead of a raw email address, e.g. "IPDAV".'
            />
            <Field
              label="From email"
              value={form.fromEmail}
              onChange={(v) => update("fromEmail", v)}
              placeholder="no-reply@yoursite.com"
              help="The address your emails are sent from."
            />
            <Field
              label="Reply-to email"
              value={form.replyToEmail || ""}
              onChange={(v) => update("replyToEmail", v)}
              placeholder="support@yoursite.com"
              help="Where replies go if a customer responds. Leave blank to use the From email."
            />
          </div>
        </div>

        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">
            Notifications
          </h2>
          <Field
            label="Admin notification email"
            value={form.adminEmail}
            onChange={(v) => update("adminEmail", v)}
            placeholder="admin@yoursite.com"
            help="Where you get notified for new orders, enrollments, and purchases."
          />
        </div>

        <div className="p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">
            Send a test email
          </h2>
          <p className="text-xs text-gray-500 mb-4">
            Confirm your emails are going out correctly before relying on them.
          </p>

          <div className="flex gap-2">
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="you@example.com"
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
            />
            <button
              onClick={() => testMutation.mutate()}
              disabled={!testEmail || testMutation.isPending}
              className="flex items-center gap-2 border border-gray-200 text-sm px-4 py-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              {testMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Send test
            </button>
          </div>

          {testResult && (
            <div
              className={`mt-3 flex items-center gap-2 text-sm rounded-lg px-3 py-2 ${
                testResult.success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {testResult.success ? (
                <CircleCheck className="w-4 h-4" />
              ) : (
                <CircleX className="w-4 h-4" />
              )}
              {testResult.success
                ? "Test email sent successfully."
                : testResult.error}
            </div>
          )}

          {!testResult && form.lastTestAt && (
            <p className="mt-3 text-xs text-gray-400">
              Last test:{" "}
              {form.lastTestStatus === "SUCCESS" ? "Succeeded" : "Failed"} on{" "}
              {new Date(form.lastTestAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  help?: string;
}

function Field({ label, value, onChange, placeholder, help }: FieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-900 mb-1">
        {label}
      </label>
      {help && <p className="text-xs text-gray-500 mb-1.5">{help}</p>}
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900/10"
      />
    </div>
  );
}
