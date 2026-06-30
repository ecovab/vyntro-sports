import type { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "ghost";
}

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  const base = "rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "bg-white text-black hover:bg-white/90"
      : "border border-white/15 text-white hover:bg-white/10";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
}
