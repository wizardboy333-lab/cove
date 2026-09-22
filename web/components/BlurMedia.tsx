"use client";

import { useMemo, useState } from "react";
import { getApiBaseUrl, getStoredToken } from "@/lib/api";

type Props = {
  src: string;
  alt?: string;
  nsfw?: boolean;
  className?: string;
  caption?: string;
};

/** Blur-until-tap for real media URLs (auth via token query or fetch blob). */
export function BlurMedia({
  src,
  alt = "",
  nsfw = true,
  className = "",
  caption = "Adult media — tap to reveal",
}: Props) {
  const [revealed, setRevealed] = useState(!nsfw);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const absolute = useMemo(() => {
    if (src.startsWith("http")) return src;
    const base = getApiBaseUrl();
    return `${base}${src.startsWith("/") ? src : `/${src}`}`;
  }, [src]);

  async function reveal() {
    if (revealed && blobUrl) {
      setRevealed(false);
      return;
    }
    setError(null);
    try {
      const token = getStoredToken();
      const res = await fetch(absolute, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Media ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
      setRevealed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load media.");
    }
  }

  return (
    <button
      type="button"
      onClick={() => void reveal()}
      className={`group relative block w-full overflow-hidden rounded-none border-2 border-cove-border bg-black text-left ${className}`}
      aria-label={revealed ? "Hide media" : caption}
    >
      {blobUrl && revealed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={blobUrl}
          alt={alt}
          className="aspect-square w-full object-cover"
        />
      ) : (
        <div className="flex aspect-square w-full flex-col items-center justify-center gap-2 bg-cove-ink p-4">
          <span className="text-xs uppercase tracking-wider text-cove-mist">
            {caption}
          </span>
          {error ? (
            <span className="text-xs text-red-300">{error}</span>
          ) : (
            <span className="text-[0.65rem] text-cove-mist-dim">
              Tap to reveal
            </span>
          )}
        </div>
      )}
      {!revealed && (
        <span className="pointer-events-none absolute inset-0 bg-black/25" />
      )}
    </button>
  );
}

export default BlurMedia;
