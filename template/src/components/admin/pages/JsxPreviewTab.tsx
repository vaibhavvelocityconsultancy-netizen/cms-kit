"use client";

import { useState } from "react";

interface JsxPreviewTabProps {
  jsxCode?: string | null;
  warnings?: {
    type: string;
    message: string;
  }[];
  errors?: string[];

  message?: string;
}

export default function JsxPreviewTab({
  jsxCode,
  warnings = [],
  errors = [],
  message,
}: JsxPreviewTabProps) {
  const [showWarningsPanel, setShowWarningsPanel] = useState(false);

  if (!jsxCode) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400 gap-2">
        <span className="text-4xl">⚛️</span>
        <p className="text-sm font-medium">No JSX generated yet</p>
        <p className="text-xs text-gray-400">
          Save or publish the page to generate the React component
        </p>
      </div>
    );
  }

  const hasWarnings = warnings.length > 0;
  const hasErrors = errors.length > 0;

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            React Component (TSX)
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Auto-generated from your HTML on save. {jsxCode.split("\n").length}{" "}
            lines.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Warnings/Errors Indicator */}
          {(hasWarnings || hasErrors) && (
            <div className="relative">
              <button
                onClick={() => setShowWarningsPanel(!showWarningsPanel)}
                className="relative flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors text-xs"
              >
                {hasErrors ? "❌" : "⚠️"}
                <span>{hasErrors ? errors.length : warnings.length}</span>
                <svg
                  className={`w-3 h-3 transition-transform ${showWarningsPanel ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Panel */}
              {showWarningsPanel && (
                <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-hidden">
                  <div className="max-h-80 overflow-y-auto">
                    {/* Errors */}
                    {errors.map((err, i) => (
                      <div
                        key={`err-${i}`}
                        className="flex items-start gap-2 border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700"
                      >
                        <span>❌</span>
                        <span className="flex-1">{err}</span>
                      </div>
                    ))}

                    {/* Warnings */}
                    {warnings.map((warn, i) => {
                      const isWarning = warn.type === "warning";
                      const isInfo = warn.type === "info";

                      return (
                        <div
                          key={`warn-${i}`}
                          className={`flex items-start gap-2 border-b px-4 py-2 text-xs
                            ${
                              isWarning
                                ? "border-yellow-100 bg-yellow-50 text-yellow-800"
                                : "border-blue-100 bg-blue-50 text-blue-700"
                            }`}
                        >
                          <span>{isWarning ? "⚠️" : "ℹ️"}</span>
                          <span className="flex-1">{warn.message}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => navigator.clipboard.writeText(jsxCode)}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors"
          >
            Copy TSX
          </button>
        </div>
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 text-xs text-blue-700">
        ✅ Styles and class names are preserved exactly. Only JSX syntax was
        changed (class → className, style objects, self-closing tags etc.)
      </div>

      {/* Code block */}
      <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs overflow-auto max-h-[600px] leading-relaxed">
        <code>{jsxCode}</code>
      </pre>
    </div>
  );
}