"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { EventCard } from "@/components/EventCard";
import { apiListEvents } from "@/lib/api";
import type { Event } from "@/lib/types";

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await apiListEvents();
        if (!cancelled) setEvents(list);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not load events.");
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
            <h1 className="font-display text-3xl text-cove-mist">Events</h1>
            <p className="mt-1 text-sm text-cove-mist-dim">
              Upcoming meetups — metro or virtual. City/region only; never street
              addresses.
            </p>
          </div>
          <Link href="/events/new">
            <Button variant="secondary">New event</Button>
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-cove-mist-dim">Loading events…</p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="grid gap-3 sm:grid-cols-1">
          {events.map((e) => (
            <EventCard key={e.id} event={e} />
          ))}
          {!loading && events.length === 0 ? (
            <p className="rounded-none border-2 border-dashed border-cove-border p-6 text-sm text-cove-mist-dim">
              No upcoming events yet.
            </p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
