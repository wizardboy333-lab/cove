import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

const field =
  "w-full rounded-none border-2 border-cove-border bg-cove-ink px-3.5 py-2.5 text-sm text-cove-mist placeholder:text-cove-mist-dim/70 focus:border-cove-accent focus:outline-none focus:ring-1 focus:ring-cove-accent/40 cove-btn-inset";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
};

export function Input({ label, hint, id, className = "", ...rest }: InputProps) {
  const inputId = id || rest.name || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block space-y-1.5">
      <span className="cove-label-muted text-[0.5rem]">{label}</span>
      <input id={inputId} className={`${field} ${className}`} {...rest} />
      {hint ? <span className="block text-xs text-cove-mist-dim">{hint}</span> : null}
    </label>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
};

export function TextArea({
  label,
  hint,
  id,
  className = "",
  ...rest
}: TextAreaProps) {
  const inputId = id || rest.name || label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label className="block space-y-1.5">
      <span className="cove-label-muted text-[0.5rem]">{label}</span>
      <textarea id={inputId} className={`${field} min-h-[120px] resize-y ${className}`} {...rest} />
      {hint ? <span className="block text-xs text-cove-mist-dim">{hint}</span> : null}
    </label>
  );
}
