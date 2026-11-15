import { timeAgo } from "@/lib/format";
import type { CommentWithAuthor } from "@/lib/community";
import { DeleteCommentButton } from "./delete-comment-button";

type Props = { comment: CommentWithAuthor; isOwn: boolean };

export function CommentItem({ comment, isOwn }: Props) {
  return (
    <li className="flex gap-3 py-4 first:pt-0">
      <span
        aria-hidden
        className="avatar flex size-9 items-center justify-center text-sm font-semibold text-fg-muted"
      >
        {comment.author.name.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-semibold">{comment.author.name}</span>
          <time dateTime={comment.createdAt.toISOString()} className="text-meta shrink-0">
            {timeAgo(comment.createdAt)}
          </time>
          {isOwn && (
            <span className="ml-auto">
              <DeleteCommentButton commentId={comment.id} />
            </span>
          )}
        </div>
        <p className="mt-0.5 whitespace-pre-wrap break-words">{comment.body}</p>
      </div>
    </li>
  );
}
