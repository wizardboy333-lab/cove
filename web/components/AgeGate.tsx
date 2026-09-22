"use client";

/**
 * 18+ interstitial stub — Queenie can wire persistence (cookie/localStorage)
 * and gate the rest of the app behind confirmation.
 */
import { useState } from "react";

type AgeGateProps = {
  onConfirm?: () => void;
  onExit?: () => void;
};

export function AgeGate({ onConfirm, onExit }: AgeGateProps) {
  const [open, setOpen] = useState(true);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-cove-ink/95 p-6"
    >
      <div className="w-full max-w-md rounded-none border-2 border-cove-border bg-cove-surface p-8 shadow-[0_0_24px_rgba(51,255,102,0.12)]">
        <p className="cove-label mb-2">Cove</p>
        <h2
          id="age-gate-title"
          className="font-display mb-3 text-3xl text-cove-mist"
        >
          Adults only (18+)
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-cove-mist-dim">
          Cove is a private social space for consenting adults. You must be 18
          or older to enter. Illegal content is banned. By continuing you
          confirm you meet the age requirement.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            className="cove-btn-outset flex-1 rounded-none bg-cove-accent px-5 py-2.5 text-sm font-normal uppercase tracking-wider text-cove-ink transition hover:bg-cove-accent-hover"
            onClick={() => {
              setOpen(false);
              onConfirm?.();
            }}
          >
            I am 18 or older
          </button>
          <button
            type="button"
            className="flex-1 rounded-none border-2 border-cove-border px-5 py-2.5 text-sm uppercase tracking-wider text-cove-mist-dim transition hover:border-cove-mist-dim hover:text-cove-mist"
            onClick={() => {
              onExit?.();
              if (typeof window !== "undefined") {
                window.location.href = "https://www.google.com";
              }
            }}
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

export default AgeGate;
