"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import {
  apiAdminDismissReport,
  apiAdminListReports,
  apiAdminResolveReport,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { ModReport } from "@/lib/types";

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<ModReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const list = await apiAdminListReports();
      setReports(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load reports.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function resolve(id: string) {
    setBusyId(id);
    try {
      await apiAdminResolveReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resolve failed.");
    } finally {
      setBusyId(null);
    }
  }

  async function dismiss(id: string) {
    setBusyId(id);
    try {
      await apiAdminDismissReport(id);
      setReports((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dismiss failed.");
    } finally {
      setBusyId(null);
    }
  }

  if (user && !user.isAdmin) {
    return (
      <AppShell>
        <p className="text-sm text-red-300">Admin only.</p>
        <Link href="/home" className="text-sm text-cove-accent">
          ← Home
        </Link>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl text-cove-mist">
            Report queue
          </h1>
          <p className="mt-1 text-sm text-cove-mist-dim">
            Open reports. Hide actions already exist on moderation API.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-cove-mist-dim">Loading…</p>
        ) : null}
        {error ? <p className="text-sm text-red-300">{error}</p> : null}

        <div className="space-y-3">
          {reports.map((r) => (
            <Card key={r.id} className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-cove-mist-dim">
                    {r.targetType} #{r.targetId} · status {r.status}
                  </p>
                  <p className="mt-1 text-sm text-cove-mist">{r.reason}</p>
                  <p className="mt-1 text-xs text-cove-mist-dim">
                    Reporter #{r.reporterId} ·{" "}
                    {new Date(r.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    loading={busyId === r.id}
                    onClick={() => void resolve(r.id)}
                  >
                    Resolve
                  </Button>
                  <Button
                    variant="ghost"
                    loading={busyId === r.id}
                    onClick={() => void dismiss(r.id)}
                  >
                    Dismiss
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          {!loading && reports.length === 0 ? (
            <p className="rounded-none border-2 border-dashed border-cove-border p-6 text-sm text-cove-mist-dim">
              No open reports.
            </p>
          ) : null}
        </div>
      </div>
    </AppShell>
  );
}
