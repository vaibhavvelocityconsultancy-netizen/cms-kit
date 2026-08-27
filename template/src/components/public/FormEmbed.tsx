"use client";

import { useEffect, useState } from "react";
import { getApiBaseUrl } from "@/src/lib/axios";

interface FormField {
  id: string;
  type: string;
  name: string;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  message?: string;
  accept?: string;
  multiple?: boolean;
  maxSizeMB?: number;
  hideLabel?: boolean;
  customClass?: string;
}

interface PublicForm {
  id: number;
  title: string;
  slug: string;
  layout?: string;
  twoColumnHeading?: string | null;
  twoColumnParagraph?: string | null;
  fields: FormField[];
  submitButtonLabel: string;
  submitButtonClass?: string;
  confirmationType: string;
  confirmationMessage: string;
  confirmationMessageClass?: string;
  redirectUrl: string;
}

const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

export function FormEmbed({ slug }: { slug: string }) {
  const [form, setForm] = useState<PublicForm | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, FileList | null>>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const hasValue =
    Object.values(values).some((v) => String(v || "").trim() !== "") ||
    Object.values(files).some((fl) => fl && fl.length > 0);

  useEffect(() => {
    fetch(apiPath(`/api/form/slug/${slug}`))
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setForm(d.data);
        }
      });
  }, [slug]);

  if (!form) return null;

  const hasUploadField = form.fields.some((f) => f.type === "upload");
  const twoColumnHeading = form.twoColumnHeading?.trim() || form.title;
  const twoColumnParagraph = form.twoColumnParagraph?.trim() || "";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let res: Response;

      if (hasUploadField) {
        const fd = new FormData();

        Object.entries(values).forEach(([k, v]) => {
          fd.append(k, v);
        });

        Object.entries(files).forEach(([name, fileList]) => {
          if (!fileList) return;

          Array.from(fileList).forEach((file) => {
            fd.append(name, file);
          });
        });

        res = await fetch(apiPath(`/api/form/submit/${slug}`), {
          method: "POST",
          body: fd,
        });
      } else {
        res = await fetch(apiPath(`/api/form/submit/${slug}`), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(values),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Submission failed");
        return;
      }

      if (data.data.confirmationType === "redirect" && data.data.redirectUrl) {
        window.location.href = data.data.redirectUrl;
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error — please try again");
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div
        className={`py-10 text-center ${form.confirmationMessageClass || ""}`}
      >
        {form.confirmationMessage || "Thank you for your submission!"}
      </div>
    );
  }

  /*
   * FIELD RENDERER
   * ----------------------------
   * This is your existing field logic.
   */
  const renderField = (field: FormField) => {
    const fieldClassName = [field.customClass, "w-full"]
      .filter(Boolean)
      .join(" ");

    if (field.type === "message") {
      return (
        <div key={field.id} className={field.customClass || undefined}>
          {field.message}
        </div>
      );
    }

    return (
      <div key={field.id} className={field.customClass || undefined}>
        <label
          className={
            field.hideLabel
              ? "sr-only"
              : "block text-sm font-medium text-gray-700 mb-1"
          }
        >
          {field.label}

          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>

        {field.type === "textarea" ? (
          <textarea
            name={field.name}
            required={field.required}
            placeholder={field.placeholder}
            rows={4}
            value={values[field.name] || ""}
            onChange={(e) =>
              setValues({
                ...values,
                [field.name]: e.target.value,
              })
            }
            className={`${fieldClassName} border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        ) : field.type === "select" ? (
          <select
            name={field.name}
            required={field.required}
            aria-label={field.hideLabel ? field.label : undefined}
            value={values[field.name] || ""}
            onChange={(e) =>
              setValues({
                ...values,
                [field.name]: e.target.value,
              })
            }
            className={`${fieldClassName} border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          >
            <option value="">Select an option</option>

            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        ) : field.type === "checkbox" ? (
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              name={field.name}
              checked={values[field.name] === "true"}
              onChange={(e) =>
                setValues({
                  ...values,
                  [field.name]: e.target.checked ? "true" : "false",
                })
              }
              className="rounded"
              aria-label={field.hideLabel ? field.label : undefined}
            />
            <span
              className={field.hideLabel ? "sr-only" : "text-sm text-gray-700"}
            >
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
        ) : field.type === "upload" ? (
          <>
            <input
              type="file"
              name={field.name}
              required={field.required}
              accept={field.accept || undefined}
              multiple={field.multiple || false}
              aria-label={field.hideLabel ? field.label : undefined}
              onChange={(e) =>
                setFiles({
                  ...files,
                  [field.name]: e.target.files,
                })
              }
              className={`${fieldClassName} border px-3 py-2 text-sm`}
            />

            {field.maxSizeMB && (
              <p className="text-xs text-gray-400 mt-1">
                Max {field.maxSizeMB}MB per file
              </p>
            )}
          </>
        ) : (
          <input
            type={field.type}
            name={field.name}
            required={field.required}
            placeholder={field.placeholder}
            aria-label={field.hideLabel ? field.label : undefined}
            value={values[field.name] || ""}
            onChange={(e) =>
              setValues({
                ...values,
                [field.name]: e.target.value,
              })
            }
            className={`${fieldClassName} border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        )}
      </div>
    );
  };

  /*
   * TWO COLUMN LAYOUT
   * ----------------------------
   * Used only when Admin selects:
   *
   * Form Layout → Two Column
   */
  if (form.layout === "two-column") {
    return (
      <div className="w-full py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* LEFT SIDE */}
            <div className="space-y-6">
              <h2 className="form-heading text-[#0B3154]">
                {twoColumnHeading}
              </h2>
              {twoColumnParagraph && (
                <p className="form-paragraph text-[#0B3154]">
                  {twoColumnParagraph}
                </p>
              )}
            </div>

            {/* RIGHT SIDE */}
            <form
              onSubmit={handleSubmit}
              className="public-form-embed public-form-embed--two-column space-y-5"
            >
              {form.fields.map(renderField)}

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <button
                type="submit"
                disabled={loading || !hasValue}
                className={[
                  "cms-form-submits",
                  "bg-blue-600",
                  "text-white",
                  "px-12",
                  "py-4",
                  "text-base",
                  "font-medium",
                  "hover:bg-blue-700",
                  "disabled:opacity-50",
                  form.submitButtonClass,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {loading ? "Submitting..." : form.submitButtonLabel || "Submit"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  /*
   * DEFAULT LAYOUT
   * ----------------------------
   * Existing forms continue using
   * the old design.
   */
  return (
    <form
      onSubmit={handleSubmit}
      className="public-form-embed public-form-embed--default space-y-5"
    >
      {form.fields.map(renderField)}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading || !hasValue}
        className={[
          "cms-form-submits",
          "bg-blue-600",
          "text-white",
          "px-6",
          "py-2.5",
          "text-sm",
          "font-medium",
          "hover:bg-blue-700",
          "disabled:opacity-50",
          form.submitButtonClass,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {loading ? "Submitting..." : form.submitButtonLabel || "Submit"}
      </button>
    </form>
  );
}
