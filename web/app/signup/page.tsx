"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useAge } from "@/lib/age-context";
import { useAuth } from "@/lib/auth-context";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_BIRTH_YEAR = 1900;
const MAX_BIRTH_YEAR = CURRENT_YEAR - 18;

export default function SignupPage() {
  const router = useRouter();
  const { ready: ageReady, attested } = useAge();
  const { ready: authReady, user, signup } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [is18Plus, setIs18Plus] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ageReady || !authReady) return;
    if (!attested) {
      router.replace("/gate");
      return;
    }
    if (user) router.replace("/home");
  }, [ageReady, authReady, attested, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!is18Plus) {
      setError("You must confirm you are 18 or older.");
      return;
    }

    let birth_year: number | undefined;
    if (birthYear.trim()) {
      const y = Number.parseInt(birthYear.trim(), 10);
      if (
        Number.isNaN(y) ||
        y < MIN_BIRTH_YEAR ||
        y > MAX_BIRTH_YEAR
      ) {
        setError(
          `Birth year must be between ${MIN_BIRTH_YEAR} and ${MAX_BIRTH_YEAR} (18+).`
        );
        return;
      }
      birth_year = y;
    }

    setLoading(true);
    try {
      await signup({
        email,
        password,
        displayName,
        is_18_plus: true,
        birth_year,
      });
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Signup failed.");
    } finally {
      setLoading(false);
    }
  }

  if (!ageReady || !authReady || !attested) {
    return (
      <div className="flex min-h-screen items-center justify-center text-cove-mist-dim">
        Loading…
      </div>
    );
  }

  return (
    <div className="cove-glow flex min-h-screen items-center justify-center px-4 py-14 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-3 text-center">
          <p className="cove-label">Adults only · 18+</p>
          <h1 className="font-display text-4xl text-cove-mist">Join Cove</h1>
          <p className="text-sm text-cove-mist-dim">
            Create an account with email and a display name.
          </p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Display name"
              name="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              hint="Shown on posts and your profile."
            />
            <Input
              label="Email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              hint="At least 8 characters."
            />
            <Input
              label="Birth year (optional)"
              name="birthYear"
              type="number"
              inputMode="numeric"
              min={MIN_BIRTH_YEAR}
              max={MAX_BIRTH_YEAR}
              placeholder="e.g. 1990"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              hint="Year only — we never store a full date of birth."
            />
            <label className="flex items-start gap-3 rounded-none border-2 border-cove-border bg-cove-ink/70 px-3.5 py-3 text-sm text-cove-mist">
              <input
                type="checkbox"
                name="is_18_plus"
                checked={is18Plus}
                onChange={(e) => setIs18Plus(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded-none border-cove-border bg-cove-ink text-cove-accent focus:ring-cove-accent/40"
                required
              />
              <span>
                I confirm I am <strong className="font-medium">18 or older</strong>{" "}
                and agree to Cove’s adult-only community guidelines.
              </span>
            </label>
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <Button type="submit" className="w-full" loading={loading}>
              Create account
            </Button>
          </form>
        </Card>
        <p className="text-center text-sm text-cove-mist-dim">
          Already have an account?{" "}
          <Link href="/login" className="text-cove-accent hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
