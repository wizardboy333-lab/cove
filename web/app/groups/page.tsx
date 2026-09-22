"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { GroupCard } from "@/components/GroupCard";
import { apiListGroups } from "@/lib/api";
import type { Group } from "@/lib/types";

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiListGroups();
        if (!cancelled) setGroups(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load groups.");
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
              Groups
            </h1>
            <p className="mt-1 text-sm text-cove-mist-dim">
              Forums for shared interests. Join, read, post.
            </p>
          </div>
          <Link href="/groups/new">
            <Button variant="secondary">New group</Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-cove-mist-dim">Loading groups…</p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="grid gap-3 sm:grid-cols-1">
          {groups.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
