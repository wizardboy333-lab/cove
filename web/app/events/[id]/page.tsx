"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  apiCancelEvent,
  apiClearRsvp,
  apiGetEvent,
  apiListAttendees,
  apiUpsertRsvp,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Event, EventAttendee, RsvpStatus } from "@/lib/types";

function formatWhen(iso: string, timezone: string): string {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }) + (timezone ? ` (${timezone})` : "")
    );
  } catch {
    return iso;
  }
}

export default function EventDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<EventAttendee[] | null>(null);
  const [attendeesLocked, setAttendeesLocked] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const e = await apiGetEvent(id);
      setEvent(e);
      try {
        const list = await apiListAttendees(id);
        setAttendees(list);
        setAttendeesLocked(null);
      } catch (err) {
        setAttendees(null);
        setAttendeesLocked(
          err instanceof Error ? err.message : "Attendee list hidden."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Event not found.");
      setEvent(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function setRsvp(status: RsvpStatus) {
    if (!event || event.cancelled) return;
    setBusy(true);
    setError(null);
    try {
      await apiUpsertRsvp(event.id, { status });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "RSVP failed.");
    } finally {
      setBusy(false);
    }
  }

  async function clearRsvp() {
    if (!event) return;
    setBusy(true);
    setError(null);
    try {
      await apiClearRsvp(event.id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not clear RSVP.");
    } finally {
      setBusy(false);
    }
  }

  async function onCancel() {
    if (!event) return;
    if (!window.confirm("Cancel this event? RSVPs will be blocked.")) return;
    setBusy(true);
    setError(null);
    try {
      const next = await apiCancelEvent(event.id);
      setEvent(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cancel failed.");
    } finally {
      setBusy(false);
    }
  }

  const isHost = !!(user && event && user.id === event.hostId);
  const myStatus = event?.myRsvp?.status;
  const showVirtual =
    !!event?.virtualUrl &&
    (isHost || myStatus === "going");

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/events"
          className="text-sm text-cove-mist-dim hover:text-cove-accent"
        >
          ← Events
        </Link>

        {loading ? (
          <p className="text-sm text-cove-mist-dim">Loading…</p>
        ) : null}
        {error && !event ? (
          <p className="text-sm text-red-300">{error}</p>
        ) : null}

        {event ? (
          <>
            <Card className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 space-y-2">
                  <p className="cove-label-muted">Event</p>
                  <h1 className="font-display text-3xl text-cove-mist">
                    {event.title}
                  </h1>
                  <div className="flex flex-wrap gap-2">
                    {event.cancelled ? (
                      <span className="rounded-none border border-red-400/60 bg-red-500/15 px-2.5 py-1 text-xs uppercase tracking-wider text-red-300">
                        Cancelled
                      </span>
                    ) : null}
                    <span className="rounded-none border border-cove-accent/50 bg-cove-accent/15 px-2.5 py-1 text-xs uppercase tracking-wider text-cove-accent">
                      {event.placeMode === "virtual"
                        ? "Virtual"
                        : event.metroArea || "Metro"}
                    </span>
                  </div>
                  <p className="text-sm text-cove-mist-dim">
                    {formatWhen(event.startsAt, event.timezone)}
                  </p>
                  {event.hostDisplayName ? (
                    <p className="text-xs text-cove-mist-dim">
                      Hosted by {event.hostDisplayName}
                    </p>
                  ) : null}
                  {typeof event.goingCount === "number" ? (
                    <p className="text-xs text-cove-mist-dim">
                      {event.goingCount.toLocaleString()} going
                      {event.capacity != null
                        ? ` · capacity ${event.capacity}`
                        : ""}
                    </p>
                  ) : null}
                </div>
                {isHost && !event.cancelled ? (
                  <Button
                    variant="secondary"
                    loading={busy}
                    onClick={onCancel}
                  >
                    Cancel event
                  </Button>
                ) : null}
              </div>

              {event.description ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-cove-mist/95">
                  {event.description}
                </p>
              ) : null}

              {showVirtual ? (
                <p className="text-sm text-cove-mist">
                  Virtual link:{" "}
                  <a
                    href={event.virtualUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cove-accent underline"
                  >
                    {event.virtualUrl}
                  </a>
                </p>
              ) : event.placeMode === "virtual" ? (
                <p className="text-sm text-cove-mist-dim">
                  Virtual link visible after you RSVP Going
                  {isHost ? " (you are the host)." : "."}
                </p>
              ) : null}
            </Card>

            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            <Card className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-cove-mist-dim">
                Your RSVP
              </h2>
              {event.cancelled ? (
                <p className="text-sm text-cove-mist-dim">
                  This event is cancelled — new RSVPs are blocked.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={myStatus === "going" ? "primary" : "secondary"}
                    loading={busy}
                    onClick={() => setRsvp("going")}
                  >
                    Going
                  </Button>
                  <Button
                    variant={
                      myStatus === "interested" ? "primary" : "secondary"
                    }
                    loading={busy}
                    onClick={() => setRsvp("interested")}
                  >
                    Interested
                  </Button>
                  <Button
                    variant={
                      myStatus === "declined" ? "primary" : "secondary"
                    }
                    loading={busy}
                    onClick={() => setRsvp("declined")}
                  >
                    Declined
                  </Button>
                  {myStatus ? (
                    <Button
                      variant="ghost"
                      loading={busy}
                      onClick={clearRsvp}
                    >
                      Clear
                    </Button>
                  ) : null}
                </div>
              )}
              {myStatus ? (
                <p className="text-xs text-cove-mist-dim">
                  Current: {myStatus}
                </p>
              ) : null}
            </Card>

            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-cove-mist-dim">
                Attendees
              </h2>
              {attendeesLocked ? (
                <p className="rounded-none border-2 border-dashed border-cove-border p-6 text-sm text-cove-mist-dim">
                  {attendeesLocked}
                </p>
              ) : attendees && attendees.length > 0 ? (
                <Card className="space-y-2">
                  {attendees.map((a) => (
                    <div
                      key={a.userId}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-cove-mist">{a.displayName}</span>
                      <span className="text-xs uppercase tracking-wider text-cove-mist-dim">
                        {a.status}
                      </span>
                    </div>
                  ))}
                </Card>
              ) : (
                <p className="rounded-none border-2 border-dashed border-cove-border p-6 text-sm text-cove-mist-dim">
                  No attendees listed yet.
                </p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
