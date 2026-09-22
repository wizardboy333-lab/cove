"use client";

import { useState } from "react";

type Props = {
  className?: string;
  caption?: string;
};

/** Pixelated 18+ media stand-in — tap to reveal (consent click). */
export function PixelMediaPlaceholder({
  className = "",
  caption = "Adult media — tap to reveal",
}: Props) {
  const [revealed, setRevealed] = useState(false);

  return (
    <button
      type="button"
      onClick={() => setRevealed((v) => !v)}
      className={`group relative block w-full overflow-hidden rounded-none border-2 border-cove-border bg-black text-left ${className}`}
      aria-label={revealed ? "Hide media" : caption}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={
          revealed
            ? "/graphics/pixel-guy-schlong.png"
            : "/graphics/pixel-guy-schlong-mosaic.png"
        }
        alt=""
        className={`aspect-square w-full object-cover transition ${revealed ? "" : "scale-105"}`}
        style={{ imageRendering: revealed ? "auto" : "pixelated" }}
      />
      {!revealed && (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/35 p-4 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/graphics/gen-18plus-badge.png"
            alt=""
            className="h-14 w-14 drop-shadow-lg"
            style={{ imageRendering: "pixelated" }}
          />
          <span className="text-xs uppercase tracking-wider text-cove-mist">
            {caption}
          </span>
        </span>
      )}
    </button>
  );
}

export default PixelMediaPlaceholder;
