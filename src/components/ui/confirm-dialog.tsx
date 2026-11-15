"use client";

import { useEffect, useId, useRef } from "react";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  pendingLabel?: string;
  cancelLabel?: string;
  /** Red confirm button for irreversible actions (delete, remove…). */
  destructive?: boolean;
  /** While true the dialog stays open and can't be dismissed. */
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * Accessible replacement for window.confirm(), built on the native <dialog>:
 * focus is trapped, Esc and backdrop clicks cancel, and focus returns to the
 * trigger on close.
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  pendingLabel = "Working…",
  cancelLabel = "Cancel",
  destructive = false,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    if (!dialog.open) dialog.showModal();
    // Also closes it if the page is hidden by Activity or unmounted.
    return () => dialog.close();
  }, [open]);

  function cancel() {
    if (!pending) onCancel();
  }

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      className="dialog"
      // Esc: keep React state as the source of truth.
      onCancel={(event) => {
        event.preventDefault();
        cancel();
      }}
      // The dialog has no padding, so a click on itself is a backdrop click.
      onClick={(event) => {
        if (event.target === event.currentTarget) cancel();
      }}
      // The browser can still close it natively (e.g. a repeated Esc).
      // Keep React state in sync with the DOM whenever that happens.
      onClose={() => {
        if (open) onCancel();
      }}
    >
      <div className="stack gap-5 p-5">
        <div className="stack gap-1.5">
          <h2 id={titleId} className="text-headline">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="text-meta">
              {description}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={cancel}
            disabled={pending}
            className="btn btn-secondary"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={pending}
            aria-busy={pending || undefined}
            className={`btn ${destructive ? "btn-danger" : "btn-primary"}`}
          >
            {pending ? pendingLabel : confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}
