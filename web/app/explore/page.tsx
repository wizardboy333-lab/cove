"use client";

import Link from "next/link";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { apiSearch } from "@/lib/api";
import type { SearchHit } from "@/lib/types";

const TYPES = [
  { id: "groups,events,writings,kinks,people", label: "All" },
  { id: "groups", label: "Groups" },
  { id: "events", label: "Events" },
  { id: "writings", label: "Writings" },
  { id: "kinks", label: "Kinks" },
  { id: "people", label: "People" },
];

function hrefFor(hit: SearchHit): string {
  switch (hit.type) {
    case "groups":
      return `/groups/${hit.id}`;
    case "events":
      return `/events/${hit.id}`;
    case "writings":
      return `/writings/${hit.id}`;
    case "kinks":
      return `/kinks`;
    case "people":
      return `/u/${hit.id}`;
    default:
      return "/explore";
  }
}

export default function ExplorePage() {
  const [q, setQ] = useState("");
  const [type, setType] = useState(TYPES[0].id);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  async function onSearch(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    setSearched(true);
    try {
      const results = await apiSearch(q.trim(), type);
      setHits(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed.");
      setHits([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-cove-mist">Explore</h1>
          <p className="mt-1 text-sm text-cove-mist-dim">
            Search groups, events, writings, kinks. People by display name
            prefix only — no demographic filters.
          </p>
        </div>

        <Card>
          <form onSubmit={onSearch} className="space-y-3">
            <Input
              label="Query"
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="rope, NYC, nickname…"
              required
            />
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`rounded-none border-2 px-2.5 py-1 text-xs uppercase tracking-wider ${
                    type === t.id
                      ? "border-cove-accent bg-cove-accent/15 text-cove-accent"
                      : "border-cove-border text-cove-mist-dim"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <Button type="submit" loading={loading}>
              Search
            </Button>
          </form>
        </Card>

        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="space-y-2">
          {hits.map((h) => (
            <Link key={`${h.type}-${h.id}`} href={hrefFor(h)} className="block">
              <Card className="transition hover:border-cove-accent/40">
                <p className="text-[0.65rem] uppercase tracking-wider text-cove-mist-dim">
                  {h.type}
                </p>
                <p className="font-medium text-cove-mist">{h.title}</p>
                {h.subtitle ? (
                  <p className="mt-1 line-clamp-2 text-sm text-cove-mist-dim">
                    {h.subtitle}
                  </p>
                ) : null}
              </Card>
            </Link>
          ))}
          {searched && !loading && hits.length === 0 ? (
            <p className="rounded-none border-2 border-dashed border-cove-border p-6 text-sm text-cove-mist-dim">
              No results. Try a shorter prefix for people, or another type.
            </p>
          ) : null}
          {!searched ? (
            <p className="rounded-none border-2 border-dashed border-cove-border p-6 text-sm text-cove-mist-dim">
              Start with a keyword. This is not a dating browser.
            </p>
          ) : null}
        </div>

        <p className="text-xs text-cove-mist-dim">
          <Link href="/legal/guidelines" className="text-cove-accent hover:underline">
            Community guidelines
          </Link>
          {" · "}
          <Link href="/legal/tos" className="text-cove-accent hover:underline">
            Terms
          </Link>
          {" · "}
          <Link href="/legal/privacy" className="text-cove-accent hover:underline">
            Privacy
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
