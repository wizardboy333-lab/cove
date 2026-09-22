"use client";

import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ComposePost } from "@/components/ComposePost";
import { PostCard } from "@/components/PostCard";
import { PixelMediaPlaceholder } from "@/components/PixelMediaPlaceholder";
import { apiGetFeed } from "@/lib/api";
import type { Post } from "@/lib/types";

export default function HomePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const feed = await apiGetFeed();
      setPosts(feed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-cove-mist">
            Home
          </h1>
          <p className="mt-1 text-sm text-cove-mist-dim">
            Chronological feed — newest first. Compose below.
          </p>
        </div>

        <div className="grid max-w-xs gap-2">
          <p className="text-xs uppercase tracking-wider text-cove-mist-dim">
            Media preview (pixelated until tap)
          </p>
          <PixelMediaPlaceholder />

        </div>

        <ComposePost
          onCreated={(post) => setPosts((prev) => [post, ...prev])}
        />

        {loading ? (
          <p className="text-sm text-cove-mist-dim">Loading feed…</p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
          {!loading && posts.length === 0 ? (
            <p className="rounded-none border-2 border-dashed border-cove-border p-6 text-sm text-cove-mist-dim">
              No posts yet. Be the first to share something.
            </p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
