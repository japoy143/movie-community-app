import { unstable_rethrow } from "next/navigation";
import {
  getCommentCount,
  getComments,
  getViewer,
  type CommentWithAuthor,
} from "@/lib/community";
import { createLogger } from "@/lib/logger";
import { CommentForm } from "./comment-form";
import { CommentList } from "./comment-list";
import { CommentsLocked } from "./comments-locked";

const log = createLogger("comment-section");

// Members-only: for guests only the count is queried, never the comments.
export async function CommentSection({ movieId }: { movieId: number }) {
  return (
    <section aria-labelledby={`comments-heading-${movieId}`} className="stack gap-4">
      <h2 id={`comments-heading-${movieId}`} className="text-headline">
        Comments
      </h2>
      <CommentSectionBody movieId={movieId} />
    </section>
  );
}

type CommentData =
  | { kind: "guest"; count: number }
  | { kind: "member"; viewerId: string; comments: CommentWithAuthor[] };

async function loadComments(movieId: number): Promise<CommentData | null> {
  try {
    const viewer = await getViewer();
    if (viewer.kind === "guest") {
      return { kind: "guest", count: await getCommentCount(movieId) };
    }
    return {
      kind: "member",
      viewerId: viewer.userId,
      comments: await getComments(movieId, viewer),
    };
  } catch (error) {
    // Let Next's control-flow errors (prerender bailout, notFound…) through.
    unstable_rethrow(error);
    log.error("failed to load comments", { movieId, error });
    return null;
  }
}

async function CommentSectionBody({ movieId }: { movieId: number }) {
  const data = await loadComments(movieId);
  if (!data) return <p className="text-meta">Comments are unavailable right now.</p>;
  if (data.kind === "guest") return <CommentsLocked count={data.count} movieId={movieId} />;
  return (
    <div className="stack gap-6">
      <CommentForm movieId={movieId} />
      <CommentList comments={data.comments} viewerId={data.viewerId} />
    </div>
  );
}

export function CommentSectionSkeleton() {
  return (
    <div className="stack gap-3" aria-busy="true" aria-label="Loading comments">
      <div className="h-7 w-32 rounded-md bg-surface-hover" />
      <div className="h-24 rounded-md bg-surface-hover" />
    </div>
  );
}
