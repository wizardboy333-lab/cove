"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useAge } from "@/lib/age-context";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { ready: ageReady, attested } = useAge();
  const { ready: authReady, user, login } = useAuth();
  const [email, setEmail] = useState("you@cove.local");
  const [password, setPassword] = useState("password");
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
    setLoading(true);
    try {
      await login({ email, password });
      router.push("/home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
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
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-none border-2 border-cove-accent bg-cove-accent/10 text-cove-accent">
            <span className="font-display text-lg leading-none">C</span>
          </div>
          <p className="cove-label">Welcome back</p>
          <h1 className="font-display text-4xl text-cove-mist">Log in</h1>
          <p className="text-sm text-cove-mist-dim">
            Mock auth for the Cove MVP — any password works.
          </p>
        </div>
        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
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
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <Button type="submit" className="w-full" loading={loading}>
              Log in
            </Button>
          </form>
        </Card>
        <p className="text-center text-sm text-cove-mist-dim">
          New here?{" "}
          <Link href="/signup" className="text-cove-accent hover:underline">
            Create an account
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
