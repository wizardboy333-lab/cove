import Link from "next/link";
import { Card } from "./Card";
import type { Event } from "@/lib/types";

function formatWhen(iso: string, timezone: string): string {
  try {
    const d = new Date(iso);
    return (
      d.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }) + (timezone ? ` · ${timezone}` : "")
    );
  } catch {
    return iso;
  }
}

export function EventCard({ event }: { event: Event }) {
  const placeLabel =
    event.placeMode === "virtual"
      ? "Virtual"
      : event.metroArea
        ? event.metroArea
        : "Metro";

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/events/${event.id}`}
            className="font-display text-xl text-cove-mist hover:text-cove-accent"
          >
            {event.title}
          </Link>
          <p className="mt-1 text-sm text-cove-mist-dim">
            {formatWhen(event.startsAt, event.timezone)}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {event.cancelled ? (
            <span className="rounded-none border border-red-400/60 bg-red-500/15 px-2.5 py-1 text-xs uppercase tracking-wider text-red-300">
              Cancelled
            </span>
          ) : null}
          <span className="rounded-none border border-cove-accent/50 bg-cove-accent/15 px-2.5 py-1 text-xs uppercase tracking-wider text-cove-accent">
            {placeLabel}
          </span>
        </div>
      </div>
      {typeof event.goingCount === "number" ? (
        <p className="text-xs text-cove-mist-dim">
          {event.goingCount.toLocaleString()} going
        </p>
      ) : null}
    </Card>
  );
}
