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
        "inline-flex items-center justify-center font-black uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer border",
        "disabled:cursor-not-allowed disabled:opacity-40",
        {
          "bg-foreground text-surface border-foreground hover:opacity-80 active:scale-95":
            variant === "primary",
          "bg-transparent border-foreground text-foreground hover:bg-foreground hover:text-surface active:scale-95":
            variant === "secondary",
          "bg-transparent border-danger text-danger hover:bg-danger hover:text-surface active:scale-95":
            variant === "danger",
          "border-transparent text-muted hover:text-foreground active:scale-95":
            variant === "ghost",
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
