type AvatarProps = {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-lg",
};

export function Avatar({ initials, size = "md", className = "" }: AvatarProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-none border-2 border-cove-border bg-cove-surface-elevated font-medium text-cove-mist ${sizes[size]} ${className}`}
      aria-hidden
    >
      {initials.slice(0, 2).toUpperCase()}
    </div>
  );
}
