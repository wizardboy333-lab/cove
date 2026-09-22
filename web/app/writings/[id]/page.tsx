"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import { apiGetWriting } from "@/lib/api";
import { formatRelativeTime } from "@/lib/mock-data";
import type { Writing } from "@/lib/types";

export default function WritingDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const [writing, setWriting] = useState<Writing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        const w = await apiGetWriting(id);
        if (!cancelled) setWriting(w);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Not found.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/writings"
          className="text-sm text-cove-mist-dim hover:text-cove-accent"
        >
          ← Writings
        </Link>

        {loading ? (
          <p className="text-sm text-cove-mist-dim">Loading…</p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        {writing ? (
          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar initials={writing.authorInitials} />
              <div className="text-sm">
                <p className="font-medium text-cove-mist">{writing.authorName}</p>
                <p className="text-cove-mist-dim">
                  {formatRelativeTime(writing.createdAt)}
                </p>
              </div>
            </div>
            <h1 className="font-display text-3xl text-cove-mist sm:text-4xl">
              {writing.title}
            </h1>
            <div className="prose-cove whitespace-pre-wrap text-[15px] leading-relaxed text-cove-mist/95">
              {writing.body}
            </div>
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
