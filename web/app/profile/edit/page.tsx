"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { BlurMedia } from "@/components/BlurMedia";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input, TextArea } from "@/components/Input";
import { useAuth } from "@/lib/auth-context";
import { isValidBirthYear, maxBirthYearFor18Plus } from "@/lib/age-gate";
import { apiUploadMedia } from "@/lib/api";
import type { Media } from "@/lib/types";

export default function ProfileEditPage() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [birthYear, setBirthYear] = useState(
    user?.birth_year != null ? String(user.birth_year) : ""
  );
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatar, setAvatar] = useState<Media | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  async function onUpload(file: File | null) {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const media = await apiUploadMedia({
        file,
        nsfw: true,
        isAvatar: true,
      });
      setAvatar(media);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let year: number | undefined;
    const trimmed = birthYear.trim();
    if (trimmed) {
      year = Number(trimmed);
      if (!isValidBirthYear(year)) {
        setError(
          `Birth year must be ≤ ${maxBirthYearFor18Plus()} (year only, 18+).`
        );
        return;
      }
    }

    setLoading(true);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        bio: bio.trim(),
        birth_year: year,
      });
      router.push("/profile");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-cove-mist">
            Edit profile
          </h1>
          <p className="mt-1 text-sm text-cove-mist-dim">
            Display name, bio, optional birth year. No full DOB.
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
            />
            <TextArea
              label="Bio"
              name="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={4}
              hint="A few sentences about how you show up here."
            />
            <Input
              label="Birth year (optional)"
              name="birth_year"
              type="number"
              inputMode="numeric"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              min={1900}
              max={maxBirthYearFor18Plus()}
              hint="Year only — used for decade-style display (e.g. 40s)."
            />

            <div className="space-y-3 rounded-none border-2 border-dashed border-cove-border bg-cove-ink/30 p-4">
              <p className="text-sm font-medium text-cove-mist">Photo</p>
              <p className="text-xs text-cove-mist-dim">
                Images only (JPEG/PNG/WebP/GIF). Treated as NSFW — blur until
                tap. No video in v1.
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
              {avatar?.url ? (
                <BlurMedia src={avatar.url} nsfw={avatar.nsfw} className="max-w-xs" />
              ) : null}
            </div>

            {error ? <p className="text-sm text-red-300">{error}</p> : null}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" loading={loading}>
                Save
              </Button>
              <Link href="/profile">
                <Button type="button" variant="ghost">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}
