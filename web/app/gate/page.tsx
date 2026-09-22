"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input } from "@/components/Input";
import { useAge } from "@/lib/age-context";
import {
  currentYear,
  isValidBirthYear,
  maxBirthYearFor18Plus,
} from "@/lib/age-gate";

const GUIDELINES = [
  "You must be 18 or older. Cove is adults-only; underage visitors must leave.",
  "Consent is required. No means no — pressure, coercion, and non-consensual content are banned.",
  "Respect privacy. Do not share others’ personal info, photos, or messages without clear permission.",
  "No illegal content. Report abuse; we take reports seriously.",
  "Be civil. Debate ideas; don’t attack people. Harassment and hate get you removed.",
];

export default function GatePage() {
  const router = useRouter();
  const { ready, attested, attest } = useAge();
  const [checked, setChecked] = useState(false);
  const [birthYear, setBirthYear] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (ready && attested) {
      router.replace("/");
    }
  }, [ready, attested, router]);

  function confirm() {
    setError(null);
    if (!checked) {
      setError("Confirm that you are 18 years of age or older to continue.");
      return;
    }

    let yearNum: number | undefined;
    const trimmed = birthYear.trim();
    if (trimmed) {
      yearNum = Number(trimmed);
      if (!isValidBirthYear(yearNum)) {
        setError(
          `Birth year must be a four-digit year no later than ${maxBirthYearFor18Plus()} (18+).`
        );
        return;
      }
    }

    attest({
      is_18_plus: true,
      ...(yearNum !== undefined ? { birth_year: yearNum } : {}),
    });
    router.replace("/login");
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center font-display text-xl text-cove-mist-dim">
        Loading…
      </div>
    );
  }

  return (
    <div className="cove-glow flex min-h-screen items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md space-y-8">
        <div className="space-y-4 text-center">
          <div className="mx-auto overflow-hidden rounded-none border-2 border-cove-border shadow-[0_0_28px_-8px_rgba(255,43,214,0.35)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/graphics/gen-cove-banner.png"
              alt=""
              className="h-28 w-full object-cover object-center sm:h-32"
            />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/graphics/pixel-18plus-badge.png"
            alt="18+"
            className="mx-auto h-16 w-16 image-rendering-pixelated"
            style={{ imageRendering: "pixelated" }}
          />
          <p className="cove-label">Age gate</p>
          <h1 className="font-display text-4xl text-cove-mist">
            Welcome to Cove
          </h1>
          <p className="text-sm leading-relaxed text-cove-mist-dim">
            An 18+ social forum for thoughtful connection. United States launch —
            English first. Confirm your age before entering.
          </p>
        </div>

        <Card className="space-y-6 !p-6">
          <div className="space-y-3">
            <h2 className="cove-label-muted">Community guidelines</h2>
            <ul className="space-y-2.5 text-sm leading-relaxed text-cove-mist/90">
              {GUIDELINES.map((g) => (
                <li key={g} className="flex gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-none bg-cove-accent" />
                  <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 border-t border-cove-border/80 pt-5">
            <h2 className="cove-label-muted">Age attestation</h2>
            <p className="text-sm leading-relaxed text-cove-mist/90">
              We do not collect a full date of birth here. You attest that you are
              at least <strong className="text-cove-mist">18</strong>. Optional
              birth year is only for later “40s”-style display — never a calendar
              DOB.
            </p>

            <label className="flex cursor-pointer items-start gap-3 rounded-none border-2 border-cove-border bg-cove-ink/70 p-3.5">
              <input
                type="checkbox"
                name="is_18_plus"
                className="mt-1 h-4 w-4 rounded-none border-cove-border accent-cove-accent"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
              />
              <span className="text-sm text-cove-mist">
                I am 18 years of age or older (
                <code className="text-cove-teal">is_18_plus</code>), and I agree
                to these guidelines.
              </span>
            </label>

            <Input
              label="Birth year (optional)"
              name="birth_year"
              type="number"
              inputMode="numeric"
              placeholder={`e.g. ${currentYear() - 30}`}
              min={1900}
              max={maxBirthYearFor18Plus()}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              hint={`Year only — must be ${maxBirthYearFor18Plus()} or earlier if provided.`}
            />
          </div>

          {error ? <p className="text-sm text-red-300">{error}</p> : null}

          <Button className="w-full" onClick={confirm}>
            Enter Cove
          </Button>

          <p className="text-center text-xs leading-relaxed text-cove-mist-dim">
            If you are under 18, leave this site. Attestation (
            <code className="text-cove-mist-dim">is_18_plus</code>
            {birthYear.trim() ? " + birth_year" : ""}) is stored only in this
            browser&apos;s localStorage.
          </p>
        </Card>
      </div>
    </div>
  );
}
