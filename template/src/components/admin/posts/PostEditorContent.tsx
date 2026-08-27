"use client";

import { useState } from "react";
import { Editor as TinyMCEEditor } from "@tinymce/tinymce-react";
import Editor from "@monaco-editor/react";

import { Post } from "./Post.type";
import { Button } from "@/src/ui/button";
import { MediaPickerModal } from "../../media-manager/MediaPicker";

interface PostEditorContentProps {
  post: Post;
  onChange: (post: Post) => void;
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

// ─── Visual editor (TinyMCE) ──────────────────────────────────────────────────

function VisualEditor({
  post,
  onChange,
}: {
  post: Post;
  onChange: (post: Post) => void;
}) {
  return (
    <TinyMCEEditor
      apiKey="g3ijne351p42i8l9exm3erhq09fcwtechjajupahneoneeg4"
      value={post.content || ""}
      onEditorChange={(content) =>
        onChange({
          ...post,
          content: content,
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
  post,
  onChange,
}: {
  post: Post;
  onChange: (post: Post) => void;
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
          value={post.content ?? ""}
          onChange={(value) => onChange({ ...post, content: value || "" })}
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

export function PostEditorContent({ post, onChange }: PostEditorContentProps) {
  const [activeTab, setActiveTab] = useState<"visual" | "code">("visual");
  const [showMediaPicker, setShowMediaPicker] = useState(false);

  const handleTabChange = (tab: "visual" | "code") => {
    setActiveTab(tab);
  };

  return (
    <>

      <div className="bg-card border border-border rounded shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex justify-end border-b border-border bg-card px-3">
          {(["visual", "code"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content — only the active tab renders */}
        {activeTab === "visual" && (
          <VisualEditor post={post} onChange={onChange} />
        )}

        {activeTab === "code" && (
          <CodeEditor post={post} onChange={onChange} />
        )}
      </div>

      <MediaPickerModal
        open={showMediaPicker}
        onClose={() => setShowMediaPicker(false)}
        onSelect={(media: any) => {
          const mediaHtml = media.mimeType.startsWith("image/")
            ? `<img src="${media.url}" alt="${media.altText || ""}" />`
            : `<a href="${media.url}" target="_blank">${media.originalName}</a>`;
          onChange({ ...post, content: (post.content || "") + mediaHtml });
        }}
      />
    </>
  );
}