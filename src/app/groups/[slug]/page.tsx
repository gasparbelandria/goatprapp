"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

export default function GroupDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  void use(params);

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      <Sidebar />
      <main className="flex-1 md:ml-60 flex flex-col">
        <div className="max-w-2xl mx-auto w-full px-4 py-8">
          <Link
            href="/groups"
            className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft size={16} /> Groups
          </Link>
          <p className="text-sm text-muted">This group no longer exists.</p>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
