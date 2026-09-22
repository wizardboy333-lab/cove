"use client";

import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";

export default function PublicProfilePage() {
  const params = useParams();
  const username = String(params.username ?? "");

  return (
    <AppShell requireAuth={false}>
      <div className="space-y-6">
        <Card className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar
              initials={username.slice(0, 2).toUpperCase() || "?"}
              size="lg"
            />
            <div>
              <p className="cove-label-muted">
                Profile
              </p>
              <h1 className="font-display text-3xl text-cove-mist">
                @{username}
              </h1>
            </div>
          </div>
          <p className="text-sm text-cove-mist-dim">
            Public profile stub. Wire to live API when ready.
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
