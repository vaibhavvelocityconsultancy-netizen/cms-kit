"use client";

import { Page } from "../Cms";
import { FeaturedImagePanel } from "./FeaturedImagePanel";
import { PageAttributesPanel } from "./PageAttributesPanel";
import { PublishPanel } from "./publishPannel";
// import { PublishPanel } from "./PublishPanel";
// import { PageAttributesPanel } from "./PageAttributesPanel";
// import { FeaturedImagePanel } from "./FeaturedImagePanel";

interface PageEditorSidebarProps {
  page: Page;
  pages: Page[];
  onChange: (page: Page) => void;
  onSave: () => void;
  onPublish: () => void;
  isSaving: boolean;
}


export function PageEditorSidebar({
  page,
  pages,
  onChange,
  onSave,
  onPublish,
  isSaving,
}: PageEditorSidebarProps) {
  return (
    <>
      <PublishPanel
        page={page}
        onChange={onChange}
        onSave={onSave}
        onPublish={onPublish}
        isSaving={isSaving}
      />

      <PageAttributesPanel page={page} pages={pages} onChange={onChange} />

      <FeaturedImagePanel page={page} onChange={onChange} />
    </>
  );
}
