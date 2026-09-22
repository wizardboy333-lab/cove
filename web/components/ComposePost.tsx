"use client";

import { useState } from "react";
import { Button } from "./Button";
import { Card } from "./Card";
import { TextArea } from "./Input";
import { useAuth } from "@/lib/auth-context";
import { apiCreatePost } from "@/lib/api";
import type { Post } from "@/lib/types";

export function ComposePost({
  onCreated,
  groupId,
  topicId,
}: {
  onCreated: (post: Post) => void;
  groupId?: string;
  topicId?: string;
}) {
  const { user } = useAuth();
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const post = await apiCreatePost(body, { groupId, topicId });
      if (user) {
        post.authorName = user.displayName;
        post.authorInitials = user.avatarInitials;
        post.authorId = user.id;
      }
      onCreated(post);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <form onSubmit={submit} className="space-y-3">
        <TextArea
          label="Share something"
          name="body"
          placeholder="A thought, a check-in, an invitation to conversation…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
        />
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        <div className="flex justify-end">
          <Button type="submit" loading={loading} disabled={!body.trim()}>
            Post
          </Button>
        </div>
      </form>
    </Card>
  );
}
