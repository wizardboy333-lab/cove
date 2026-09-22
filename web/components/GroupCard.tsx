import Link from "next/link";
import { Card } from "./Card";
import type { Group } from "@/lib/types";

export function GroupCard({ group }: { group: Group }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link
            href={`/groups/${group.id}`}
            className="font-display text-xl text-cove-mist hover:text-cove-accent"
          >
            {group.name}
          </Link>
          <p className="mt-1 text-sm leading-relaxed text-cove-mist-dim">
            {group.description}
          </p>
        </div>
        {group.joined ? (
          <span className="shrink-0 rounded-none border border-cove-accent/50 bg-cove-accent/15 px-2.5 py-1 text-xs uppercase tracking-wider text-cove-accent">
            Joined
          </span>
        ) : null}
      </div>
      <p className="text-xs text-cove-mist-dim">
        {group.memberCount.toLocaleString()} members
      </p>
    </Card>
  );
}
