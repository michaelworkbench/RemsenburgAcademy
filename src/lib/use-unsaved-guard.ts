import { useBlocker } from "@tanstack/react-router";

/**
 * Warns before navigating away (in-app or tab close) while `dirty` is true.
 * Used by the admin editors so a stray click on a nav tab can't silently
 * discard unsaved edits.
 */
export function useUnsavedChangesGuard(dirty: boolean): void {
  useBlocker({
    shouldBlockFn: () =>
      dirty && !window.confirm("You have unsaved changes. Leave this page without saving?"),
    enableBeforeUnload: () => dirty,
  });
}
