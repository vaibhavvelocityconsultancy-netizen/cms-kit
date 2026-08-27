// src/components/admin/ecommerce/_shared/EcomFormShell.tsx
"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/src/ui/button";
import { Badge } from "@/src/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/ui/alert-dialog";

interface Props {
  title: string;
  backHref: string;
  backLabel?: string;
  saving?: boolean;
  isDirty?: boolean;
  disabled?: boolean;
  onSubmit: () => void;
  icon?: React.ReactNode;
  saveLabel?: string;

  /** Unsaved-changes confirmation (from useUnsavedGuard) */
  showDiscardDialog?: boolean;
  onConfirmDiscard?: () => void;
  onCancelDiscard?: () => void;
  attemptBack?: (fn: () => void) => void;

  children: React.ReactNode;
  testId?: string;
}

export function EcomFormShell({
  title,
  backHref,
  backLabel = "Back",
  saving,
  isDirty,
  disabled,
  onSubmit,
  icon,
  saveLabel = "Save",
  showDiscardDialog,
  onConfirmDiscard,
  onCancelDiscard,
  attemptBack,
  children,
  testId,
}: Props) {
  const router = useRouter();
  const goBack = () => router.push(backHref);
  const handleBackClick = () => {
    if (attemptBack) attemptBack(goBack);
    else goBack();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4" data-testid={testId}>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBackClick}
            className="mb-2 gap-1.5 text-muted-foreground -ml-2"
            type="button"
          >
            <ArrowLeft className="h-4 w-4" />
            {backLabel}
          </Button>
          <div className="flex items-center gap-2">
            {icon && <div className="p-1.5 rounded-md bg-primary/10">{icon}</div>}
            <h1 className="text-2xl font-bold">{title}</h1>
            {isDirty && (
              <Badge variant="outline" className="text-xs">
                Unsaved changes
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" onClick={handleBackClick}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            disabled={saving || disabled}
            data-testid={`${testId}-save-btn`}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {saveLabel}
              </>
            )}
          </Button>
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="space-y-6"
        noValidate
      >
        {children}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={handleBackClick}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving || disabled}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {saveLabel}
              </>
            )}
          </Button>
        </div>
      </form>

      <AlertDialog open={!!showDiscardDialog} onOpenChange={(o) => !o && onCancelDiscard?.()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Leaving now will lose them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={onCancelDiscard}>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={onConfirmDiscard}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Discard changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
