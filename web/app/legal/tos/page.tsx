"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";

export default function LegalTosPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/explore"
          className="text-sm text-cove-mist-dim hover:text-cove-accent"
        >
          ← Explore
        </Link>
        <div>
          <h1 className="font-display text-3xl text-cove-mist">Terms of Service</h1>
          <p className="mt-1 text-sm text-cove-mist-dim">
            Stub for soft-launch — not final legal counsel copy.
          </p>
        </div>
        <Card className="space-y-4">
            <p className="text-sm leading-relaxed text-cove-mist/95">Cove is an 18+ social forum. By using the service you confirm you are at least 18 and accept these terms.</p>
            <p className="text-sm leading-relaxed text-cove-mist/95">You are responsible for the content you post and for complying with applicable law. Do not post illegal content, CSAM, or non-consensual imagery.</p>
            <p className="text-sm leading-relaxed text-cove-mist/95">We may suspend accounts that violate guidelines. The service is provided as-is during MVP.</p>
          <p className="text-xs text-cove-mist-dim">Last updated: 2026-09-22 (ET)</p>
        </Card>
      </div>
    </AppShell>
  );
}
