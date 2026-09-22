"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { apiListDmConversations, apiStartDm } from "@/lib/api";
import type { DmConversation } from "@/lib/types";

export default function InboxPage() {
  const [items, setItems] = useState<DmConversation[]>([]);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const list = await apiListDmConversations();
      setItems(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load inbox.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function onStart(e: React.FormEvent) {
    e.preventDefault();
    if (!userId.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const conv = await apiStartDm(userId.trim());
      window.location.href = `/inbox/${conv.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start DM.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-cove-mist">Inbox</h1>
          <p className="mt-1 text-sm text-cove-mist-dim">
            1:1 messages. Blocks enforced. New accounts (&lt;24h) need mutual
            friends to DM.
          </p>
        </div>

        <Card>
          <form onSubmit={onStart} className="flex flex-wrap items-end gap-3">
            <div className="min-w-[12rem] flex-1">
              <Input
                label="Start DM with user id"
                name="user_id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="numeric id"
              />
            </div>
            <Button type="submit" loading={busy}>
              Open
            </Button>
          </form>
        </Card>

        {loading ? (
          <p className="text-sm text-cove-mist-dim">Loading…</p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="space-y-2">
          {items.map((c) => (
            <Link key={c.id} href={`/inbox/${c.id}`} className="block">
              <Card className="transition hover:border-cove-accent/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium text-cove-mist">
                      {c.otherDisplayName}
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm text-cove-mist-dim">
                      {c.lastMessagePreview || "No messages yet"}
                    </p>
                  </div>
                  <span className="text-[0.65rem] text-cove-mist-dim">
                    #{c.otherUserId}
                  </span>
                </div>
              </Card>
            </Link>
          ))}
          {!loading && items.length === 0 ? (
            <p className="rounded-none border-2 border-dashed border-cove-border p-6 text-sm text-cove-mist-dim">
              No conversations yet.
            </p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
