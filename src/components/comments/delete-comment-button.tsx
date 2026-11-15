"use client";

import { useLayoutEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteComment } from "@/app/movies/actions";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { createLogger } from "@/lib/logger";

const log = createLogger("delete-comment-button");

export function DeleteCommentButton({ commentId }: { commentId: number }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  // Activity keeps this mounted when navigating away; close the dialog then
  // so it doesn't reappear on Back (Next's guidance for popovers/dialogs).
  useLayoutEffect(() => () => setConfirming(false), []);

  function handleDelete() {
    startTransition(async () => {
      try {
        const result = await deleteComment(commentId);
        if (!result.ok) {
          toast[result.severity ?? "error"](result.error ?? "Couldn't delete the comment.");
          return;
        }
        toast.success("Comment deleted.");
      } catch (err) {
        log.error("deleteComment request failed", { commentId, error: err });
        toast.error("Couldn't reach the server. Check your connection.");
      } finally {
        // Activity can keep this mounted; never leave the dialog open.
        setConfirming(false);
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirming(true)}
        disabled={pending}
        className="link-muted text-xs disabled:opacity-50"
      >
        {pending ? "Deleting…" : "Delete"}
      </button>

      <ConfirmDialog
        open={confirming}
        title="Delete comment?"
        description="This can't be undone."
        confirmLabel="Delete"
        pendingLabel="Deleting…"
        destructive
        pending={pending}
        onConfirm={handleDelete}
        onCancel={() => setConfirming(false)}
      />
    </>
  );
}
