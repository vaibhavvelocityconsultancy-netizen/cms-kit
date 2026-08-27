"use client";

import { useState } from "react";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import { Button } from "@/src/ui/button";
import { FormSubmissions } from "./FormSubmissions";
import { getApiBaseUrl } from "@/src/lib/axios";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
// import { FormSubmissions } from "./FormSubmissions";

const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

// ── Field types ───────────────────────────────────────────
const FIELD_TYPES = [
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "tel", label: "Phone" },
  { value: "number", label: "Number" },
  { value: "textarea", label: "Textarea" },
  { value: "select", label: "Select" },
  { value: "checkbox", label: "Checkbox" },
  { value: "upload", label: "File / Image Upload" }, // 👈 single type
  { value: "message", label: "Message (static text)" },
];

interface FormField {
  id: string;
  type: string;
  name: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  message?: string;
  accept?: string; // for upload field
  maxSizeMB?: number; // for upload field
  multiple?: boolean; // for upload field
  min?: number; // for number field
  hideLabel?: boolean;
  customClass?: string;
}

interface EmailConfig {
  id: string;
  emailTo: string;
  cc: string;
  bcc: string;
  replyTo: string;
  emailFrom: string;
  subject: string;
  message: string;
  template: "none" | "simple" | "branded"; // ← ADD THIS
  collapsed: boolean;
}

interface FormEditorProps {
  form: any;
  isNew: boolean;
  onSave: (form: any) => void;
  onCancel: () => void;
}

interface FormEditorData {
  title: string;
  slug: string;
  fields: FormField[];
  submitButtonLabel: string;
  submitButtonClass: string;
  confirmationType: string;
  confirmationMessage: string;
  confirmationMessageClass: string;
  redirectUrl: string;
  emails: EmailConfig[];
  status: string;
  layout: string;
  twoColumnHeading: string;
  twoColumnParagraph: string;
}

function generateId() {
  return Math.random().toString(36).slice(2, 9);
}

function normalizeField(
  input: Partial<FormField> | null | undefined,
): FormField {
  const field = input && typeof input === "object" ? input : {};

  return {
    id: typeof field.id === "string" ? field.id : generateId(),
    type: typeof field.type === "string" ? field.type : "text",
    name: typeof field.name === "string" ? field.name : "",
    label: typeof field.label === "string" ? field.label : "",
    required: field.required === true,
    placeholder: typeof field.placeholder === "string" ? field.placeholder : "",
    options: Array.isArray(field.options)
      ? field.options.filter(
          (option): option is string => typeof option === "string",
        )
      : undefined,
    message: typeof field.message === "string" ? field.message : undefined,
    accept: typeof field.accept === "string" ? field.accept : undefined,
    maxSizeMB:
      typeof field.maxSizeMB === "number" ? field.maxSizeMB : undefined,
    multiple: field.multiple === true,
    min: typeof field.min === "number" ? field.min : undefined,
    hideLabel: field.hideLabel === true,
    customClass: typeof field.customClass === "string" ? field.customClass : "",
  };
}

// ── Field Block ───────────────────────────────────────────

function FieldBlock({
  field,
  onChange,
  onDelete,
}: {
  field: FormField;
  onChange: (f: FormField) => void;
  onDelete: () => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showCustomClass, setShowCustomClass] = useState(
    Boolean(field.customClass),
  );
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-border rounded-lg overflow-hidden bg-card"
    >
      {/* Field header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
        <button
          {...attributes}
          {...listeners}
          className="text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical size={14} />
        </button>{" "}
        <span className="text-sm font-medium text-foreground flex-1">
          {field.label || field.type || "New Field"}
          <span className="ml-2 text-xs text-muted-foreground font-mono">
            ({field.type})
          </span>
        </span>
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-muted-foreground hover:text-foreground"
        >
          {collapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
        </button>
        <button
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Field config */}
      {!collapsed && (
        <div className="p-4 space-y-4">
          {/* Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Field Type
              </label>
              <select
                value={field.type}
                onChange={(e) => onChange({ ...field, type: e.target.value })}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Name */}
            {field.type !== "message" && (
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Field Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => onChange({ ...field, name: e.target.value })}
                  placeholder="e.g. firstName"
                  className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>

          {/* Label */}
          {field.type !== "message" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Label
                </label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) =>
                    onChange({ ...field, label: e.target.value })
                  }
                  placeholder="e.g. First Name"
                  className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Placeholder
                </label>
                <input
                  type="text"
                  value={field.placeholder || ""}
                  onChange={(e) =>
                    onChange({ ...field, placeholder: e.target.value })
                  }
                  placeholder="e.g. Enter your name"
                  className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Static message */}
          {field.type === "message" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Message Text
              </label>
              <textarea
                rows={3}
                value={field.message || ""}
                onChange={(e) =>
                  onChange({ ...field, message: e.target.value })
                }
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Select options */}
          {field.type === "select" && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Options (one per line)
              </label>
              <textarea
                rows={4}
                value={(field.options || []).join("\n")}
                onChange={(e) =>
                  onChange({
                    ...field,
                    options: e.target.value
                      .split("\n")
                      .map((o) => o.trim())
                      .filter(Boolean),
                  })
                }
                placeholder={"Option 1\nOption 2\nOption 3"}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
              />
            </div>
          )}

          {/* Upload config */}
          {field.type === "upload" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Upload Type
                </label>
                <select
                  value={
                    field.accept === "image/*"
                      ? "image"
                      : field.accept
                        ? "custom"
                        : "any"
                  }
                  onChange={(e) => {
                    const preset = e.target.value;
                    const accept =
                      preset === "image"
                        ? "image/*"
                        : preset === "any"
                          ? ""
                          : field.accept || "";
                    onChange({ ...field, accept });
                  }}
                  className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="any">Any file</option>
                  <option value="image">Images only</option>
                  <option value="custom">Custom (specify extensions)</option>
                </select>
              </div>

              {(field.accept || field.accept === "") &&
                field.accept !== "image/*" && (
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">
                      Allowed Extensions
                    </label>
                    <input
                      type="text"
                      value={field.accept || ""}
                      onChange={(e) =>
                        onChange({ ...field, accept: e.target.value })
                      }
                      placeholder=".pdf,.doc,.docx (leave blank for any file)"
                      className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Max Size (MB)
                  </label>
                  <input
                    type="number"
                    value={field.maxSizeMB || 5}
                    onChange={(e) =>
                      onChange({ ...field, maxSizeMB: Number(e.target.value) })
                    }
                    min={1}
                    className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.multiple || false}
                      onChange={(e) =>
                        onChange({ ...field, multiple: e.target.checked })
                      }
                      className="rounded"
                    />
                    <span className="text-sm text-foreground">
                      Allow multiple files
                    </span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Required toggle */}
          {field.type !== "message" && field.type !== "checkbox" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`required-${field.id}`}
                checked={field.required}
                onChange={(e) =>
                  onChange({ ...field, required: e.target.checked })
                }
                className="rounded"
              />
              <label
                htmlFor={`required-${field.id}`}
                className="text-sm text-foreground"
              >
                Required field
              </label>
            </div>
          )}

          {field.type !== "message" && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`hide-label-${field.id}`}
                checked={field.hideLabel || false}
                onChange={(e) =>
                  onChange({ ...field, hideLabel: e.target.checked })
                }
                className="rounded"
              />
              <label
                htmlFor={`hide-label-${field.id}`}
                className="text-sm text-foreground"
              >
                Hide label on public form
              </label>
            </div>
          )}

          {!showCustomClass ? (
            <button
              type="button"
              onClick={() => setShowCustomClass(true)}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              + Add custom CSS class
            </button>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-muted-foreground">
                  Custom CSS class
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setShowCustomClass(false);
                    onChange({ ...field, customClass: "" });
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                >
                  Remove
                </button>
              </div>

              <input
                type="text"
                value={field.customClass || ""}
                onChange={(e) =>
                  onChange({ ...field, customClass: e.target.value })
                }
                placeholder="e.g. my-input-field another-class"
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Email Block ───────────────────────────────────────────

function EmailBlock({
  email,
  index,
  onChange,
  onDelete,
}: {
  email: EmailConfig;
  index: number;
  onChange: (e: EmailConfig) => void;
  onDelete: () => void;
}) {
  const toggle = () => onChange({ ...email, collapsed: !email.collapsed });

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Email header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
        <span className="text-sm font-medium text-foreground flex-1">
          Email {String(index + 1).padStart(2, "0")}
        </span>
        <button
          onClick={toggle}
          className="text-muted-foreground hover:text-foreground"
        >
          {email.collapsed ? (
            <ChevronDown size={15} />
          ) : (
            <ChevronUp size={15} />
          )}
        </button>
        <button
          onClick={onDelete}
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {!email.collapsed && (
        <div className="p-4 space-y-4">
          {/* Email To */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Email To <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={email.emailTo}
              onChange={(e) => onChange({ ...email, emailTo: e.target.value })}
              placeholder='"Email Sender" <sender@email.com>'
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* CC + BCC */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                CC
              </label>
              <input
                type="text"
                value={email.cc}
                onChange={(e) => onChange({ ...email, cc: e.target.value })}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                BCC
              </label>
              <input
                type="text"
                value={email.bcc}
                onChange={(e) => onChange({ ...email, bcc: e.target.value })}
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Reply To + Email From */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Reply To
              </label>
              <input
                type="text"
                value={email.replyTo}
                onChange={(e) =>
                  onChange({ ...email, replyTo: e.target.value })
                }
                placeholder='"Reply To" <reply-to@email.com>'
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Email From
              </label>
              <input
                type="text"
                value={email.emailFrom}
                onChange={(e) =>
                  onChange({ ...email, emailFrom: e.target.value })
                }
                placeholder='"Email From" <email-from@email.com>'
                className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Email Template
            </label>
            <select
              value={email.template || "none"}
              onChange={(e) =>
                onChange({
                  ...email,
                  template: e.target.value as EmailConfig["template"],
                })
              }
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="none">None — plain content</option>
              <option value="simple">Simple — clean white card</option>
              <option value="branded">Branded — dark header with logo</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Simple and Branded pull site name &amp; logo from Site Settings
              automatically.
            </p>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Subject <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={email.subject}
              onChange={(e) => onChange({ ...email, subject: e.target.value })}
              placeholder="You've received a new message."
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Message
            </label>
            <textarea
              rows={6}
              value={email.message}
              onChange={(e) => onChange({ ...email, message: e.target.value })}
              placeholder={
                "Use {{fieldName}} for field values.\nUse {{*}} to output all fields as a table."
              }
              className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Use{" "}
              <code className="bg-muted px-1 rounded">{"{{fieldName}}"}</code>{" "}
              to insert field values. Use{" "}
              <code className="bg-muted px-1 rounded">{"{{*}}"}</code> to output
              all fields as an HTML table.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main FormEditor ───────────────────────────────────────

export function FormEditor({ form, isNew, onSave, onCancel }: FormEditorProps) {
  const [data, setData] = useState<FormEditorData>({
    title: form.title || "",
    slug: form.slug || "",
    fields: Array.isArray(form.fields)
      ? form.fields.map((field: Partial<FormField>) => normalizeField(field))
      : [],
    submitButtonLabel: form.submitButtonLabel || "Submit",
    submitButtonClass: form.submitButtonClass || "",
    confirmationType: form.confirmationType || "message",
    confirmationMessage:
      form.confirmationMessage || "Thank you for your submission.",
    confirmationMessageClass: form.confirmationMessageClass || "",
    redirectUrl: form.redirectUrl || "",
    emails: (form.emails || []) as EmailConfig[],
    status: form.status || "active",
    layout: form.layout || "default",
    twoColumnHeading: form.twoColumnHeading || "",
    twoColumnParagraph: form.twoColumnParagraph || "",
  });
  function handleFieldDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setData((d) => {
      const oldIndex = d.fields.findIndex((f) => f.id === active.id);
      const newIndex = d.fields.findIndex((f) => f.id === over.id);
      return { ...d, fields: arrayMove(d.fields, oldIndex, newIndex) };
    });
  }

  const sensors = useSensors(useSensor(PointerSensor));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [view, setView] = useState<"editor" | "submissions">("editor");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showSubmitButtonClass, setShowSubmitButtonClass] = useState(
    Boolean(data.submitButtonClass),
  );
  const [showConfirmationMessageClass, setShowConfirmationMessageClass] =
    useState(Boolean(data.confirmationMessageClass));

  // ── Field operations ──

  function addField(type: string) {
    const newField: FormField = {
      id: generateId(),
      type,
      name: "",
      label: "",
      required: false,
      placeholder: "",
      ...(type === "upload"
        ? { accept: "", maxSizeMB: 5, multiple: false }
        : {}),
      hideLabel: false,
      customClass: "",
    };
    setData((d) => ({ ...d, fields: [...d.fields, newField] }));
    setShowAddMenu(false);
  }
  function updateField(id: string, updated: FormField) {
    setData((d) => ({
      ...d,
      fields: d.fields.map((f) => (f.id === id ? normalizeField(updated) : f)),
    }));
  }

  function deleteField(id: string) {
    setData((d) => ({
      ...d,
      fields: d.fields.filter((f) => f.id !== id),
    }));
  }

  // ── Email operations ──

  function addEmail() {
    const newEmail: EmailConfig = {
      id: generateId(),
      emailTo: "",
      cc: "",
      bcc: "",
      replyTo: "",
      emailFrom: "",
      subject: "You've received a new message.",
      message: "{{*}}",
      template: "none",
      collapsed: false,
    };
    setData((d) => ({ ...d, emails: [...d.emails, newEmail] }));
  }

  function updateEmail(id: string, updated: EmailConfig) {
    setData((d) => ({
      ...d,
      emails: d.emails.map((e) => (e.id === id ? updated : e)),
    }));
  }

  function deleteEmail(id: string) {
    setData((d) => ({
      ...d,
      emails: d.emails.filter((e) => e.id !== id),
    }));
  }

  // ── Save ──

  async function handleSave() {
    if (!data.title.trim()) {
      setError("Title is required");
      return;
    }

    const invalidField = data.fields.find((field) => {
      if (field.type === "message") return false;
      return !field.name.trim();
    });

    if (invalidField) {
      setError(
        invalidField.type === "upload"
          ? "Upload fields need a field name before saving."
          : "Every field except message blocks needs a field name.",
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const url = apiPath(isNew ? "/api/form" : `/api/form/${form.id}`);
      const method = isNew ? "POST" : "PATCH";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.message || "Failed to save");
        return;
      }

      onSave(result.data);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  // generate slug
  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header — like Payload */}
      <div className="sticky top-0 z-10 bg-background border-b border-border px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Forms
          </button>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm text-muted-foreground">
            {isNew ? "Create New" : "Edit"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {!isNew && (
            <div className="flex border border-border rounded-lg overflow-hidden">
              <button
                onClick={() => setView("editor")}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  view === "editor"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setView("submissions")}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  view === "submissions"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Submissions
              </button>
            </div>
          )}
          <Button onClick={handleSave} disabled={saving} size="sm">
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {view === "submissions" ? (
        <FormSubmissions formId={form.id} />
      ) : (
        <div className="flex-1 max-w-4xl mx-auto w-full px-8 py-8 space-y-8">
          {/* Title */}
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-6">
              {data.title || "[Untitled]"}
            </h1>
            <p className="text-xs text-muted-foreground mb-2 font-mono">
              {isNew ? "Creating new Form" : `Editing: ${form.slug}`}
            </p>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 text-destructive text-sm rounded-lg">
              {error}
            </div>
          )}

          {/* Title input */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Title <span className="text-destructive">*</span>
            </label>
            <input
              type="text"
              value={data.title}
              onChange={(e) => {
                const title = e.target.value;

                const slug = generateSlug(title);

                setData({ ...data, title, slug });
              }}
              className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Slug
            </label>
            <input
              type="text"
              value={data.slug}
              onChange={(e) => setData({ ...data, slug: e.target.value })}
              placeholder="auto-generated from title"
              className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary font-mono"
            />
          </div>

          {/* Fields */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-foreground">
                Fields
              </h2>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleFieldDragEnd}
            >
              <SortableContext
                items={data.fields.map((f) => f.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3">
                  {data.fields.map((field) => (
                    <FieldBlock
                      key={field.id}
                      field={field}
                      onChange={(updated) => updateField(field.id, updated)}
                      onDelete={() => deleteField(field.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <button
              onClick={() => addField("text")}
              className="mt-4 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Plus size={15} />
              Add Field
            </button>
          </div>
          {/* Submit button label */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Submit Button Label
              </label>
              <input
                type="text"
                value={data.submitButtonLabel}
                onChange={(e) =>
                  setData({ ...data, submitButtonLabel: e.target.value })
                }
                className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {!showSubmitButtonClass ? (
              <button
                type="button"
                onClick={() => setShowSubmitButtonClass(true)}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                + Add custom CSS class
              </button>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-foreground">
                    Submit Button CSS Class
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSubmitButtonClass(false);
                      setData({
                        ...data,
                        submitButtonClass: "",
                      });
                    }}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Remove
                  </button>
                </div>

                <input
                  type="text"
                  value={data.submitButtonClass}
                  onChange={(e) =>
                    setData({
                      ...data,
                      submitButtonClass: e.target.value,
                    })
                  }
                  placeholder="e.g. btn-primary mt-4"
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            )}
          </div>

          {/* Confirmation Type */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Confirmation Type
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="confirmationType"
                  value="message"
                  checked={data.confirmationType === "message"}
                  onChange={() =>
                    setData({ ...data, confirmationType: "message" })
                  }
                />
                <span className="text-sm text-foreground">Message</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="confirmationType"
                  value="redirect"
                  checked={data.confirmationType === "redirect"}
                  onChange={() =>
                    setData({ ...data, confirmationType: "redirect" })
                  }
                />
                <span className="text-sm text-foreground">Redirect</span>
              </label>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Choose whether to display an on-page message or redirect to a
              different page after they submit the form.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Form Layout
            </label>

            <select
              value={data.layout}
              onChange={(e) =>
                setData({
                  ...data,
                  layout: e.target.value,
                })
              }
              className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="default">Default</option>
              <option value="two-column">Two Column</option>
              <option value="full-width">Full Width</option>
            </select>

            <p className="text-xs text-muted-foreground mt-2">
              Choose how this form should be displayed on the website.
            </p>
          </div>

          {data.layout === "two-column" && (
            <div className="space-y-4 rounded-lg border border-border bg-card p-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  Two Column Content
                </h2>
                <p className="text-xs text-muted-foreground mt-1">
                  This heading and paragraph appear beside the form on the
                  public site.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Heading
                </label>
                <input
                  type="text"
                  value={data.twoColumnHeading}
                  onChange={(e) =>
                    setData({ ...data, twoColumnHeading: e.target.value })
                  }
                  placeholder={data.title || "Form heading"}
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Paragraph
                </label>
                <textarea
                  rows={4}
                  value={data.twoColumnParagraph}
                  onChange={(e) =>
                    setData({ ...data, twoColumnParagraph: e.target.value })
                  }
                  className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}

          {/* Confirmation Message or Redirect URL */}
          {data.confirmationType === "message" ? (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Confirmation Message <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={4}
                value={data.confirmationMessage}
                onChange={(e) =>
                  setData({ ...data, confirmationMessage: e.target.value })
                }
                className="confirmation-message w-full border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {!showConfirmationMessageClass ? (
                <button
                  type="button"
                  onClick={() => setShowConfirmationMessageClass(true)}
                  className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  + Add custom CSS class
                </button>
              ) : (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-muted-foreground">
                      Custom CSS class
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowConfirmationMessageClass(false);
                        setData({ ...data, confirmationMessageClass: "" });
                      }}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  <input
                    type="text"
                    value={data.confirmationMessageClass}
                    onChange={(e) =>
                      setData({
                        ...data,
                        confirmationMessageClass: e.target.value,
                      })
                    }
                    placeholder="e.g. thank-you-message another-class"
                    className="w-full border border-border rounded px-3 py-2 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Redirect URL <span className="text-destructive">*</span>
              </label>
              <input
                type="url"
                value={data.redirectUrl}
                onChange={(e) =>
                  setData({ ...data, redirectUrl: e.target.value })
                }
                placeholder="https://example.com/thank-you"
                className="w-full border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          )}

          {/* Emails section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-foreground">
                Emails
              </h2>
              <div className="flex items-center gap-3">
                <button
                  onClick={() =>
                    setData((d) => ({
                      ...d,
                      emails: d.emails.map((e) => ({ ...e, collapsed: true })),
                    }))
                  }
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Collapse All
                </button>
                <button
                  onClick={() =>
                    setData((d) => ({
                      ...d,
                      emails: d.emails.map((e) => ({ ...e, collapsed: false })),
                    }))
                  }
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Show All
                </button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Send custom emails when the form submits. Use{" "}
              <code className="bg-muted px-1 rounded">{"{{fieldName}}"}</code>{" "}
              to reference field values.{" "}
              <code className="bg-muted px-1 rounded">{"{{*}}"}</code> outputs
              all data as an HTML table.
            </p>

            <div className="space-y-3">
              {data.emails.map((email, i) => (
                <EmailBlock
                  key={email.id}
                  email={email}
                  index={i}
                  onChange={(updated) => updateEmail(email.id, updated)}
                  onDelete={() => deleteEmail(email.id)}
                />
              ))}
            </div>

            <button
              onClick={addEmail}
              className="mt-4 flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <Plus size={15} />
              Add Email
            </button>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Status
            </label>
            <select
              value={data.status}
              onChange={(e) => setData({ ...data, status: e.target.value })}
              className="border border-border rounded-lg px-4 py-3 text-sm bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
