"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useAuth } from "@/lib/auth-context";
import { useAge } from "@/lib/age-context";

function decadeLabel(birthYear?: number): string | null {
  if (!birthYear) return null;
  const decade = Math.floor(birthYear / 10) * 10;
  return `${decade}s`;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { attestation } = useAge();

  if (!user) return null;

  const year = user.birth_year ?? attestation?.birth_year;
  const decade = decadeLabel(year);

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl text-cove-mist">
              Profile
            </h1>
            <p className="mt-1 text-sm text-cove-mist-dim">
              How you appear across Cove.
            </p>
          </div>
          <Link href="/profile/edit">
            <Button variant="secondary">Edit</Button>
          </Link>
        </div>

        <Card className="space-y-5">
          <div className="flex items-center gap-4">
            <Avatar initials={user.avatarInitials} size="lg" />
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-cove-mist">
                {user.displayName}
              </h2>
              <p className="text-sm text-cove-mist-dim">{user.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {user.is_18_plus || attestation?.is_18_plus ? (
                  <span className="rounded-none border border-cove-accent/50 bg-cove-accent/15 px-2.5 py-0.5 text-xs uppercase tracking-wider text-cove-accent">
                    18+
                  </span>
                ) : null}
                {decade ? (
                  <span className="rounded-none border border-cove-border bg-cove-surface-elevated px-2.5 py-0.5 text-xs uppercase tracking-wider text-cove-mist-dim">
                    {decade}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-cove-mist-dim">
              Bio
            </h3>
            <p className="text-sm leading-relaxed text-cove-mist/95 whitespace-pre-wrap">
              {user.bio || "No bio yet."}
            </p>
          </div>

          <div className="border-t border-cove-border pt-4">
            <p className="text-xs text-cove-mist-dim">
              Joined{" "}
              {new Date(user.joinedAt).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </p>
            <p className="mt-2 text-xs text-cove-mist-dim">
              Photo upload UI stubbed for later — no video in v1.
            </p>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
