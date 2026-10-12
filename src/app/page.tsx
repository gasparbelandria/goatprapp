"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { TrendingUp, Lock, Zap, Trophy, Medal } from "lucide-react";
import { useI18n } from "@/hooks/useI18n";
import { LangToggle } from "@/components/ui/LangToggle";
import { AuraCTALink } from "@/components/ui/AuraCTALink";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

const MONO  = { fontFamily: "'JetBrains Mono', monospace" } as const;
const SCORE = { fontFamily: "Arcade, monospace" } as const;

// Semantic tokens — reference CSS variables so both themes work
const BG   = "var(--color-background)";
const SURF = "var(--color-surface)";
const ELEV = "var(--color-elevated)";
const BDR  = "var(--color-border)";
const FG   = "var(--color-foreground)";
const MUT  = "var(--color-muted)";
// Monochrome — no brand colors, only foreground/muted/surface
const ACC = "var(--color-foreground)";  // primary accent = foreground
const POS = "var(--color-foreground)";  // positive delta
const NEG = "var(--color-muted)";       // negative delta
// Highlighted row: subtle background tint
const ROW_HIGHLIGHT = "rgba(0,0,0,0.06)";

const BOARD = [
  { rank: "#1",  medal: true,  medalSize: 22, handle: "@mvinson", badge: "315 LBS", pr: "315 lbs", move: "▲ 1", moveColor: POS, rowBg: "transparent",  initial: "M", avatarBg: FG,       avatarFg: "var(--color-surface)" },
  { rank: "#2",  medal: true,  medalSize: 17, handle: "@treyvon", badge: "295 LBS", pr: "295 lbs", move: "▼ 1", moveColor: NEG, rowBg: "transparent",  initial: "T", avatarBg: "#5A5A5A", avatarFg: "#FFFFFF" },
  { rank: "#3",  medal: true,  medalSize: 13, handle: "@niko",    badge: "285 LBS", pr: "285 lbs", move: "▲ 3", moveColor: POS, rowBg: "transparent",  initial: "N", avatarBg: "#3A3A3A", avatarFg: "#FFFFFF" },
  { rank: "#4",  medal: false, medalSize: 0,  handle: "@jcross",  badge: "275 LBS", pr: "275 lbs", move: "— 0", moveColor: MUT, rowBg: "transparent",  initial: "J", avatarBg: "#888888", avatarFg: "#FFFFFF" },
  { rank: "#5",  medal: false, medalSize: 0,  handle: "@rell",    badge: "265 LBS", pr: "265 lbs", move: "▲ 7", moveColor: POS, rowBg: "transparent",  initial: "R", avatarBg: "#777777", avatarFg: "#FFFFFF" },
  { rank: "#47", medal: false, medalSize: 0,  handle: "@miggy",   badge: "YOU · TOP 12%", pr: "225 lbs", move: "#47 → #43", moveColor: POS, rowBg: ROW_HIGHLIGHT, initial: "M", avatarBg: FG, avatarFg: "var(--color-surface)" },
];

const TABS = ["SCHOOL", "STATE", "FRIENDS"] as const;
type Tab = (typeof TABS)[number];

export default function LandingPage() {
  const { t } = useI18n();
  const { user, loading: authLoading } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<Tab>("SCHOOL");

  const STEPS = [
    { n: "01", color: FG,  title: t("landing.step1Title"), body: t("landing.step1Body") },
    { n: "02", color: FG,  title: t("landing.step2Title"), body: t("landing.step2Body") },
    { n: "03", color: FG,  title: t("landing.step3Title"), body: t("landing.step3Body") },
  ];

  const WHY = [
    { tag: t("landing.whyShareTag"),   title: t("landing.whyShareTitle"),   body: t("landing.whyShareBody") },
    { tag: t("landing.whyRatedTag"),   title: t("landing.whyRatedTitle"),   body: t("landing.whyRatedBody") },
    { tag: t("landing.whyAuraTag"),    title: t("landing.whyAuraTitle"),    body: t("landing.whyAuraBody") },
    { tag: t("landing.whyCompeteTag"), title: t("landing.whyCompeteTitle"), body: t("landing.whyCompeteBody") },
  ];

  const FAQ = [
    { q: t("landing.faqQ1"), a: t("landing.faqA1"), Icon: TrendingUp },
    { q: t("landing.faqQ2"), a: t("landing.faqA2"), Icon: Lock },
    { q: t("landing.faqQ3"), a: t("landing.faqA3"), Icon: Zap },
    { q: t("landing.faqQ4"), a: t("landing.faqA4"), Icon: Trophy },
  ];

  const TAB_KEYS: Record<Tab, string> = {
    SCHOOL:  "landing.tabGlobal",
    STATE:   "landing.tabWeekly",
    FRIENDS: "landing.tabFriends",
  };

  return (
    <div style={{ background: BG, color: FG, overflowX: "hidden" }}>

      {/* NAV */}
      <div className="glass-nav" style={{ position: "sticky", top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ alignSelf: "stretch", display: "flex", alignItems: "center" }}>
            <Link href="/" style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "flex-start", justifyContent: "center", height: "100%", background: "#000", borderRadius: 10, padding: "5px 10px", gap: 1 }}>
              <Image
                src="/logo-goat.png"
                alt="GOATPR"
                width={80}
                height={34}
                style={{ display: "block", objectFit: "contain" }}
                priority
                unoptimized
              />
              <span style={{ ...SCORE, fontSize: 9, height: 5, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", lineHeight: 1 }}>BETA</span>
            </Link>
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
            <ThemeToggle />
            <LangToggle />
            {!authLoading && (
              <AuraCTALink href={user ? "/feed" : "/login"} fontSize={14} padding="11px 18px" borderRadius={11}>
                {user ? t("nav.openApp") : t("landing.getAuraRank")}
              </AuraCTALink>
            )}
          </div>
        </div>
      </div>

      {/* HERO */}
      <div style={{ position: "relative", overflow: "hidden", background: BG }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "84px 24px 90px" }} className="hero-grid">
          <div className="hero-text">
            {/* Live pill */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${BDR}`, background: SURF, padding: "7px 12px", borderRadius: 999, ...MONO, fontSize: 10, letterSpacing: "0.14em", color: FG, marginBottom: 26 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: FG, display: "inline-block", flexShrink: 0 }} />
              <span>{t("landing.ratingsLive")}</span>
            </div>

            <h1 style={{ margin: 0, fontWeight: 800, fontSize: 84, lineHeight: 0.92, letterSpacing: "-0.045em" }}>
              {t("landing.heroTitle").split("\n").map((line, i) => (
                <span key={i}>
                  {i > 0 && <br />}
                  {i === 0 ? line : (
                    <span style={{ color: ACC }}>
                      {line}
                    </span>
                  )}
                </span>
              ))}
            </h1>

            <p style={{ margin: "22px 0 0", fontSize: 20, lineHeight: 1.5, color: MUT, maxWidth: 480 }}>
              {t("landing.heroSubtitle")}
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginTop: 34 }}>
              <AuraCTALink href="/login" fontSize={17} padding="18px 30px" borderRadius={15}>
                {t("landing.getAuraRank")}
              </AuraCTALink>
              <Link href="/rankings" style={{ border: `1px solid ${BDR}`, background: ELEV, color: FG, fontWeight: 700, fontSize: 17, padding: "18px 26px", borderRadius: 15, display: "inline-block", textDecoration: "none" }}>
                {t("landing.exploreRankings")}
              </Link>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 26, ...MONO, fontSize: 11, color: MUT, letterSpacing: "0.08em" }}>
              <span>{t("landing.profileUrl")}</span>
              <span style={{ color: BDR }}>|</span>
              <span>{t("landing.noFollowers")}</span>
            </div>
          </div>

          {/* HERO CARD */}
          <div className="hero-card" style={{ animation: "floaty 7s ease-in-out infinite" }}>
            <div style={{ borderRadius: 26, border: `1px solid ${BDR}`, background: SURF, padding: 24, boxShadow: "0 8px 40px rgba(0,0,0,0.15), 0 1px 0 rgba(255,255,255,0.08) inset" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 58, height: 58, borderRadius: "50%", background: FG, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 24, color: "var(--color-surface)", flexShrink: 0 }}>M</div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 20, letterSpacing: "-0.02em" }}>@miggy</div>
                  <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.14em", color: MUT }}>LIONS HIGH SCHOOL</div>
                </div>
                <div style={{ marginLeft: "auto", ...MONO, fontSize: 10, letterSpacing: "0.12em", border: `1px solid ${BDR}`, padding: "6px 10px", borderRadius: 6, fontWeight: 700, color: MUT }}>TOP 12%</div>
              </div>

              <div style={{ marginTop: 24, padding: "16px 0 8px", borderTop: `1px solid ${BDR}` }}>
                <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.2em", color: MUT, marginBottom: 6 }}>BENCH PRESS · PERSONAL RECORD</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ ...SCORE, fontSize: 88, lineHeight: 0.85, fontVariantNumeric: "tabular-nums", color: ACC }}>225</span>
                  <span style={{ ...SCORE, fontSize: 62, lineHeight: 0.85, color: MUT, marginTop: 5 }}>LBS</span>
                </div>
                <div style={{ fontWeight: 800, fontSize: 12, color: POS, marginTop: 6 }}>+12 LBS PR ↑</div>
              </div>

              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", color: MUT, border: `1px solid ${BDR}`, padding: "6px 10px", borderRadius: 7 }}>🏫 #3 AT SCHOOL</span>
                <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", color: MUT, border: `1px solid ${BDR}`, padding: "6px 10px", borderRadius: 7 }}>#47 MASSACHUSETTS</span>
              </div>

              <div style={{ marginTop: 18, borderRadius: 14, border: `1px solid ${BDR}`, background: BG, padding: "14px 16px" }}>
                <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.16em", color: MUT, marginBottom: 10 }}>ATTEMPT HISTORY</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 40 }}>
                  {[165, 185, 195, 205, 215, 225].map((w, i) => (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                      <div style={{ width: "100%", background: i === 5 ? FG : i === 4 ? MUT : BDR, borderRadius: 3, height: `${(w / 225) * 32}px` }} />
                      <span style={{ ...SCORE, fontSize: 9, color: i === 5 ? FG : MUT }}>{w}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div style={{ borderTop: `1px solid ${BDR}`, background: BG }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "76px 24px" }}>
          <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.2em", color: MUT, marginBottom: 14 }}>{t("landing.howTag")}</div>
          <h2 className="landing-h2" style={{ margin: "0 0 40px", fontWeight: 800, fontSize: 44, letterSpacing: "-0.035em" }}>{t("landing.howTitle")}</h2>
          <div className="landing-steps" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            {STEPS.map((s) => (
              <div key={s.n} style={{ border: `1px solid ${BDR}`, background: SURF, borderRadius: 20, padding: 26 }}>
                <div style={{ ...SCORE, fontSize: 54, lineHeight: 1, color: BDR }}>{s.n}</div>
                <div style={{ fontWeight: 800, fontSize: 22, marginTop: 14, letterSpacing: "-0.02em", color: s.color }}>{s.title}</div>
                <div style={{ fontSize: 15, color: MUT, lineHeight: 1.55, marginTop: 8 }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PR TRACKER STRIP */}
      <div style={{ borderTop: `1px solid ${BDR}`, background: BG }}>
        <div className="landing-rating" style={{ maxWidth: 1160, margin: "0 auto", padding: "70px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.2em", color: MUT, marginBottom: 14 }}>{t("landing.ratingTag")}</div>
            <h2 className="landing-h2" style={{ margin: 0, fontWeight: 800, fontSize: 44, letterSpacing: "-0.035em", lineHeight: 1.05 }}>{t("landing.ratingTitle")}</h2>
            <p style={{ fontSize: 17, color: MUT, lineHeight: 1.6, maxWidth: 440, margin: "18px 0 0" }}>
              {t("landing.ratingBody")}
            </p>
          </div>
          <div style={{ border: `1px solid ${BDR}`, borderRadius: 22, background: SURF, padding: 30 }}>
            <div style={{ fontWeight: 800, fontSize: 26, letterSpacing: "-0.02em" }}>{t("landing.howMuchAura")}</div>
            <div style={{ textAlign: "center", padding: "10px 0 4px" }}>
              <span style={{ ...SCORE, fontSize: 110, lineHeight: 1, fontVariantNumeric: "tabular-nums", color: ACC }}>225</span>
            </div>
            <div style={{ position: "relative", height: 26, marginBottom: 6 }}>
              <div style={{ position: "absolute", top: 10, left: 0, right: 0, height: 6, borderRadius: 999, background: BDR }} />
              <div style={{ position: "absolute", top: 10, left: 0, width: "71%", height: 6, borderRadius: 999, background: FG }} />
              <div style={{ position: "absolute", top: 1, left: "71%", width: 24, height: 24, marginLeft: -12, borderRadius: "50%", background: FG, boxShadow: `0 0 0 4px rgba(0,0,0,0.12)` }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", ...MONO, fontSize: 10, letterSpacing: "0.1em", color: MUT, paddingBottom: 20 }}>
              <span>{t("landing.sliderMin")}</span>
              <span>{t("landing.sliderMax")}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ flex: 1, textAlign: "center", fontWeight: 800, fontSize: 15, letterSpacing: "0.1em", color: "var(--color-surface)", background: FG, padding: "16px 0", borderRadius: 14, border: `1px solid ${FG}` }}>{t("landing.rateBtn")}</div>
              <div style={{ fontWeight: 800, fontSize: 26, color: POS, letterSpacing: "-0.02em" }}>+12</div>
            </div>
          </div>
        </div>
      </div>

      {/* RANKINGS */}
      <div id="rankings" style={{ borderTop: `1px solid ${BDR}` }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "76px 24px" }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 20, flexWrap: "wrap", marginBottom: 16 }}>
            <div>
              <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.2em", color: MUT, marginBottom: 14 }}>{t("landing.rankingsTag")}</div>
              <h2 className="landing-h2" style={{ margin: 0, fontWeight: 800, fontSize: 44, letterSpacing: "-0.035em" }}>{t("landing.rankingsTitle")}</h2>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    fontWeight: 700, fontSize: 12, letterSpacing: "0.08em",
                    color: activeTab === tab ? FG : MUT,
                    background: activeTab === tab ? ELEV : "transparent",
                    border: activeTab === tab ? `1px solid ${FG}` : `1px solid ${BDR}`,
                    padding: "9px 16px", borderRadius: 10, cursor: "pointer",
                  }}
                >
                  {t(TAB_KEYS[tab])}
                </button>
              ))}
            </div>
          </div>
          <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.14em", color: MUT, marginBottom: 18 }}>BENCH PRESS · LIONS HIGH SCHOOL</div>
          <div style={{ border: `1px solid ${BDR}`, borderRadius: 20, overflow: "hidden", background: SURF }}>
            {BOARD.map((r, i) => (
              <div key={r.handle} className="landing-rank-row" style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 22px", borderTop: i === 0 ? "none" : `1px solid ${BDR}`, background: r.rowBg }}>
                <span style={{ ...MONO, fontSize: 13, color: MUT, width: 62, flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {r.medal && <Medal size={r.medalSize} strokeWidth={1.5} />}
                  {r.rank}
                </span>
                <div style={{ width: 34, height: 34, borderRadius: "50%", background: r.avatarBg, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 13, color: r.avatarFg, flexShrink: 0 }}>{r.initial}</div>
                <span style={{ fontWeight: 700, fontSize: 15 }}>{r.handle}</span>
                <span className="landing-rank-badge" style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", color: MUT }}>{r.badge}</span>
                <span style={{ ...SCORE, marginLeft: "auto", fontSize: 22 }}>{r.pr}</span>
                <span className="landing-rank-move" style={{ ...MONO, fontSize: 11, width: 88, textAlign: "right", color: r.moveColor, flexShrink: 0 }}>{r.move}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* WHY */}
      <div style={{ borderTop: `1px solid ${BDR}` }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "76px 24px" }}>
          <div className="landing-why" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
            {WHY.map((w) => (
              <div key={w.tag} style={{ border: `1px solid ${BDR}`, background: SURF, borderRadius: 18, padding: 24 }}>
                <div style={{ ...MONO, fontSize: 10, letterSpacing: "0.16em", color: MUT, marginBottom: 16 }}>{w.tag}</div>
                <div style={{ fontWeight: 800, fontSize: 19, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{w.title}</div>
                <div style={{ fontSize: 14, color: MUT, lineHeight: 1.55, marginTop: 8 }}>{w.body}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SHARE CARD */}
      <div style={{ borderTop: `1px solid ${BDR}`, background: BG }}>
        <div className="landing-share" style={{ maxWidth: 1160, margin: "0 auto", padding: "76px 24px", display: "grid", gridTemplateColumns: "1fr 420px", gap: 56, alignItems: "center" }}>
          <div>
            <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.2em", color: MUT, marginBottom: 14 }}>{t("landing.shareTag")}</div>
            <h2 className="landing-h2" style={{ margin: 0, fontWeight: 800, fontSize: 44, letterSpacing: "-0.035em", lineHeight: 1.05 }}>{t("landing.shareTitle")}</h2>
            <p style={{ fontSize: 17, color: MUT, lineHeight: 1.6, maxWidth: 460, margin: "18px 0 0" }}>
              {t("landing.shareBody")}
            </p>
          </div>
          <div style={{ borderRadius: 22, overflow: "hidden", border: `1px solid ${BDR}`, background: SURF }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px" }}>
              <span style={{ ...MONO, fontSize: 11, letterSpacing: "0.2em", color: MUT }}>GOATPR.APP</span>
              <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.12em", color: MUT, border: `1px solid ${BDR}`, padding: "5px 9px", borderRadius: 6 }}>TOP 12%</span>
            </div>
            <div style={{ margin: "0 18px", borderRadius: 14, border: `1px solid ${BDR}`, background: SURF, padding: "24px 20px" }}>
              <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.18em", color: MUT, marginBottom: 8 }}>BENCH PRESS · PERSONAL RECORD</div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                <span style={{ ...SCORE, fontSize: 78, lineHeight: 0.88, fontVariantNumeric: "tabular-nums", color: ACC }}>225</span>
                <div style={{ paddingBottom: 6 }}>
                  <div style={{ fontWeight: 800, fontSize: 14 }}>LBS</div>
                  <div style={{ ...MONO, fontSize: 9, letterSpacing: "0.14em", color: POS }}>+12 TODAY</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <span style={{ ...MONO, fontSize: 9, color: MUT, border: `1px solid ${BDR}`, padding: "5px 8px", borderRadius: 6 }}>🦁 #3 LIONS HS</span>
                <span style={{ ...MONO, fontSize: 9, color: MUT, border: `1px solid ${BDR}`, padding: "5px 8px", borderRadius: 6 }}>#47 MA</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: 18 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>@miggy</div>
              <div style={{ fontWeight: 700, fontSize: 13, color: MUT }}>{t("landing.rateMyAura")}</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ borderTop: `1px solid ${BDR}` }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "96px 24px", textAlign: "center" }}>
          <h2 className="landing-cta-title" style={{ margin: 0, fontWeight: 800, fontSize: 68, letterSpacing: "-0.045em", lineHeight: 0.98 }}>
            {t("landing.ctaTitle").split("PR").map((part, i, arr) => (
              i < arr.length - 1 ? (
                <span key={i}>
                  {part}
                  <span style={{ color: ACC }}>PR</span>
                </span>
              ) : part
            ))}
          </h2>
          <p style={{ fontSize: 18, color: MUT, margin: "20px 0 30px" }}>
            {t("landing.ctaSubtitle")}
          </p>
          <AuraCTALink href="/login" fontSize={18} padding="20px 36px" borderRadius={16}>
            {t("landing.ctaBtn")}
          </AuraCTALink>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ borderTop: `1px solid ${BDR}` }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "70px 24px" }}>
          <div style={{ ...MONO, fontSize: 11, letterSpacing: "0.2em", color: MUT, marginBottom: 28 }}>{t("landing.faqTag")}</div>
          <div className="landing-faq" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {FAQ.map((f) => (
              <div key={f.q} style={{ border: `1px solid ${BDR}`, background: SURF, borderRadius: 16, padding: "20px 22px" }}>
                <f.Icon size={22} style={{ color: ACC, marginBottom: 14 }} />
                <div style={{ fontWeight: 800, fontSize: 16 }}>{f.q}</div>
                <div style={{ fontSize: 14, color: MUT, lineHeight: 1.55, marginTop: 7 }}>{f.a}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div style={{ borderTop: `1px solid ${BDR}`, background: BG }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "34px 24px", display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
          <Image src="/logo-goat.png" alt="GOATPR" width={30} height={30} style={{ borderRadius: 6 }} unoptimized />
          <span style={{ ...MONO, fontSize: 10, letterSpacing: "0.14em", color: BDR }}>{t("landing.footerTagline")}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 20, fontSize: 13 }}>
            <Link href="/terms"   style={{ color: MUT, textDecoration: "none" }}>{t("landing.footerTerms")}</Link>
            <Link href="/privacy" style={{ color: MUT, textDecoration: "none" }}>{t("landing.footerPrivacy")}</Link>
          </div>
        </div>
      </div>

    </div>
  );
}
