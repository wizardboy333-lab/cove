"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "./Button";

const links = [
  { href: "/home", label: "Home" },
  { href: "/groups", label: "Groups" },
  { href: "/writings", label: "Writings" },
  { href: "/profile", label: "Profile" },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function onLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b-2 border-cove-border bg-cove-ink/95">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/home" className="group flex shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-none border-2 border-cove-accent bg-cove-accent/10 text-cove-accent">
            <span className="font-display text-lg leading-none">C</span>
          </span>
          <span className="hidden font-display text-2xl leading-none text-cove-mist group-hover:text-cove-accent xs:inline sm:inline">
            Cove
          </span>
        </Link>
        <nav className="flex flex-1 items-center justify-center gap-0.5 overflow-x-auto sm:gap-1">
          {links.map((l) => {
            const active =
              pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-none border-2 px-2 py-1.5 text-[0.65rem] uppercase tracking-wider transition sm:px-3 sm:text-xs ${
                  active
                    ? "border-cove-mist bg-cove-surface-elevated text-cove-mist"
                    : "border-transparent text-cove-mist-dim hover:border-cove-border hover:text-cove-mist"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          {user ? (
            <Button
              variant="ghost"
              className="!px-2 !py-1.5 text-xs tracking-wide"
              onClick={onLogout}
            >
              Log out
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
