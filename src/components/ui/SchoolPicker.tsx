"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Check, Loader2, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/cn";
import type { School } from "@/lib/types";

interface SchoolPickerProps {
  selected: School | null;
  onSelect: (school: School | null) => void;
  autoFocus?: boolean;
}

export function SchoolPicker({ selected, onSelect, autoFocus = false }: SchoolPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (query.length < 2) { setResults([]); return; }
      setLoading(true);
      fetch(`/api/schools?q=${encodeURIComponent(query)}`)
        .then((r) => r.ok ? r.json() : null)
        .then((data) => setResults(data?.schools ?? []))
        .finally(() => setLoading(false));
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Pre-load on mount (show nearby schools before typing)
  useEffect(() => {
    if (selected) return;
    fetch("/api/schools?q=")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setResults(data?.schools ?? []));
  }, [selected]);

  return (
    <div className="space-y-3">
      {/* Selected school */}
      {selected && (
        <div className="flex items-center gap-3 bg-brand/10 border border-brand/30 rounded-xl px-4 py-3">
          <Check size={15} className="text-brand shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{selected.name}</p>
            {selected.city && (
              <p className="text-xs text-muted">{selected.city}, {selected.state}</p>
            )}
          </div>
          <button
            onClick={() => { onSelect(null); setQuery(""); }}
            className="text-xs font-bold text-muted hover:text-foreground transition-colors cursor-pointer shrink-0 px-2 py-1 rounded-lg hover:bg-elevated"
          >
            Edit
          </button>
        </div>
      )}

      {/* Search input — hidden once selected */}
      {!selected && (
        <>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, city, or ZIP..."
              autoFocus={autoFocus}
              autoComplete="off"
              autoCorrect="off"
              maxLength={100}
              className="w-full bg-elevated border border-border rounded-xl pl-9 pr-4 py-3 text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30 transition-colors"
            />
            {loading && (
              <Loader2 size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted animate-spin" />
            )}
          </div>

          {/* Results list */}
          {results.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="grid grid-cols-[1fr_auto] gap-4 px-4 py-2 bg-surface border-b border-border">
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">School</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted">Location</span>
              </div>
              <div className="max-h-52 overflow-y-auto">
                {results.map((s, i) => (
                  <button
                    key={s.id}
                    onClick={() => onSelect(s)}
                    className={cn(
                      "w-full grid grid-cols-[1fr_auto] gap-4 items-center px-4 py-3 text-left hover:bg-elevated transition-colors cursor-pointer",
                      i > 0 && "border-t border-border"
                    )}
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">{s.name}</span>
                      {s.verifiedStatus === "official" && (
                        <BadgeCheck size={13} className="text-brand shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted whitespace-nowrap">
                      {s.city ? `${s.city}, ${s.state}` : s.state}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.length >= 2 && !loading && results.length === 0 && (
            <p className="text-sm text-muted text-center py-4">No schools found.</p>
          )}
        </>
      )}
    </div>
  );
}
