import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  children: ReactNode;
  loading?: boolean;
};

const variants: Record<Variant, string> = {
  primary:
    "bg-cove-accent text-cove-ink hover:bg-cove-accent-hover focus-visible:ring-cove-accent cove-btn-outset",
  secondary:
    "bg-cove-surface-elevated text-cove-mist border-2 border-cove-border hover:border-cove-mist-dim focus-visible:ring-cove-mist/40 cove-btn-outset",
  ghost:
    "bg-transparent text-cove-mist-dim hover:text-cove-mist hover:bg-cove-surface border-2 border-transparent focus-visible:ring-cove-mist/25",
  danger:
    "bg-transparent text-red-400 border-2 border-red-500/40 hover:bg-red-950/40 focus-visible:ring-red-400/35",
};

export function Button({
  variant = "primary",
  children,
  className = "",
  loading,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-none px-4 py-2.5 text-sm font-normal uppercase tracking-wider transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-cove-ink disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? "Please wait…" : children}
    </button>
  );
}
