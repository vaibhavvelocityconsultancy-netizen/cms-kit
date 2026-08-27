// src/lib/form-renderer.ts
import { resolveAppUrl } from "./base-path";

// Detects form embeds in page HTML, fetches them, and replaces with rendered HTML.
//
// Supported embed formats:
//   [form slug="contact-us"]
//   <div data-form="contact-us"></div>
//
// Use the form slug from your CMS form record. Both syntaxes work the same.

function getApiBaseUrl() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (siteUrl) {
    try {
      const url = new URL(siteUrl);
      return url.pathname.replace(/\/$/, "");
    } catch {
      return "";
    }
  }

  if (typeof window !== "undefined") {
    const pathname = window.location.pathname.replace(/\/$/, "");
    if (!pathname || pathname === "/") return "";

    const knownBasePaths = ["/newweb", "/cms", "/app"];
    const matchedBasePath = knownBasePaths.find(
      (basePath) =>
        pathname === basePath || pathname.startsWith(`${basePath}/`),
    );

    return matchedBasePath ?? "";
  }

  return "";
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type FormFieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "textarea"
  | "select"
  | "checkbox"
  | "message"
  | "upload";

export interface FormField {
  id: string;
  type: FormFieldType;
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // for select
  content?: string; // for message (static text block)
  width?: "full" | "half";
  accept?: string; // 👈 new
  multiple?: boolean; // 👈 new
  maxSizeMB?: number; // 👈 new
  hideLabel?: boolean;
  customClass?: string;
}

export interface FormData {
  id: string;
  title: string;
  slug: string;
  fields: FormField[];
  submitButtonLabel?: string;
  submitButtonClass?: string;
  confirmationType?: "message" | "redirect";
  confirmationMessage?: string;
  confirmationMessageClass?: string;
  redirectUrl?: string;
  status: string;
}

// ─────────────────────────────────────────────
// Step 1 — Extract all slugs from HTML
// ─────────────────────────────────────────────

export function resolveFormSlugs(html: string): string[] {
  const slugs = new Set<string>();

  // [form slug="contact-us"] or [form slug='contact-us']
  const shortcodeRe = /\[form\s+slug=["']([^"']+)["']\]/gi;
  let match: RegExpExecArray | null;
  while ((match = shortcodeRe.exec(html)) !== null) {
    slugs.add(match[1]);
  }

  // <div data-form="contact-us" ...> (any tag, any extra attrs)
  const dataAttrRe = /data-form=["']([^"']+)["']/gi;
  while ((match = dataAttrRe.exec(html)) !== null) {
    slugs.add(match[1]);
  }

  return Array.from(slugs);
}

// ─────────────────────────────────────────────
// Step 2 — Fetch forms from the API
// ─────────────────────────────────────────────

const apiPath = (path: string) => `${getApiBaseUrl()}${path}`;

export async function fetchFormsBySlug(
  slugs: string[],
  baseUrl = "",
): Promise<Map<string, FormData>> {
  const map = new Map<string, FormData>();
  if (slugs.length === 0) return map;

  await Promise.all(
    slugs.map(async (slug) => {
      try {
        const res = await fetch(
          `${baseUrl}/api/form/slug/${slug}`, // ← use baseUrl directly, no apiPath()
          {
            cache: "no-store",
          },
        );
        if (!res.ok) return;
        const json = await res.json();
        const form: FormData | undefined = json.data ?? json.form ?? json;
        if (form?.slug) map.set(slug, form);
      } catch {
        // silently skip unavailable forms
      }
    }),
  );

  return map;
}

// ─────────────────────────────────────────────
// Step 3 — Render a single form to HTML string
// ─────────────────────────────────────────────

export function renderFormHtml(form: FormData): string {
  const fieldHtml = form.fields.map((field) => renderField(field)).join("\n");
  const buttonClass = ["cms-form-submit", form.submitButtonClass]
    .filter(Boolean)
    .join(" ");

  const confirmAttr =
    form.confirmationType === "redirect" && form.redirectUrl
      ? `data-redirect="${escapeAttr(form.redirectUrl)}"`
      : `data-confirm-message="${escapeAttr(form.confirmationMessage ?? "Thank you! Your message has been received.")}"`;
  const confirmationClass = ["cms-form-status", form.confirmationMessageClass]
    .filter(Boolean)
    .join(" ");

  return `
<div class="cms-form-wrap" id="cms-form-${escapeAttr(form.slug)}">
  <form
  class="cms-form"
  data-form-slug="${escapeAttr(form.slug)}"
  ${confirmAttr}
  novalidate
  oninput="
    (function(form) {
      var fields = form.querySelectorAll(
        'input:not([type=submit]):not([type=button]), textarea, select'
      );

      var hasValue = Array.from(fields).some(function(field) {
        if (field.disabled) return false;

        if (field.type === 'checkbox' || field.type === 'radio') {
          return field.checked;
        }

        if (field.type === 'file') {
          return field.files && field.files.length > 0;
        }

        return String(field.value || '').trim() !== '';
      });

      var button = form.querySelector('.cms-form-submit');

      if (button) {
        button.disabled = !hasValue;
      }
    })(this);
  "
>
    <div class="cms-form-fields">
      ${fieldHtml}
    </div>
    <div class="cms-form-footer">
      <button type="submit" class="${escapeAttr(buttonClass)}" disabled>
        ${escapeHtml(form.submitButtonLabel ?? "Submit")}
      </button>
    </div>
    <div class="${escapeAttr(confirmationClass)} form-status" aria-live="polite"></div>
  </form>
</div>`;
}

function renderField(field: FormField): string {
  const id = `field-${escapeAttr(field.id || field.name)}`;
  const ariaLabelAttr = field.hideLabel
    ? `aria-label="${escapeAttr(field.label)}"`
    : "";
  const customFieldClass = [field.customClass].filter(Boolean).join(" ");
  const label =
    field.type !== "message"
      ? `<label class="cms-field-label${field.hideLabel ? " sr-only" : ""}" for="${id}">
          ${escapeHtml(field.label)}
          ${field.required ? `<span class="cms-field-required" aria-hidden="true">*</span>` : ""}
        </label>`
      : "";

  let input = "";

  switch (field.type) {
    case "textarea":
      input = `<textarea
        id="${id}"
        name="${escapeAttr(field.name)}"
        class="${escapeAttr(["cms-field-input", "cms-field-textarea", customFieldClass].filter(Boolean).join(" "))}"
        placeholder="${escapeAttr(field.placeholder ?? "")}"
        ${field.required ? "required" : ""}        ${ariaLabelAttr}        rows="5"
      ></textarea>`;
      break;

    case "select":
      input = `<select
        id="${id}"
        name="${escapeAttr(field.name)}"
        class="${escapeAttr(["cms-field-input", "cms-field-select", customFieldClass].filter(Boolean).join(" "))}"
        ${field.required ? "required" : ""}
        ${ariaLabelAttr}
      >
        <option value="">— Select an option —</option>
        ${(field.options ?? [])
          .map(
            (opt) =>
              `<option value="${escapeAttr(opt)}">${escapeHtml(opt)}</option>`,
          )
          .join("")}
      </select>`;
      break;

    case "checkbox":
      return `
        <div class="cms-field-wrap cms-field-wrap--checkbox">
          <label class="cms-field-checkbox-label" for="${id}">
            <input
              type="checkbox"
              id="${id}"
              name="${escapeAttr(field.name)}"
              class="${escapeAttr(["cms-field-checkbox", customFieldClass].filter(Boolean).join(" "))}"
              ${field.required ? "required" : ""}
            />
            <span class="${field.hideLabel ? "sr-only" : ""}">${escapeHtml(field.label)}${field.required ? ` <span class="cms-field-required" aria-hidden="true">*</span>` : ""}</span>
          </label>
        </div>`;

    case "upload":
      input = `<input
    type="file"
    id="${id}"
    name="${escapeAttr(field.name)}"
    class="${escapeAttr(["cms-field-input", "cms-field-file", customFieldClass].filter(Boolean).join(" "))}"
    ${field.accept ? `accept="${escapeAttr(field.accept)}"` : ""}
    ${field.multiple ? "multiple" : ""}
    ${field.required ? "required" : ""}
    ${ariaLabelAttr}
  />`;
      break;

    case "message":
      return `
        <div class="cms-field-wrap cms-field-wrap--message ${escapeAttr(customFieldClass)}">
          <p class="cms-field-message-text">${field.content ?? ""}</p>
        </div>`;

    default:
      // text | email | tel | number
      input = `<input
        type="${field.type}"
        id="${id}"
        name="${escapeAttr(field.name)}"
        class="${escapeAttr(["cms-field-input", customFieldClass].filter(Boolean).join(" "))}"
        placeholder="${escapeAttr(field.placeholder ?? "")}"
        ${field.required ? "required" : ""}
      />`;
  }

  return `
    <div class="cms-field-wrap${field.width === "half" ? " cms-field-wrap--half" : ""}${customFieldClass ? ` ${escapeAttr(customFieldClass)}` : ""}">
      ${label}
      ${input}
      <span class="cms-field-error" role="alert"></span>
    </div>`;
}

// ─────────────────────────────────────────────
// Step 4 — Replace all embeds in HTML
// ─────────────────────────────────────────────

export function replaceFormEmbeds(
  html: string,
  forms: Map<string, FormData>,
): string {
  let result = html;

  // Replace shortcodes: [form slug="contact-us"]
  result = result.replace(/\[form\s+slug=["']([^"']+)["']\]/gi, (_, slug) => {
    const form = forms.get(slug);
    return form ? renderFormHtml(form) : `<!-- form "${slug}" not found -->`;
  });

  // Replace data-form wrappers: <{tag} data-form="slug" {extraAttrs}>...</{tag}>
  // Handles both self-closing divs and those with inner content (replaces entire element)
  result = result.replace(
    /<(\w+)([^>]*?)data-form=["']([^"']+)["']([^>]*?)>([\s\S]*?)<\/\1>/gi,
    (_, _tag, _before, slug, _after, _inner) => {
      const form = forms.get(slug);
      return form ? renderFormHtml(form) : `<!-- form "${slug}" not found -->`;
    },
  );

  // Also handle self-closing / void tags: <div data-form="slug" />
  result = result.replace(
    /<(\w+)([^>]*?)data-form=["']([^"']+)["']([^>]*?)\/>/gi,
    (_, _tag, _before, slug, _after) => {
      const form = forms.get(slug);
      return form ? renderFormHtml(form) : `<!-- form "${slug}" not found -->`;
    },
  );

  return result;
}

// ─────────────────────────────────────────────
// Step 5 — Form submit script (injected into srcDoc)
// ─────────────────────────────────────────────
// Handles fetch submission, validation feedback, confirmation/redirect.

export const FORM_SUBMIT_SCRIPT = `
(function () {
  const attachedForms = new WeakMap(); // Track which forms have listeners

  function updateSubmitButtonState(form) {
    var submitBtn = form.querySelector('.cms-form-submit');
    if (!submitBtn) return;

    var fields = form.querySelectorAll(
      'input:not([type="submit"]):not([type="button"]), textarea, select',
    );

    var hasValue = Array.from(fields).some(function (field) {
      if (field.disabled) return false;

      if (field.type === 'checkbox' || field.type === 'radio') {
        return field.checked;
      }

      if (field.type === 'file') {
        return field.files && field.files.length > 0;
      }

      return String(field.value || '').trim() !== '';
    });

    submitBtn.disabled = !hasValue;
  }
  
  function validateForm(form) {
    let valid = true;
    form.querySelectorAll('[required]').forEach(function (el) {
      const wrap = el.closest('.cms-field-wrap');
      const err = wrap && wrap.querySelector('.cms-field-error');
      const empty = el.type === 'checkbox' ? !el.checked : (el.value || '').trim() === '';
      if (empty) {
        valid = false;
        el.classList.add('cms-field-invalid');
        if (err) err.textContent = 'This field is required.';
      } else {
        el.classList.remove('cms-field-invalid');
        if (err) err.textContent = '';
      }
    });
    return valid;
  }

  function setStatus(form, type, msg) {
    var statusEl = form.querySelector('.cms-form-status');
    if (!statusEl) return;
    statusEl.classList.remove(
      'cms-form-status--loading',
      'cms-form-status--success',
      'cms-form-status--error'
    );
    if (type) statusEl.classList.add('cms-form-status--' + type);
    statusEl.textContent = msg;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    e.stopPropagation();

    var form = e.currentTarget;
    if (!validateForm(form)) return;

    var slug = form.dataset.formSlug;
    var submitBtn = form.querySelector('.cms-form-submit');
    var originalLabel = submitBtn ? submitBtn.textContent : 'Submit';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
    }
    setStatus(form, 'loading', 'Sending…');

   var hasFileInput = form.querySelector('input[type="file"]') !== null;
var fetchOptions;

if (hasFileInput) {
  var fd = new FormData(form);
  form.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
    fd.set(cb.name, cb.checked ? 'true' : 'false');
  });
  fetchOptions = { method: 'POST', body: fd }; // no Content-Type — browser sets boundary
} else {
  var data = {};
  new FormData(form).forEach(function (val, key) { data[key] = val; });
  form.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
    data[cb.name] = cb.checked ? 'true' : 'false';
  });
  fetchOptions = {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

try {
  var res = await fetch(resolveAppUrl('/api/form/submit/' + slug, window.location.origin || ''), fetchOptions);
      var json = await res.json();

      if (res.ok && json.success !== false) {
        var redirect = form.dataset.redirect;
        if (redirect) {
          window.location.href = redirect;
          return;
        }
        var msg = form.dataset.confirmMessage || 'Thank you! Your message has been received.';
       
        setStatus(form, 'success', msg);

        setTimeout(function () {
          form.reset();
          form.querySelectorAll('.cms-field-error').forEach(function (err) { err.textContent = ''; });
          form.querySelectorAll('.cms-field-invalid').forEach(function (el) { el.classList.remove('cms-field-invalid'); });
          setStatus(form, '', '');
          if (submitBtn) {
  submitBtn.textContent = originalLabel;
  updateSubmitButtonState(form);
}
        }, 3000);

      } else {
        var errMsg = (json.message && json.message.length < 200) ? json.message : 'Something went wrong. Please try again.';
        setStatus(form, 'error', errMsg);
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
      }
    } catch (err) {
      setStatus(form, 'error', 'Network error. Please check your connection and try again.');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = originalLabel; }
    }
  }

  function handleInputChange(e) {
    const el = e.target;
    if (!el || !el.matches) return;
    if (!el.matches('.cms-form input, .cms-form textarea, .cms-form select')) return;

    const form = el.closest('.cms-form');
    if (!form) return;

    el.classList.remove('cms-field-invalid');
    var wrap = el.closest('.cms-field-wrap');
    var err = wrap && wrap.querySelector('.cms-field-error');
    if (err) err.textContent = '';
    updateSubmitButtonState(form);
  }

  document.addEventListener('input', function (e) {
    handleInputChange(e);
  });

  document.addEventListener('change', function (e) {
    handleInputChange(e);
  });

  function initializeFormButtons() {
    document.querySelectorAll('.cms-form').forEach(function (form) {
      updateSubmitButtonState(form);
    });
  }

  function init() {
    document.querySelectorAll('.cms-form').forEach(function (form) {
      if (attachedForms.has(form)) return;

      form.addEventListener('submit', handleSubmit);
      attachedForms.set(form, true);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      init();
      initializeFormButtons();
    });
  } else {
    init();
    initializeFormButtons();
  }
})();
`;
// ─────────────────────────────────────────────
// Step 6 — Form CSS (injected into srcDoc <style>)
// ─────────────────────────────────────────────

export const FORM_CSS = `
  /* ── CMS Forms ── */
  .cms-form-wrap { width: 100%; }
  .cms-form { display: flex; flex-direction: column; gap: 0; }
  .cms-form-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem 1.5rem; }
  .cms-field-wrap { display: flex; flex-direction: column; gap: 0.375rem; grid-column: span 2; }
  .cms-field-wrap--half { grid-column: span 1; }
  .cms-field-label { font-size: 0.875rem; font-weight: 500; color: #374151; }
  .cms-field-required { color: #ef4444; margin-left: 2px; }
  .cms-field-file { padding: 0.5rem 0.75rem; cursor: pointer;}
  .cms-field-input {
    width: 100%; padding: 0.625rem 0.875rem;
    border: 1px solid #d1d5db; border-radius: 8px;
    font-size: 0.9375rem; color: #111827; background: #fff;
    transition: border-color 0.15s, box-shadow 0.15s;
    outline: none;
  }
  .cms-field-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.15); }
  .cms-field-invalid { border-color: #ef4444 !important; }
  .cms-field-invalid:focus { box-shadow: 0 0 0 3px rgba(239,68,68,0.15) !important; }
  .cms-field-textarea { resize: vertical; min-height: 120px; }
  .cms-field-select { appearance: none; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 0.75rem center; padding-right: 2.5rem; cursor: pointer; }
  .cms-field-wrap--checkbox { flex-direction: row; align-items: flex-start; grid-column: span 2; }
  .cms-field-checkbox-label { display: flex; align-items: flex-start; gap: 0.625rem; cursor: pointer; font-size: 0.9rem; color: #374151; line-height: 1.5; }
  .cms-field-checkbox { width: 16px; height: 16px; margin-top: 3px; flex-shrink: 0; accent-color: #6366f1; cursor: pointer; }
  .cms-field-wrap--message { grid-column: span 2; }
  .cms-field-message-text { margin: 0; font-size: 0.9rem; color: #6b7280; line-height: 1.6; }
  .cms-field-error { font-size: 0.8rem; color: #ef4444; }
  .cms-form-footer { margin-top: 1.5rem; }
  .cms-form-submit {
    display: inline-flex; align-items: center; justify-content: center;
    padding: 0.7rem 2rem; background: #111827; color: #fff;
    border: none; border-radius: 8px; font-size: 0.9375rem; font-weight: 600;
    cursor: pointer; transition: background 0.15s, opacity 0.15s;
  }
  .cms-form-submit:hover:not(:disabled) { background: #1f2937; }
  .cms-form-submit:disabled { opacity: 0.6; cursor: not-allowed; }
  .cms-form-status { margin-top: 1rem; padding: 0.875rem 1rem; border-radius: 8px; font-size: 0.9rem; display: none; }
  .cms-form-status:not(:empty) { display: block; }
  .cms-form-status--success { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
  .cms-form-status--error { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
  .cms-form-status--loading { background: #f9fafb; color: #6b7280; border: 1px solid #e5e7eb; }
  @media (max-width: 600px) {
    .cms-form-fields { grid-template-columns: 1fr; }
    .cms-field-wrap--half { grid-column: span 1; }
  }
`;

// ─────────────────────────────────────────────
// Main export — call this before building srcDoc
// ─────────────────────────────────────────────

/**
 * Detects, fetches, and replaces all form embeds in the given HTML.
 *
 * @param html       Raw page HTML (page.html from DB)
 * @param baseUrl    Optional base URL for API calls (e.g. "http://localhost:3000")
 * @returns          { html, hasForms } — replaced HTML + flag to inject CSS/JS
 */
export async function injectForms(
  html: string,
  baseUrl = "",
): Promise<{ html: string; hasForms: boolean }> {
  const slugs = resolveFormSlugs(html);
  console.log("DEBUG detected slugs:", slugs);
  console.log("DEBUG html length:", html.length);
  console.log("DEBUG html snippet:", html.substring(0, 500));

  if (slugs.length === 0) return { html, hasForms: false };

  const forms = await fetchFormsBySlug(slugs, baseUrl);
  if (forms.size === 0) return { html, hasForms: false };

  const replaced = replaceFormEmbeds(html, forms);
  return { html: replaced, hasForms: true };
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
