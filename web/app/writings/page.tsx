"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Avatar } from "@/components/Avatar";
import { apiListWritings } from "@/lib/api";
import { formatRelativeTime } from "@/lib/mock-data";
import type { Writing } from "@/lib/types";

export default function WritingsPage() {
  const [writings, setWritings] = useState<Writing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiListWritings();
        if (!cancelled) setWritings(list);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Could not load writings."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-cove-mist">
              Writings
            </h1>
            <p className="mt-1 text-sm text-cove-mist-dim">
              Long-form text. Essays, reflections, slow thoughts.
            </p>
          </div>
          <Link href="/writings/new">
            <Button variant="secondary">New writing</Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-cove-mist-dim">Loading…</p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="space-y-3">
          {writings.map((w) => (
            <Link key={w.id} href={`/writings/${w.id}`} className="block">
              <Card className="space-y-3 transition hover:border-cove-accent/40">
                <div className="flex items-center gap-3">
                  <Avatar initials={w.authorInitials} size="sm" />
                  <div className="min-w-0 text-sm">
                    <span className="font-medium text-cove-mist">
                      {w.authorName}
                    </span>
                    <span className="mx-1.5 text-cove-mist-dim">·</span>
                    <span className="text-cove-mist-dim">
                      {formatRelativeTime(w.createdAt)}
                    </span>
                  </div>
                </div>
                <h2 className="text-lg font-semibold text-cove-mist">
                  {w.title}
                </h2>
                <p className="line-clamp-3 text-sm leading-relaxed text-cove-mist-dim">
                  {w.body}
                </p>
              </Card>
            </Link>
          ))}
          {!loading && writings.length === 0 ? (
            <p className="rounded-none border-2 border-dashed border-cove-border p-6 text-sm text-cove-mist-dim">
              No writings yet.
            </p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
