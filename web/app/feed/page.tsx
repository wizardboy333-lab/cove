"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Alias — canonical feed lives at /home. */
export default function FeedRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/home");
  }, [router]);
  return (
    <div className="flex min-h-screen items-center justify-center text-cove-mist-dim">
      Redirecting to home…
    </div>
  );
}
