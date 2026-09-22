"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { TextArea } from "@/components/Input";
import {
  apiListDmConversations,
  apiListDmMessages,
  apiSendDmMessage,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { DmConversation, DmMessage } from "@/lib/types";

export default function InboxThreadPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { user } = useAuth();
  const [conv, setConv] = useState<DmConversation | null>(null);
  const [messages, setMessages] = useState<DmMessage[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const [list, msgs] = await Promise.all([
        apiListDmConversations(),
        apiListDmMessages(id),
      ]);
      setConv(list.find((c) => c.id === id) || null);
      setMessages(msgs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load thread.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const msg = await apiSendDmMessage(id, body);
      setMessages((prev) => [...prev, msg]);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Send failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/inbox"
          className="text-sm text-cove-mist-dim hover:text-cove-accent"
        >
          ← Inbox
        </Link>

        <div>
          <h1 className="font-display text-3xl text-cove-mist">
            {conv?.otherDisplayName || "Conversation"}
          </h1>
          {conv ? (
            <p className="mt-1 text-sm text-cove-mist-dim">
              User #{conv.otherUserId}
            </p>
          ) : null}
        </div>

        {loading ? (
          <p className="text-sm text-cove-mist-dim">Loading…</p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <Card className="space-y-3">
          {messages.map((m) => {
            const mine = user && m.senderId === user.id;
            return (
              <div
                key={m.id}
                className={`max-w-[85%] rounded-none border-2 px-3 py-2 text-sm ${
                  mine
                    ? "ml-auto border-cove-accent/40 bg-cove-accent/10 text-cove-mist"
                    : "border-cove-border bg-cove-surface-elevated text-cove-mist"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className="mt-1 text-[0.65rem] text-cove-mist-dim">
                  {new Date(m.createdAt).toLocaleString()}
                </p>
              </div>
            );
          })}
          {messages.length === 0 && !loading ? (
            <p className="text-sm text-cove-mist-dim">Say hello.</p>
          ) : null}
        </Card>

        <Card>
          <form onSubmit={onSend} className="space-y-3">
            <TextArea
              label="Message"
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              required
            />
            <Button type="submit" loading={busy} disabled={!body.trim()}>
              Send
            </Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
