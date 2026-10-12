"use client";

import { Dumbbell, Timer, Target, Flame, Trophy, FileText } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { useI18n } from "@/hooks/useI18n";
import type { LucideIcon } from "lucide-react";

const CATEGORY_SECTIONS: { key: string; Icon: LucideIcon; label: string }[] = [
  { key: "help.levelNPC",       Icon: Dumbbell, label: "Strength"   },
  { key: "help.levelROOKIE",    Icon: Timer,    label: "Track"      },
  { key: "help.levelRISING",    Icon: Target,   label: "Field"      },
  { key: "help.levelFARMER",    Icon: Flame,    label: "Bodyweight" },
  { key: "help.levelELITE",     Icon: Trophy,   label: "Rankings"   },
  { key: "help.levelLEGENDARY", Icon: FileText, label: "Logging"    },
];

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
              {CATEGORY_SECTIONS.map(({ key, Icon, label }) => (
                <div
                  key={key}
                  className="bg-elevated border border-border rounded-2xl p-5 flex gap-4 items-start"
                >
                  <Icon size={20} strokeWidth={1.5} className="text-brand shrink-0 mt-0.5" />
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
