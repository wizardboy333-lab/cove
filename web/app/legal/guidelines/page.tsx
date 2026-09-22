"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";

export default function LegalGuidelinesPage() {
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
          <h1 className="font-display text-3xl text-cove-mist">Community Guidelines</h1>
          <p className="mt-1 text-sm text-cove-mist-dim">
            Stub for soft-launch — not final legal counsel copy.
          </p>
        </div>
        <Card className="space-y-4">
            <p className="text-sm leading-relaxed text-cove-mist/95">Consent culture: ask, negotiate, respect limits. No means no; safewords and aftercare matter.</p>
            <p className="text-sm leading-relaxed text-cove-mist/95">No harassment, doxxing, or contacting people who blocked you. Report tools exist for safety.</p>
            <p className="text-sm leading-relaxed text-cove-mist/95">Kink-positive discussion is welcome; real-world crime how-tos and trafficking content are banned.</p>
            <p className="text-sm leading-relaxed text-cove-mist/95">Events: hosts own local legality. Site is not a venue.</p>
          <p className="text-xs text-cove-mist-dim">Last updated: 2026-09-22 (ET)</p>
        </Card>
      </div>
    </AppShell>
  );
}
