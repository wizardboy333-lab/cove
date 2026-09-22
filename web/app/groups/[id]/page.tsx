"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { ComposePost } from "@/components/ComposePost";
import { PostCard } from "@/components/PostCard";
import {
  apiGetGroup,
  apiGetGroupFeed,
  apiJoinGroup,
  apiLeaveGroup,
} from "@/lib/api";
import type { Group, Post } from "@/lib/types";

export default function GroupDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [group, setGroup] = useState<Group | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [g, feed] = await Promise.all([
        apiGetGroup(id),
        apiGetGroupFeed(id),
      ]);
      setGroup(g);
      setPosts(feed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Group not found.");
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function toggleMembership() {
    if (!group) return;
    setBusy(true);
    try {
      const next = group.joined
        ? await apiLeaveGroup(group.id)
        : await apiJoinGroup(group.id);
      setGroup(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/groups"
          className="text-sm text-cove-mist-dim hover:text-cove-accent"
        >
          ← Groups
        </Link>

        {loading ? (
          <p className="text-sm text-cove-mist-dim">Loading…</p>
        ) : null}
        {error && !group ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : null}

        {group ? (
          <>
            <Card className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <p className="cove-label-muted">
                    Group
                  </p>
                  <h1 className="font-display text-3xl text-cove-mist">
                    {group.name}
                  </h1>
                  <p className="text-sm leading-relaxed text-cove-mist-dim">
                    {group.description}
                  </p>
                  <p className="text-xs text-cove-mist-dim">
                    {group.memberCount.toLocaleString()} members
                  </p>
                </div>
                <Button
                  variant={group.joined ? "secondary" : "primary"}
                  loading={busy}
                  onClick={toggleMembership}
                >
                  {group.joined ? "Leave" : "Join"}
                </Button>
              </div>
            </Card>

            {group.joined ? (
              <ComposePost
                groupId={group.id}
                onCreated={(post) =>
                  setPosts((prev) => [
                    {
                      ...post,
                      groupId: group.id,
                      groupName: group.name,
                    },
                    ...prev,
                  ])
                }
              />
            ) : (
              <p className="text-sm text-cove-mist-dim">
                Join to post in this group.
              </p>
            )}

            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-cove-mist-dim">
                Group feed
              </h2>
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
              {posts.length === 0 ? (
                <p className="rounded-none border-2 border-dashed border-cove-border p-6 text-sm text-cove-mist-dim">
                  No posts in this group yet.
                </p>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
