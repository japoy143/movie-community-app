import type { CommentWithAuthor } from "@/lib/community";
import { CommentItem } from "./comment-item";

type Props = { comments: CommentWithAuthor[]; viewerId: string };

export function CommentList({ comments, viewerId }: Props) {
  if (comments.length === 0) {
    return <p className="text-meta">No comments yet. Start the conversation.</p>;
  }
  return (
    <ul className="divide-y divide-border">
      {comments.map((c) => (
        <CommentItem key={c.id} comment={c} isOwn={c.author.id === viewerId} />
      ))}
    </ul>
  );
}
