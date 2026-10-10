"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useI18n } from "@/hooks/useI18n";

const CATEGORY_SECTIONS = [
  { key: "help.levelNPC",       emoji: "🏋️", label: "Strength" },
  { key: "help.levelROOKIE",    emoji: "🏃", label: "Track" },
  { key: "help.levelRISING",    emoji: "⬆️", label: "Field" },
  { key: "help.levelFARMER",    emoji: "💪", label: "Bodyweight" },
  { key: "help.levelELITE",     emoji: "📊", label: "Rankings" },
  { key: "help.levelLEGENDARY", emoji: "📝", label: "Logging" },
] as const;

export default function HelpPage() {
  useAuthGuard();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <BottomNav />

      <main className="md:pl-60 min-h-screen pb-24 md:pb-8">
        <TopBar title={t("help.title")} />

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="mb-8 hidden md:block">
            <h1 className="text-3xl font-black uppercase tracking-wide text-foreground">{t("help.title")}</h1>
            <p className="text-sm text-muted mt-1">{t("help.sub")}</p>
          </div>

          <section id="levels" className="scroll-mt-20">
            <h2 className="text-xs font-black uppercase tracking-widest text-muted mb-4">
              {t("help.levelsHeading")}
            </h2>

            <div className="bg-elevated border border-border rounded-2xl p-5 mb-4">
              <p className="text-sm text-foreground leading-relaxed">
                {t("help.auraExplanation")}
              </p>
            </div>

            <div className="space-y-3">
              {CATEGORY_SECTIONS.map(({ key, emoji, label }) => (
                <div
                  key={key}
                  className="bg-elevated border border-border rounded-2xl p-5 flex gap-4 items-start"
                >
                  <span className="text-2xl shrink-0 mt-0.5">{emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-black text-brand uppercase tracking-wider mb-1">{label}</p>
                    <p className="text-sm text-foreground leading-relaxed">{t(key)}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
