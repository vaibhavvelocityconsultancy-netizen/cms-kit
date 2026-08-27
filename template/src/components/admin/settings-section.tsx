"use client";

import { GlobalCssEditor } from "@/src/components/global-css-editor";

export function SettingsSection() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="font-sans text-2xl font-bold text-foreground mb-1">
          Settings
        </h1>
        <p className="text-sm font-mono text-muted-foreground">
          app/admin/settings/page.tsx
        </p>
      </div>

      <div className="max-w-2xl bg-card border border-border p-6">
        <h2 className="font-medium text-foreground mb-4">General Settings</h2>
        <div className="space-y-4 text-muted-foreground">
          <p>Settings panel coming soon...</p>
          <p className="text-sm font-mono">
            Global CSS is available at /admin/setting/global-css.
          </p>
        </div>
      </div>
    </div>
  );
}

export function GlobalCssSection() {
  return <GlobalCssEditor />;
}
