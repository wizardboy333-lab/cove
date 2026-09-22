"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Avatar } from "@/components/Avatar";
import { BlurMedia } from "@/components/BlurMedia";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  apiGetWriting,
  apiListWritingMedia,
  apiUploadMedia,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { formatRelativeTime } from "@/lib/mock-data";
import type { Media, Writing } from "@/lib/types";

export default function WritingDetailPage() {
  const params = useParams();
  const id = String(params.id ?? "");
  const { user } = useAuth();
  const [writing, setWriting] = useState<Writing | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!id) return;
      try {
        const [w, m] = await Promise.all([
          apiGetWriting(id),
          apiListWritingMedia(id).catch(() => [] as Media[]),
        ]);
        if (!cancelled) {
          setWriting(w);
          setMedia(m);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Not found.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function onUpload(file: File | null) {
    if (!file || !writing) return;
    setUploading(true);
    setError(null);
    try {
      const m = await apiUploadMedia({
        file,
        nsfw: true,
        writingId: writing.id,
      });
      setMedia((prev) => [...prev, m]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  const isAuthor = !!(user && writing && user.id === writing.authorId);

  return (
    <AppShell>
      <div className="space-y-6">
        <Link
          href="/writings"
          className="text-sm text-cove-mist-dim hover:text-cove-accent"
        >
          ← Writings
        </Link>

        {loading ? (
          <p className="text-sm text-cove-mist-dim">Loading…</p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        {writing ? (
          <Card className="space-y-5">
            <div className="flex items-center gap-3">
              <Avatar initials={writing.authorInitials} />
              <div className="text-sm">
                <p className="font-medium text-cove-mist">{writing.authorName}</p>
                <p className="text-cove-mist-dim">
                  {formatRelativeTime(writing.createdAt)}
                </p>
              </div>
            </div>
            <h1 className="font-display text-3xl text-cove-mist sm:text-4xl">
              {writing.title}
            </h1>
            <div className="prose-cove whitespace-pre-wrap text-[15px] leading-relaxed text-cove-mist/95">
              {writing.body}
            </div>

            {media.length > 0 ? (
              <div className="grid gap-3 sm:grid-cols-2">
                {media.map((m) =>
                  m.url ? (
                    <BlurMedia key={m.id} src={m.url} nsfw={m.nsfw} />
                  ) : null
                )}
              </div>
            ) : null}

            {isAuthor ? (
              <div className="space-y-2 border-t border-cove-border pt-4">
                <p className="text-xs uppercase tracking-wider text-cove-mist-dim">
                  Attach photo
                </p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => void onUpload(e.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-cove-mist-dim file:mr-3 file:rounded-none file:border-2 file:border-cove-border file:bg-cove-surface-elevated file:px-3 file:py-1.5 file:text-xs file:uppercase file:tracking-wider file:text-cove-mist"
                />
                {uploading ? (
                  <p className="text-xs text-cove-mist-dim">Uploading…</p>
                ) : null}
                <Button type="button" variant="ghost" className="!px-0" disabled>
                  Images only — no video
                </Button>
              </div>
            ) : null}
          </Card>
        ) : null}
      </div>
    </AppShell>
  );
}
