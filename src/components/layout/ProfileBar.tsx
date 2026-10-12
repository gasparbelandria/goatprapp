"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { usePathname } from "next/navigation";

/**
 * Mobile-only sticky top bar for inner authenticated pages (profile, post detail).
 * On md+ the Sidebar handles navigation — this is hidden via md:hidden.
 */
export function ProfileBar({
  backHref,
  title,
  right,
}: {
  backHref: string;
  title: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="md:hidden sticky top-0 z-40 bg-background border-b border-border">
      <div className="relative flex items-center justify-between px-4 h-12">
        <Link
          href={backHref}
          className="flex items-center gap-0.5 text-muted hover:text-foreground transition-colors -ml-1 p-1 cursor-pointer"
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </Link>

        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          {title}
        </div>

        <div className="flex items-center justify-end min-w-8">
          {right ?? null}
        </div>
      </div>
    </div>
  );
}

/**
 * Full-width sticky header for public (unauthenticated) profile views.
 */
export function PublicProfileBar() {
  const pathname = usePathname();
  const loginHref = `/login?redirect=${encodeURIComponent(pathname)}`;

  return (
    <header className="sticky top-0 z-40 bg-background border-b border-border px-4 h-14 flex items-center justify-between">
      <Link href="/" className="inline-flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-goat.png" alt="GOATPR" width={30} height={30} className="rounded-lg" />
        <span className="font-black text-sm text-foreground tracking-wide">GOATPR</span>
      </Link>
      <Link
        href={loginHref}
        className="px-4 py-1.5 bg-brand text-background rounded-lg font-black text-xs hover:bg-brand-light transition-colors"
      >
        Sign in
      </Link>
    </header>
  );
}
