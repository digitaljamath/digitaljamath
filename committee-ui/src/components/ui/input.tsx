import { cn } from "../../lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900",
        "placeholder:text-zinc-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-100",
        "dark:bg-zinc-100 dark:border-zinc-300",
        className,
      )}
      {...props}
    />
  );
}
