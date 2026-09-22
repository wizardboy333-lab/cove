import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-none border-2 border-cove-border bg-cove-surface p-5 shadow-[inset_0_0_0_1px_rgba(51,255,102,0.06),0_0_14px_rgba(51,255,102,0.05)] ${className}`}
    >
      {children}
    </div>
  );
}
