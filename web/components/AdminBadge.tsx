"use client";

type Props = {
  className?: string;
  /** show "ADMIN" label beside the icon */
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-6 w-6",
  md: "h-8 w-8",
  lg: "h-12 w-12",
};

/** Pixel admin badge — chunky white cock icon. */
export function AdminBadge({
  className = "",
  showLabel = true,
  size = "md",
}: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      title="Admin"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/graphics/admin-badge-cock-64.png"
        alt="Admin"
        className={`${sizes[size]} border-2 border-cove-accent bg-cove-ink`}
        style={{ imageRendering: "pixelated" }}
      />
      {showLabel ? (
        <span className="cove-label text-cove-accent">Admin</span>
      ) : null}
    </span>
  );
}

export default AdminBadge;
