"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Bell, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { useI18n } from "@/hooks/useI18n";
import { useNotifications } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/time-ago";
import type { AppNotification } from "@/lib/types";

// ── Payload types ─────────────────────────────────────────────────────────────

interface GroupInvitePayload {
  group_name: string;
  group_slug: string;
  inviter_display_name: string;
  invite_id?: string;
}

interface RatingPayload {
  score: number;
  rater_username: string | null;
  rater_display_name: string;
  rater_city: string | null;
  rater_country_name: string | null;
  post_id: string;
  post_media_url: string;
  post_thumbnail_url: string | null;
  post_media_type: string | null;
  post_author_username: string;
}

function resolvePostThumbnail(payload: RatingPayload): string {
  if (payload.post_thumbnail_url) return payload.post_thumbnail_url;
  const ytMatch = payload.post_media_url?.match(/youtube\.com\/embed\/([^?/]+)/);
  if (ytMatch) return `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`;
  return payload.post_media_url;
}

interface FollowPayload {
  follower_username: string | null;
  follower_display_name: string;
  follower_city: string | null;
  follower_country_name: string | null;
  follower_avatar_url: string | null;
}

// ── Group invite ──────────────────────────────────────────────────────────────

function GroupInviteItem({
  notification,
  onResolved,
}: {
  notification: AppNotification;
  onResolved: () => void;
}) {
  const { t } = useI18n();
  const payload = notification.payload as unknown as GroupInvitePayload;
  const [status, setStatus] = useState<"idle" | "loading" | "accepted" | "declined">("idle");

  const resolve = async (action: "accept" | "reject") => {
    setStatus("loading");
    const res = await fetch(`/api/invites/${payload.invite_id ?? notification.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    }).catch(() => null);

    if (res?.ok) {
      setStatus(action === "accept" ? "accepted" : "declined");
      setTimeout(onResolved, 1200);
    } else {
      setStatus("idle");
    }
  };

  const msg = t("notifications.groupInviteMsg")
    .replace("{inviter}", payload.inviter_display_name ?? "Someone")
    .replace("{group}", payload.group_name ?? "a group");

  return (
    <div className={cn(
      "p-3 rounded-lg border border-border bg-elevated text-xs",
      !notification.read && "border-l-2 border-l-brand",
      notification.read && "opacity-60"
    )}>
      <p className="font-bold text-foreground mb-2 leading-snug">{msg}</p>
      {status === "accepted" && <p className="text-acid font-black">{t("notifications.accepted")}</p>}
      {status === "declined" && <p className="text-muted font-black">{t("notifications.declined")}</p>}
      {(status === "idle" || status === "loading") && (
        <div className="flex gap-2">
          <button
            onClick={() => resolve("accept")}
            disabled={status === "loading"}
            className="px-3 py-1.5 bg-brand text-white font-black rounded-md hover:bg-brand-light transition-colors disabled:opacity-50 cursor-pointer"
          >
            {t("notifications.acceptBtn")}
          </button>
          <button
            onClick={() => resolve("reject")}
            disabled={status === "loading"}
            className="px-3 py-1.5 bg-elevated border border-border text-muted font-black rounded-md hover:text-foreground transition-colors disabled:opacity-50 cursor-pointer"
          >
            {t("notifications.declineBtn")}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Rating notification ───────────────────────────────────────────────────────

function RatingNotificationItem({ notification }: { notification: AppNotification }) {
  const { t, locale } = useI18n();
  const payload = notification.payload as unknown as RatingPayload;

  const location = [payload.rater_city, payload.rater_country_name]
    .filter(Boolean)
    .join(", ");

  const postHref = `/@${payload.post_author_username}/post/${payload.post_id}`;

  const raterHref = payload.rater_username ? `/@${payload.rater_username}` : postHref;

  return (
    <Link href={raterHref} className={cn(
      "rounded-lg border border-border bg-elevated overflow-hidden flex items-stretch gap-0",
      !notification.read && "border-l-2 border-l-brand",
      notification.read && "opacity-70"
    )}>
      {/* Post thumbnail */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={resolvePostThumbnail(payload)}
        alt=""
        className="w-16 flex-shrink-0 object-cover"
        style={{ minHeight: "72px" }}
      />

      {/* Content */}
      <div className="flex-1 min-w-0 px-3 py-2.5">
        <p className="text-xs text-muted leading-snug">
          <span className="font-black text-brand-light">
            {payload.rater_username ? `@${payload.rater_username}` : payload.rater_display_name}
          </span>{" "}
          {t("notifications.ratingRated")}
        </p>

        <p
          className="text-xl font-black leading-tight mt-0.5 tabular-nums"
          style={{
            background: `linear-gradient(to right, var(--color-brand), var(--color-acid))`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {t("notifications.ratingAuras", { score: payload.score })}
        </p>

        <p className="text-[10px] text-muted/60 mt-0.5 truncate">
          {location ? `${location} · ` : ""}
          {timeAgo(notification.createdAt, locale)}
        </p>
      </div>
    </Link>
  );
}

// ── Follow notification ───────────────────────────────────────────────────────

function FollowNotificationItem({ notification }: { notification: AppNotification }) {
  const { t, locale } = useI18n();
  const payload = notification.payload as unknown as FollowPayload;
  const profileHref = payload.follower_username ? `/@${payload.follower_username}` : null;
  const location = [payload.follower_city, payload.follower_country_name].filter(Boolean).join(", ");

  const cls = cn(
    "flex items-center gap-3 p-3 rounded-lg border border-border bg-elevated",
    !notification.read && "border-l-2 border-l-brand",
    notification.read && "opacity-70"
  );

  const content = (
    <>
      <div className="flex-shrink-0">
        {payload.follower_avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={payload.follower_avatar_url} alt="" className="size-10 rounded-full object-cover ring-2 ring-brand/30" />
        ) : (
          <div className="size-10 rounded-full bg-brand/20 flex items-center justify-center text-sm font-black text-brand">
            {payload.follower_display_name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted leading-snug">
          <span className="font-black text-brand-light">
            {payload.follower_username ? `@${payload.follower_username}` : payload.follower_display_name}
          </span>{" "}{t("notifications.followedYou")}
        </p>
        <p className="text-[10px] text-muted/60 mt-0.5 truncate">
          {location ? `${location} · ` : ""}
          {timeAgo(notification.createdAt, locale)}
        </p>
      </div>
    </>
  );

  return profileHref
    ? <Link href={profileHref} className={cls}>{content}</Link>
    : <div className={cls}>{content}</div>;
}

// ── Generic fallback ──────────────────────────────────────────────────────────

function NotificationItem({ notification, onResolved }: { notification: AppNotification; onResolved: () => void }) {
  if (notification.type === "group_invite") {
    return <GroupInviteItem notification={notification} onResolved={onResolved} />;
  }
  if (notification.type === "rating") {
    return <RatingNotificationItem notification={notification} />;
  }
  if (notification.type === "follow") {
    return <FollowNotificationItem notification={notification} />;
  }
  return (
    <div className={cn("p-3 rounded-lg border border-border text-xs text-muted", notification.read && "opacity-60")}>
      {notification.type}
    </div>
  );
}

// ── Bell button + panel ───────────────────────────────────────────────────────

export function NotificationBell({ large = false, align = "left" }: { large?: boolean; align?: "left" | "right" }) {
  const { t } = useI18n();
  const { notifications, unreadCount, markAllRead, refresh } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next && unreadCount > 0) markAllRead();
        }}
        className={cn(
          "relative flex items-center justify-center rounded-lg text-muted hover:text-foreground transition-colors cursor-pointer",
          large ? "p-1 hover:bg-elevated" : "size-8 hover:bg-elevated"
        )}
        aria-label={t("notifications.title")}
      >
        <Bell size={large ? 22 : 16} strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className={cn(
            "absolute rounded-full bg-brand text-surface font-black flex items-center justify-center",
            large
              ? "-top-1 -right-1 size-5 text-[10px]"
              : "-top-0.5 -right-0.5 size-4 text-[9px]"
          )}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute ${align === "right" ? "right-0" : "left-0"} top-10 w-80 bg-surface border border-border rounded-xl shadow-xl z-50 overflow-hidden`}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-black uppercase tracking-widest text-foreground">
              {t("notifications.title")}
            </span>
            <button onClick={() => setOpen(false)} className="text-muted hover:text-foreground cursor-pointer">
              <X size={14} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto p-3 space-y-2">
            {notifications.length === 0 ? (
              <p className="text-xs text-muted text-center py-6">{t("notifications.empty")}</p>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onResolved={() => { setOpen(false); refresh(); }}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
