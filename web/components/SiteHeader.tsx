import Link from "next/link";

const links = [
  { href: "/feed", label: "Feed" },
  { href: "/groups", label: "Groups" },
  { href: "/login", label: "Log in" },
  { href: "/signup", label: "Sign up" },
];

export function SiteHeader() {
  return (
    <header className="border-b-2 border-cove-border bg-cove-ink/95">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-display text-2xl leading-none text-cove-mist hover:text-cove-accent"
        >
          Cove
        </Link>
        <nav className="flex items-center gap-1 text-xs uppercase tracking-wider text-cove-mist-dim">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-none border-2 border-transparent px-3 py-1.5 transition hover:border-cove-border hover:text-cove-mist"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default SiteHeader;
