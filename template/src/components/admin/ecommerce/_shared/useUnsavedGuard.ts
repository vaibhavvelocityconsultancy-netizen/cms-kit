// src/components/admin/ecommerce/_shared/useUnsavedGuard.ts
"use client";
import { useEffect, useMemo, useState } from "react";

/**
 * Detects if a form has unsaved changes by comparing to an initial
 * snapshot. Also installs the browser `beforeunload` warning while dirty.
 * Returns helpers for a "Discard changes" confirmation flow.
 */
export function useUnsavedGuard<T>(value: T, ready: boolean) {
  const [snapshot, setSnapshot] = useState<string>("");
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);

  // Set snapshot once the form is ready (e.g. after data loads)
  useEffect(() => {
    if (ready && snapshot === "") {
      setSnapshot(JSON.stringify(value));
    }
    // Intentionally excluding `value` — we only snapshot on initial ready
  }, [ready]);

  const isDirty = useMemo(() => {
    if (!snapshot) return false;
    return JSON.stringify(value) !== snapshot;
  }, [value, snapshot]);

  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  function resetSnapshot(next: T) {
    setSnapshot(JSON.stringify(next));
  }

  function attempt(action: () => void) {
    if (isDirty) {
      setPendingAction(() => action);
      setShowDiscardDialog(true);
    } else {
      action();
    }
  }

  function confirmDiscard() {
    setShowDiscardDialog(false);
    if (pendingAction) pendingAction();
    setPendingAction(null);
  }

  function cancelDiscard() {
    setShowDiscardDialog(false);
    setPendingAction(null);
  }

  return {
    isDirty,
    resetSnapshot,
    attempt,
    showDiscardDialog,
    confirmDiscard,
    cancelDiscard,
  };
}
