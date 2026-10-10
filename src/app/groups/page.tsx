"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { TopBar } from "@/components/layout/TopBar";

export default function GroupsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-60 flex flex-col">
        <TopBar />
        <div className="max-w-2xl mx-auto w-full px-4 py-16 flex flex-col items-center gap-4 text-center">
          <Users size={40} className="text-muted opacity-30" />
          <h1 className="text-xl font-black uppercase tracking-wide">Groups</h1>
          <p className="text-sm text-muted">
            Group challenges are coming soon. For now, check the{" "}
            <Link href="/rankings" className="text-brand hover:text-brand-light transition-colors font-bold">
              Rankings
            </Link>{" "}
            to see how you stack up at your school.
          </p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
