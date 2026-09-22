import Link from "next/link";
import { Avatar } from "./Avatar";
import { Card } from "./Card";
import { formatRelativeTime } from "@/lib/mock-data";
import type { Post } from "@/lib/types";

export function PostCard({ post }: { post: Post }) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start gap-3">
        <Avatar initials={post.authorInitials} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-medium text-cove-mist">{post.authorName}</span>
            <span className="text-xs text-cove-mist-dim">
              {formatRelativeTime(post.createdAt)}
            </span>
          </div>
          {post.groupId && post.groupName ? (
            <Link
              href={`/groups/${post.groupId}`}
              className="mt-0.5 inline-block text-xs text-cove-accent hover:underline"
            >
              in {post.groupName}
            </Link>
          ) : null}
        </div>
      </div>
      <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-cove-mist/95">
        {post.body}
      </p>
    </Card>
  );
}
