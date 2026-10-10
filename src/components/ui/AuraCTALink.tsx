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
        background: "#B8F34A",
        color: "#0B1020",
        fontWeight: 800,
        fontSize,
        padding,
        borderRadius,
        textDecoration: "none",
        whiteSpace: "nowrap",
        boxShadow: "0 4px 24px rgba(184,243,74,0.3)",
      }}
    >
      {children}
    </Link>
  );
}
