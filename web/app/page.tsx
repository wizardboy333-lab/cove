"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { useAge } from "@/lib/age-context";
import { useAuth } from "@/lib/auth-context";

export default function LandingPage() {
  const router = useRouter();
  const { ready: ageReady, attested } = useAge();
  const { ready: authReady, user } = useAuth();

  useEffect(() => {
    if (!ageReady || !authReady) return;
    if (!attested) {
      router.replace("/gate");
      return;
    }
    if (user) {
      router.replace("/home");
    }
  }, [ageReady, authReady, attested, user, router]);

  if (!ageReady || !authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center font-display text-xl text-cove-mist-dim">
        Loading Cove…
      </div>
    );
  }

  if (!attested || user) {
    return (
      <div className="flex min-h-screen items-center justify-center font-display text-xl text-cove-mist-dim">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="cove-glow flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between border-b-2 border-cove-border/60 px-4 py-5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-none border-2 border-cove-accent bg-cove-accent/10 text-cove-accent">
            <span className="font-display text-xl leading-none">C</span>
          </span>
          <span className="font-display text-2xl leading-none text-cove-mist">
            Cove
          </span>
        </div>
        <Link
          href="/login"
          className="text-xs uppercase tracking-wider text-cove-mist-dim transition hover:text-cove-accent"
        >
          Log in
        </Link>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-12 px-4 pb-20 pt-8 sm:px-6">
        <div className="space-y-5">
          <p className="cove-label">&gt; Adults only · 18+</p>
          <h1 className="font-display max-w-xl text-5xl leading-tight text-cove-mist sm:text-6xl">
            A quiet harbor for thoughtful adult connection.
          </h1>
          <p className="max-w-lg text-base leading-relaxed text-cove-mist-dim sm:text-[1.05rem]">
            Cove is a dark, consent-forward social forum — profiles, groups,
            writings, and a chronological feed. No street-address events. No
            video circus. Just people who write like adults.
          </p>
          <div className="flex flex-wrap gap-3 pt-3">
            <Link href="/signup">
              <Button>Create account</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary">Log in</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "18+ gate",
              body: "Attestation without a full birthday calendar. Optional birth year for decade-style display later.",
            },
            {
              title: "Groups + feed",
              body: "Chronological posts, communities, and writings — built for conversation, not algorithms.",
            },
            {
              title: "Photos + text",
              body: "Writings and photo stubs. Events stay metro / virtual — never street addresses in v1.",
            },
          ].map((item) => (
            <Card key={item.title} className="!p-5 space-y-2.5">
              <h2 className="font-display text-xl text-cove-mist">
                {item.title}
              </h2>
              <p className="text-sm leading-relaxed text-cove-mist-dim">
                {item.body}
              </p>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
