"use client";

import { useState, useEffect, useRef } from "react";
import { Editor as TinyMCEEditor } from "@tinymce/tinymce-react";
import { Page } from "../Cms";
import Heading from "@tiptap/extension-heading";
import Paragraph from "@tiptap/extension-paragraph";

import Editor from "@monaco-editor/react";

import { Button } from "@/src/ui/button";
import { MediaPickerModal } from "../../media-manager/MediaPicker";
import JsxPreviewTab from "./JsxPreviewTab";

interface PageEditorContentProps {
  page: Page;
  onChange: (page: Page) => void;
}

// ─── Toolbar helpers ──────────────────────────────────────────────────────────

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded transition-colors ${
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="w-px h-5 bg-border mx-1" />;
}

const sanitizeHtml = (html: string) =>
  html.replace(/<p><\/p>/g, "").replace(/<p>\s*<\/p>/g, "");

// ─── Attribute-preserving extensions ─────────────────────────────────────────

function mergePreserved(
  stored: Record<string, any>,
  base: Record<string, any>,
): Record<string, any> {
  const out: Record<string, any> = { ...base };
  if (stored.class) out.class = stored.class;
  if (stored.id) out.id = stored.id;
  if (stored.style) out.style = stored.style;
  return out;
}

const preservedAttrs = () => ({
  class: {
    default: null,
    parseHTML: (el: HTMLElement) => el.getAttribute("class"),
    renderHTML: () => ({}),
  },
  id: {
    default: null,
    parseHTML: (el: HTMLElement) => el.getAttribute("id"),
    renderHTML: () => ({}),
  },
  style: {
    default: null,
    parseHTML: (el: HTMLElement) => el.getAttribute("style"),
    renderHTML: () => ({}),
  },
});

const HeadingWithClass = Heading.extend({
  addAttributes() {
    return { ...this.parent?.(), ...preservedAttrs() };
  },
  renderHTML({ node, HTMLAttributes }) {
    const level = node.attrs.level as 1 | 2 | 3 | 4 | 5 | 6;
    const parent = this.parent?.({ node, HTMLAttributes }) as
      | [string, Record<string, any>, 0]
      | undefined;
    return [
      `h${level}`,
      mergePreserved(node.attrs, parent?.[1] ?? HTMLAttributes),
      0,
    ];
  },
});

const ParagraphWithClass = Paragraph.extend({
  addAttributes() {
    return { ...this.parent?.(), ...preservedAttrs() };
  },
  renderHTML({ node, HTMLAttributes }) {
    const parent = this.parent?.({ node, HTMLAttributes }) as
      | [string, Record<string, any>, 0]
      | undefined;
    return ["p", mergePreserved(node.attrs, parent?.[1] ?? HTMLAttributes), 0];
  },
});

// ─── Visual editor (TinyMCE) ──────────────────────────────────────────────────

function VisualEditor({
  page,
  onChange,
}: {
  page: Page;
  onChange: (page: Page) => void;
}) {
  return (
    <TinyMCEEditor
      apiKey="g3ijne351p42i8l9exm3erhq09fcwtechjajupahneoneeg4"
      value={page.html || ""}
      onEditorChange={(content) =>
        onChange({
          ...page,
          html: content,
        })
      }
      init={{
        height: 650,
        menubar: false,
        plugins: [
          "advlist",
          "lists",
          "link", 
          "image",
          "table",
          "code",
          "fullscreen",
        ],
        toolbar:
          "undo redo | blocks | bold italic underline | " +
          "alignleft aligncenter alignright alignjustify | " +
          "bullist numlist | link image table | code",
        valid_elements: "*[*]",
        extended_valid_elements: "*[*]",
        verify_html: false,
        convert_urls: false,
        relative_urls: false,
        branding: false,
        promotion: false,
      }}
    />
  );
}

// ─── Code editor (Monaco) ─────────────────────────────────────────────────────

function CodeEditor({
  page,
  onChange,
}: {
  page: Page;
  onChange: (page: Page) => void;
}) {
  const monacoOptions = {
    minimap: { enabled: false },
    fontSize: 14,
    lineNumbers: "on" as const,
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: "on" as const,
    formatOnPaste: true,
    formatOnType: true,
    autoClosingBrackets: "always" as const,
    autoClosingQuotes: "always" as const,
    autoIndent: "full" as const,
    bracketPairColorization: { enabled: true },
    smoothScrolling: true,
    cursorSmoothCaretAnimation: "on" as const,
  };

  return (
    <>
      <div className="flex border-b border-[#dcdcde] bg-[#1e1e1e]">
        <button className="px-5 py-2.5 text-sm font-mono uppercase tracking-wide text-white border-b-2 border-[#2271b1] bg-[#252526]">
          html
        </button>
      </div>
      <div className="h-125">
        <Editor
          height="100%"
          language="html"
          value={page.html ?? ""}
          onChange={(value) => onChange({ ...page, html: value || "" })}
          theme="vs-dark"
          options={monacoOptions}
          loading={
            <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-sm text-[#858585]">
              Loading editor...
            </div>
          }
        />
      </div>
    </>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function PageEditorContent({ page, onChange }: PageEditorContentProps) {
  const [activeTab, setActiveTab] = useState<"visual" | "code" | "jsx-preview">(
    "visual",
  );
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const handleTabChange = (tab: "visual" | "code" | "jsx-preview") => {
    setActiveTab(tab);
  };

  return (
    <>
      <div>
        <Button
          type="button"
          variant="default"
          size="sm"
          className="top-4 right-4 z-50"
          onClick={() => setShowMediaPicker(true)}
        >
          Add Media
        </Button>
      </div>

      <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex justify-end border-b border-border bg-card px-3">
          {(["visual", "code", "jsx-preview"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "jsx-preview" ? "JSX Preview" : tab}
            </button>
          ))}
        </div>

        {/* Tab content — only the active tab renders */}
        {activeTab === "visual" && (
          <VisualEditor page={page} onChange={onChange} />
        )}

        {activeTab === "code" && (
          <CodeEditor page={page} onChange={onChange} />
        )}

        {activeTab === "jsx-preview" && (
          <JsxPreviewTab
            jsxCode={(page as any).jsxCode}
            warnings={(page as any).warnings}
            errors={(page as any).errors}
          />
        )}
      </div>

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(media: any) => {
          const mediaHtml = media.mimeType.startsWith("image/")
            ? `<img src="${media.url}" alt="${media.altText || ""}" />`
            : `<a href="${media.url}" target="_blank">${media.originalName}</a>`;
          onChange({ ...page, html: (page.html || "") + mediaHtml });
        }}
      />
    </>
  );
}