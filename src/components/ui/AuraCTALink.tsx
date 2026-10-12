"use client";

import Link from "next/link";

interface AuraCTALinkProps {
  href: string;
  children: React.ReactNode;
  fontSize?: number;
  padding?: string;
  borderRadius?: number;
}

export function AuraCTALink({
  href,
  children,
  fontSize = 14,
  padding = "11px 18px",
  borderRadius = 11,
}: AuraCTALinkProps) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        background: "var(--color-foreground)",
        color: "var(--color-surface)",
        fontWeight: 800,
        fontSize,
        padding,
        borderRadius,
        border: "1px solid var(--color-foreground)",
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Link>
  );
}
