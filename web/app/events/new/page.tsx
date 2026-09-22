"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input, TextArea } from "@/components/Input";
import { apiCreateEvent } from "@/lib/api";
import type { AttendeeListVisibility, PlaceMode } from "@/lib/types";

const TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "Pacific/Honolulu",
  "UTC",
];

const field =
  "w-full rounded-none border-2 border-cove-border bg-cove-ink px-3.5 py-2.5 text-sm text-cove-mist focus:border-cove-accent focus:outline-none focus:ring-1 focus:ring-cove-accent/40 cove-btn-inset";

function localInputToIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return d.toISOString();
}

export default function NewEventPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [timezone, setTimezone] = useState("America/New_York");
  const [placeMode, setPlaceMode] = useState<PlaceMode>("metro");
  const [metroArea, setMetroArea] = useState("");
  const [virtualUrl, setVirtualUrl] = useState("");
  const [capacity, setCapacity] = useState("");
  const [visibility, setVisibility] =
    useState<AttendeeListVisibility>("going_only");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cap = capacity.trim() ? Number(capacity) : null;
      const event = await apiCreateEvent({
        title,
        description,
        starts_at: localInputToIso(startsAt),
        ends_at: endsAt ? localInputToIso(endsAt) : null,
        timezone,
        place_mode: placeMode,
        metro_area: placeMode === "metro" ? metroArea : undefined,
        virtual_url: placeMode === "virtual" ? virtualUrl : undefined,
        attendee_list_visibility: visibility,
        capacity: cap && !Number.isNaN(cap) ? cap : null,
      });
      router.push(`/events/${event.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create event.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-cove-mist">New event</h1>
          <p className="mt-1 text-sm text-cove-mist-dim">
            City/metro or virtual only — never put a street address in the
            description.
          </p>
        </div>

        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={240}
            />
            <TextArea
              label="Description"
              name="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              hint="No street addresses. Metro/city or virtual link policy only."
            />
            <Input
              label="Starts at"
              name="starts_at"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
            <Input
              label="Ends at (optional)"
              name="ends_at"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />

            <label className="block space-y-1.5">
              <span className="cove-label-muted text-[0.5rem]">Timezone</span>
              <select
                className={field}
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="space-y-2">
              <legend className="cove-label-muted text-[0.5rem]">Place</legend>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 text-sm text-cove-mist">
                  <input
                    type="radio"
                    name="place_mode"
                    checked={placeMode === "metro"}
                    onChange={() => setPlaceMode("metro")}
                  />
                  Metro / city
                </label>
                <label className="flex items-center gap-2 text-sm text-cove-mist">
                  <input
                    type="radio"
                    name="place_mode"
                    checked={placeMode === "virtual"}
                    onChange={() => setPlaceMode("virtual")}
                  />
                  Virtual
                </label>
              </div>
            </fieldset>

            {placeMode === "metro" ? (
              <Input
                label="Metro area"
                name="metro_area"
                value={metroArea}
                onChange={(e) => setMetroArea(e.target.value)}
                required
                maxLength={120}
                hint="e.g. NYC metro — not a street address"
              />
            ) : (
              <Input
                label="Virtual URL"
                name="virtual_url"
                type="url"
                value={virtualUrl}
                onChange={(e) => setVirtualUrl(e.target.value)}
                maxLength={512}
                hint="Only visible to you and people marked Going"
              />
            )}

            <Input
              label="Capacity (optional)"
              name="capacity"
              type="number"
              min={1}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
            />

            <label className="block space-y-1.5">
              <span className="cove-label-muted text-[0.5rem]">
                Attendee list visibility
              </span>
              <select
                className={field}
                value={visibility}
                onChange={(e) =>
                  setVisibility(e.target.value as AttendeeListVisibility)
                }
              >
                <option value="going_only">Going only (default)</option>
                <option value="public">Public</option>
                <option value="host_only">Host only</option>
              </select>
            </label>

            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button
                type="submit"
                loading={loading}
                disabled={!title.trim() || !startsAt}
              >
                Create
              </Button>
              <Link href="/events">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
