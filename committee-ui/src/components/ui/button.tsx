import { cn } from "../../lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "outline" | "ghost" | "secondary";

const variants: Record<Variant, string> = {
  primary:
    "bg-brand-600 text-white hover:bg-brand-700 focus-visible:outline-brand-600",
  secondary:
    "bg-brand-100 text-brand-700 hover:bg-brand-50 focus-visible:outline-brand-600",
  outline:
    "border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 focus-visible:outline-zinc-400 dark:bg-zinc-100 dark:border-zinc-300",
  ghost: "text-zinc-600 hover:bg-zinc-100 focus-visible:outline-zinc-400",
};

export function Button({
  className,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium",
        "transition-colors focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
