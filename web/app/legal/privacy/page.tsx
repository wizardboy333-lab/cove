"use client";

import Link from "next/link";
import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/Card";

export default function LegalPrivacyPage() {
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
          <h1 className="font-display text-3xl text-cove-mist">Privacy Policy</h1>
          <p className="mt-1 text-sm text-cove-mist-dim">
            Stub for soft-launch — not final legal counsel copy.
          </p>
        </div>
        <Card className="space-y-4">
            <p className="text-sm leading-relaxed text-cove-mist/95">We store account email, profile fields you provide, and content you post. We do not store full dates of birth — only optional birth year.</p>
            <p className="text-sm leading-relaxed text-cove-mist/95">Event places are metro or virtual only; do not put street addresses in descriptions.</p>
            <p className="text-sm leading-relaxed text-cove-mist/95">Uploaded media on the free-tier host may be ephemeral. See RENDER.md. We do not sell personal data in MVP.</p>
          <p className="text-xs text-cove-mist-dim">Last updated: 2026-09-22 (ET)</p>
        </Card>
      </div>
    </AppShell>
  );
}
