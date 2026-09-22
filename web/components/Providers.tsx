"use client";

import type { ReactNode } from "react";
import { AgeProvider } from "@/lib/age-context";
import { AuthProvider } from "@/lib/auth-context";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AgeProvider>
      <AuthProvider>{children}</AuthProvider>
    </AgeProvider>
  );
}
