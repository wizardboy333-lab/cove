"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { apiGetMyKinks, apiListKinks, apiPutMyKinks } from "@/lib/api";
import type { KinkStance, KinkTag, UserKink } from "@/lib/types";

const STANCES: KinkStance[] = ["into", "curious", "limit"];

export default function ProfileKinksPage() {
  const [tags, setTags] = useState<KinkTag[]>([]);
  const [mine, setMine] = useState<Record<string, KinkStance>>({});
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [all, uk] = await Promise.all([apiListKinks(), apiGetMyKinks()]);
        if (cancelled) return;
        setTags(all);
        const map: Record<string, KinkStance> = {};
        for (const u of uk as UserKink[]) {
          map[u.kinkId] = (u.stance as KinkStance) || "into";
        }
        setMine(map);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load.");
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
        t.slug.toLowerCase().includes(needle)
    );
  }, [tags, q]);

  function cycle(id: string) {
    setMine((prev) => {
      const cur = prev[id];
      if (!cur) return { ...prev, [id]: "into" };
      if (cur === "into") return { ...prev, [id]: "curious" };
      if (cur === "curious") return { ...prev, [id]: "limit" };
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setSavedMsg(null);
  }

  async function onSave() {
    setSaving(true);
    setError(null);
    setSavedMsg(null);
    try {
      const payload = Object.entries(mine).map(([kinkId, stance]) => ({
        kink_id: Number(kinkId),
        stance,
      }));
      const updated = await apiPutMyKinks(payload);
      const map: Record<string, KinkStance> = {};
      for (const u of updated) {
        map[u.kinkId] = u.stance as KinkStance;
      }
      setMine(map);
      setSavedMsg("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  const selectedCount = Object.keys(mine).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-cove-mist">My kinks</h1>
            <p className="mt-1 text-sm text-cove-mist-dim">
              Tap to cycle stance: into → curious → limit → off. {selectedCount}{" "}
              selected.
            </p>
          </div>
          <Link href="/kinks">
            <Button variant="ghost">Directory</Button>
          </Link>
        </div>

        <Input
          label="Filter tags"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {loading ? (
          <p className="text-sm text-cove-mist-dim">Loading…</p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}
        {savedMsg ? (
          <p className="text-sm text-cove-accent">{savedMsg}</p>
        ) : null}

        <Card className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {filtered.map((t) => {
              const stance = mine[t.id];
              const active = !!stance;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => cycle(t.id)}
                  className={`rounded-none border-2 px-2.5 py-1 text-xs uppercase tracking-wider transition ${
                    active
                      ? stance === "limit"
                        ? "border-red-400/60 bg-red-500/15 text-red-300"
                        : stance === "curious"
                          ? "border-cove-mist/50 bg-cove-surface-elevated text-cove-mist"
                          : "border-cove-accent/50 bg-cove-accent/15 text-cove-accent"
                      : "border-cove-border text-cove-mist-dim hover:border-cove-mist/40"
                  }`}
                >
                  {t.name}
                  {stance ? ` · ${stance}` : ""}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {STANCES.map((s) => (
              <span
                key={s}
                className="text-[0.65rem] uppercase tracking-wider text-cove-mist-dim"
              >
                {s}
              </span>
            ))}
          </div>
        </Card>

        <div className="flex flex-wrap gap-3">
          <Button loading={saving} onClick={onSave}>
            Save kinks
          </Button>
          <Link href="/profile">
            <Button variant="ghost">Back to profile</Button>
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
