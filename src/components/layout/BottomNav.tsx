"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Images, PlusCircle, Trophy, User } from "lucide-react";
import { cn } from "@/lib/cn";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useI18n } from "@/hooks/useI18n";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const { t } = useI18n();
  const profileHref = user?.username ? `/@${user.username}` : "/setup";

  const NAV_ITEMS = [
    { href: "/feed",     icon: Home,   label: t("nav.feed") },
    { href: "/my-posts", icon: Images, label: t("nav.myPosts") },
    { href: "/rankings", icon: Trophy, label: t("nav.rankings") },
    { href: profileHref, icon: User,   label: t("nav.profile") },
  ];

  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 md:hidden">
      {/* dark class forces dark CSS variable scope so icons/text use dark-theme colors */}
      <div className="dark flex items-center gap-0.5 px-2 py-2 rounded-full nav-always-dark">
        <ThemeToggle className="size-11 rounded-full" />

        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href ||
            (href !== "/feed" && pathname.startsWith(href.split("?")[0]));
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={cn(
                "flex items-center justify-center size-11 rounded-full transition-colors",
                isActive
                  ? "bg-brand/15 text-brand"
                  : "text-muted hover:text-foreground"
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
            </Link>
          );
        })}

        {/* CTA — create post */}
        <Link
          href="/create"
          aria-label={t("nav.post")}
          className="flex items-center justify-center size-12 rounded-full bg-foreground text-surface ml-1 transition-opacity hover:opacity-80 active:scale-95"
        >
          <PlusCircle size={20} strokeWidth={2} />
        </Link>
      </div>
    </nav>
  );
}
