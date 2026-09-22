"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAge } from "@/lib/age-context";
import { useAuth } from "@/lib/auth-context";
import { Nav } from "./Nav";

export function AppShell({
  children,
  requireAuth = true,
}: {
  children: ReactNode;
  requireAuth?: boolean;
}) {
  const router = useRouter();
  const { ready: ageReady, attested } = useAge();
  const { ready: authReady, user } = useAuth();

  useEffect(() => {
    if (!ageReady || !authReady) return;
    if (!attested) {
      router.replace("/gate");
      return;
    }
    if (requireAuth && !user) {
      router.replace("/login");
    }
  }, [ageReady, authReady, attested, user, requireAuth, router]);

  if (!ageReady || !authReady) {
    return (
      <div className="flex min-h-screen items-center justify-center font-display text-xl text-cove-mist-dim">
        Loading…
      </div>
    );
  }

  if (!attested || (requireAuth && !user)) {
    return (
      <div className="flex min-h-screen items-center justify-center font-display text-xl text-cove-mist-dim">
        Redirecting…
      </div>
    );
  }

  return (
    <div className="cove-glow min-h-screen bg-cove-ink text-cove-mist">
      <Nav />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-12">{children}</main>
      <footer className="mx-auto max-w-3xl px-4 py-6 text-center text-[0.65rem] uppercase tracking-wider text-cove-mist-dim sm:px-6">
        <a href="/legal/guidelines" className="hover:text-cove-accent">Guidelines</a>
        <span className="mx-2">·</span>
        <a href="/legal/tos" className="hover:text-cove-accent">Terms</a>
        <span className="mx-2">·</span>
        <a href="/legal/privacy" className="hover:text-cove-accent">Privacy</a>
        <span className="mx-2">·</span>
        <span>18+ only</span>
      </footer>
    </div>
  );
}
