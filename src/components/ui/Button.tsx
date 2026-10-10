import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center font-black uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer",
        "disabled:cursor-not-allowed disabled:opacity-100 disabled:bg-elevated disabled:text-muted disabled:shadow-none",
        {
          "bg-brand text-[#0B1020] hover:bg-brand-light active:scale-95 shadow-[0_0_20px_rgba(184,243,74,0.2)] hover:shadow-[0_0_28px_rgba(184,243,74,0.4)]":
            variant === "primary",
          "border border-border text-foreground hover:border-brand/50 hover:text-brand-light active:scale-95":
            variant === "secondary",
          "bg-danger text-white hover:opacity-90 active:scale-95":
            variant === "danger",
          "text-muted hover:text-foreground active:scale-95": variant === "ghost",
          "px-3 py-1.5 text-xs": size === "sm",
          "px-5 py-2.5 text-sm": size === "md",
          "px-8 py-4 text-base": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
