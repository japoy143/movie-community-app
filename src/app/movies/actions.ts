"use server";

import { and, eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { db } from "@/db";
import { comment, movieLike } from "@/db/schema";
import { getLikeCount } from "@/lib/community";
import { COMMENT_MAX_LENGTH, MAX_INT4 } from "@/lib/limits";
import { createLogger } from "@/lib/logger";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getActionSession } from "@/lib/session";
import { getMovie } from "@/lib/tmdb";
import { ensureVisitorId, getVisitorId } from "@/lib/visitor";

// Server Actions are public HTTP endpoints: every argument comes from the
// client and must be validated here, whatever the UI sends.

const log = createLogger("movies/actions");

const TOO_MANY = "You're doing that too often. Try again in a minute.";

/** Lets the UI color failures: "warning" = user can fix/wait, "error" = it broke. */
export type Severity = "warning" | "error";

function isValidId(value: unknown): value is number {
  return Number.isSafeInteger(value) && (value as number) > 0 && (value as number) <= MAX_INT4;
}

/** Rejects ids TMDB doesn't know, so likes/comments can't pile up on junk ids. */
async function movieExists(movieId: number): Promise<boolean> {
  return (await getMovie(movieId)) !== null;
}

// ---------- Likes (guests and members) ----------

export type LikeResult =
  | { ok: true; liked: boolean; count: number }
  | { ok: false; error: string; severity: Severity };

/**
 * Sets (not toggles) the viewer's like, so a stale button can never do the
 * opposite of what the user clicked. Idempotent.
 */
export async function setLike(movieId: number, liked: boolean): Promise<LikeResult> {
  if (!isValidId(movieId) || typeof liked !== "boolean") {
    return { ok: false, error: "Invalid request.", severity: "error" };
  }

  try {
    const session = await getActionSession();
    const ip = await getClientIp();
    const actor = session ? `user:${session.user.id}` : `ip:${ip}`;
    if (!(await rateLimit(`like:${actor}`, { max: 30, windowSeconds: 60 }))) {
      return { ok: false, error: TOO_MANY, severity: "warning" };
    }

    let visitorId: string | null = null;
    if (!session) {
      visitorId = await getVisitorId();
      if (!visitorId) {
        // Minting guest identities is the like-stuffing vector: cap per IP.
        if (!(await rateLimit(`visitor:ip:${ip}`, { max: 10, windowSeconds: 3600, failClosed: true }))) {
          return { ok: false, error: TOO_MANY, severity: "warning" };
        }
        visitorId = await ensureVisitorId();
      }
    }

    if (!(await movieExists(movieId))) return { ok: false, error: "Movie not found.", severity: "error" };

    const owner = session
      ? eq(movieLike.userId, session.user.id)
      : eq(movieLike.visitorId, visitorId!);

    if (liked) {
      await db
        .insert(movieLike)
        .values(session ? { movieId, userId: session.user.id } : { movieId, visitorId })
        .onConflictDoNothing();
    } else {
      await db.delete(movieLike).where(and(eq(movieLike.movieId, movieId), owner));
    }

    const count = await getLikeCount(movieId);
    // Re-render server data so every mounted view (grid card, detail page)
    // shows the new count instead of its stale props.
    refresh();
    return { ok: true, liked, count };
  } catch (error) {
    log.error("setLike failed", { movieId, error });
    return { ok: false, error: "Couldn't update your like. Try again.", severity: "error" };
  }
}

// ---------- Comments (members only) ----------

export type CommentFormState = {
  error: string | null;
  severity?: Severity;
  success: boolean;
};

export async function addComment(
  movieId: number,
  _prev: CommentFormState,
  formData: FormData,
): Promise<CommentFormState> {
  if (!isValidId(movieId) || !(formData instanceof FormData)) {
    return { error: "Invalid request.", severity: "error", success: false };
  }

  const raw = formData.get("body");
  // Browsers submit line breaks as \r\n; count them as one character.
  const body = typeof raw === "string" ? raw.replace(/\r\n?/g, "\n").trim() : "";
  const fail = (error: string, severity: Severity = "error"): CommentFormState => ({
    error,
    severity,
    success: false,
  });

  if (body.length === 0) return fail("Write something first.", "warning");
  if (body.length > COMMENT_MAX_LENGTH) {
    return fail(`Comments can be at most ${COMMENT_MAX_LENGTH} characters.`, "warning");
  }

  try {
    const session = await getActionSession();
    if (!session) return fail("Your session expired. Sign in to comment.", "warning");

    const userKey = `comment:user:${session.user.id}`;
    const allowed =
      (await rateLimit(`${userKey}:min`, { max: 5, windowSeconds: 60, failClosed: true })) &&
      (await rateLimit(`${userKey}:day`, { max: 100, windowSeconds: 86_400, failClosed: true }));
    if (!allowed) return fail(TOO_MANY, "warning");

    if (!(await movieExists(movieId))) return fail("Movie not found.");

    await db.insert(comment).values({ movieId, userId: session.user.id, body });
  } catch (error) {
    log.error("addComment failed", { movieId, error });
    return fail("Couldn't post your comment. Try again.");
  }

  refresh();
  return { error: null, success: true };
}

export async function deleteComment(
  commentId: number,
): Promise<{ ok: boolean; error?: string; severity?: Severity }> {
  if (!isValidId(commentId)) return { ok: false, error: "Invalid request.", severity: "error" };

  try {
    const session = await getActionSession();
    if (!session) return { ok: false, error: "Your session expired. Sign in again.", severity: "warning" };

    if (!(await rateLimit(`comment-delete:user:${session.user.id}`, { max: 20, windowSeconds: 60 }))) {
      return { ok: false, error: TOO_MANY, severity: "warning" };
    }

    const deleted = await db
      .delete(comment)
      .where(and(eq(comment.id, commentId), eq(comment.userId, session.user.id)))
      .returning({ id: comment.id });

    if (deleted.length === 0) {
      // Already deleted (e.g. another tab) or not ours: refresh to drop it.
      log.warn("deleteComment: not found or not owner", { commentId });
    }
  } catch (error) {
    log.error("deleteComment failed", { commentId, error });
    return { ok: false, error: "Couldn't delete the comment. Try again.", severity: "error" };
  }

  refresh();
  return { ok: true };
}
