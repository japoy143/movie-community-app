"use client";

import { useActionState, useId, useState } from "react";
import { toast } from "sonner";
import { addComment, type CommentFormState } from "@/app/movies/actions";
import { COMMENT_MAX_LENGTH } from "@/lib/limits";
import { createLogger } from "@/lib/logger";

const log = createLogger("comment-form");

const initialState: CommentFormState = { error: null, success: false };

export function CommentForm({ movieId }: { movieId: number }) {
  // Controlled: React resets uncontrolled forms after every action, which
  // would wipe the user's text when posting fails.
  const [text, setText] = useState("");
  const textareaId = useId();

  const [state, formAction, pending] = useActionState(
    async (prev: CommentFormState, formData: FormData): Promise<CommentFormState> => {
      const submitted = String(formData.get("body") ?? "");
      try {
        const result = await addComment(movieId, prev, formData);
        setText(result.success ? "" : submitted);
        if (result.success) toast.success("Comment posted.");
        else if (result.error) toast[result.severity ?? "error"](result.error);
        return result;
      } catch (err) {
        log.error("addComment request failed", { movieId, error: err });
        setText(submitted);
        toast.error("Couldn't reach the server. Check your connection.");
        return { error: "Couldn't reach the server.", severity: "error", success: false };
      }
    },
    initialState,
  );

  // Match the server, which counts a line break as one character.
  const length = text.replace(/\r\n?/g, "\n").length;
  const remaining = COMMENT_MAX_LENGTH - length;

  return (
    <form action={formAction} className="stack gap-2">
      <label htmlFor={textareaId} className="sr-only">
        Add a comment
      </label>
      <textarea
        id={textareaId}
        name="body"
        required
        rows={3}
        maxLength={COMMENT_MAX_LENGTH}
        placeholder="What did you think?"
        value={text}
        onChange={(e) => setText(e.target.value)}
        aria-invalid={state.error ? true : undefined}
        className="textarea"
      />
      <div className="flex items-center justify-between">
        <span className={`text-xs tabular-nums ${remaining < 50 ? "text-danger" : "text-fg-subtle"}`}>
          {remaining} left
        </span>
        <button
          type="submit"
          disabled={pending || text.trim().length === 0}
          className="btn btn-primary btn-sm"
        >
          {pending ? "Posting…" : "Post"}
        </button>
      </div>
    </form>
  );
}
