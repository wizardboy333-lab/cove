"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { apiListKinks } from "@/lib/api";
import type { KinkTag } from "@/lib/types";

export default function KinksDirectoryPage() {
  const [tags, setTags] = useState<KinkTag[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiListKinks();
        if (!cancelled) setTags(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load kinks.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return tags;
    return tags.filter(
      (t) =>
        t.name.toLowerCase().includes(needle) ||
        t.slug.toLowerCase().includes(needle) ||
        (t.category || "").toLowerCase().includes(needle)
    );
  }, [tags, q]);

  const byCategory = useMemo(() => {
    const map = new Map<string, KinkTag[]>();
    for (const t of filtered) {
      const cat = t.category || "other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(t);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-cove-mist">Kinks</h1>
            <p className="mt-1 text-sm text-cove-mist-dim">
              Curated taxonomy — browse & tag your profile. Not a people browser.
            </p>
          </div>
          <Link href="/profile/kinks">
            <Button variant="secondary">My kinks</Button>
          </Link>
        </div>

        <Input
          label="Filter"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="spanking, rope, protocol…"
        />

        {loading ? (
          <p className="text-sm text-cove-mist-dim">Loading taxonomy…</p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="space-y-4">
          {byCategory.map(([cat, list]) => (
            <Card key={cat} className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-cove-mist-dim">
                {cat}
              </h2>
              <div className="flex flex-wrap gap-2">
                {list.map((t) => (
                  <span
                    key={t.id}
                    className="rounded-none border border-cove-border bg-cove-surface-elevated px-2.5 py-1 text-xs text-cove-mist"
                    title={t.slug}
                  >
                    {t.name}
                  </span>
                ))}
              </div>
            </Card>
          ))}
          {!loading && filtered.length === 0 ? (
            <p className="rounded-none border-2 border-dashed border-cove-border p-6 text-sm text-cove-mist-dim">
              No tags match.
            </p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
