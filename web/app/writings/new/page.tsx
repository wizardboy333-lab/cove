"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Input, TextArea } from "@/components/Input";
import { apiCreateWriting } from "@/lib/api";

export default function NewWritingPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const writing = await apiCreateWriting({ title, body });
      router.push(`/writings/${writing.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not publish.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-cove-mist">
            New writing
          </h1>
          <p className="mt-1 text-sm text-cove-mist-dim">
            Long-form text only. Take your time.
          </p>
        </div>

        <Card>
          <form onSubmit={onSubmit} className="space-y-4">
            <Input
              label="Title"
              name="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              maxLength={120}
            />
            <TextArea
              label="Body"
              name="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              required
              rows={12}
              className="min-h-[240px]"
              hint="Markdown-ish plain text is fine for v1."
            />
            {error ? <p className="text-sm text-red-300">{error}</p> : null}
            <div className="flex flex-wrap gap-3">
              <Button type="submit" loading={loading} disabled={!title.trim() || !body.trim()}>
                Publish
              </Button>
              <Link href="/writings">
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
