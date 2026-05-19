import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";

const COMMITTED_STATUSES = new Set(["deposit_taken", "finance_approved", "in_build"]);

const STATUS_LABEL: Record<string, string> = {
  deposit_taken: "Deposit Taken",
  finance_approved: "Finance Approved",
  in_build: "In Build",
};

const STATUS_COLOUR: Record<string, string> = {
  deposit_taken: "bg-lime-600",
  finance_approved: "bg-sky-600",
  in_build: "bg-orange-600",
};

function parseDbDate(val: Date | string | null | undefined): Date | null {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val as string);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(val: Date | string | null | undefined): string {
  const d = parseDbDate(val);
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function daysUntil(val: Date | string | null | undefined): number | null {
  const d = parseDbDate(val);
  if (!d) return null;
  const todayUtc = new Date();
  todayUtc.setUTCHours(0, 0, 0, 0);
  const targetUtc = new Date(d);
  targetUtc.setUTCHours(0, 0, 0, 0);
  return Math.round((targetUtc.getTime() - todayUtc.getTime()) / 86_400_000);
}

// ── Types ────────────────────────────────────────────────────────────────────

interface StageEntry { id: string; initials: string | null; }

interface KioskQuote {
  id: string;
  status: string;
  statusChangedAt: string | null;
  targetCompletionDate: string | null;
  userName: string | null;
  phone: string | null;
  company: string | null;
  vanId: string | null;
  customVanDescription: string | null;
  vanRegistration: string | null;
  kitId: string | null;
  selectedUpgradeIds: string[];
  completedBuildStages: Array<string | { id: string; initials: string }>;
  customBuildStages: Array<{ id: string; label: string }> | null;
}

interface KioskUpgrade { id: string; name: string; category: string; }

interface KioskData {
  quotes: KioskQuote[];
  vans: { id: string; make: string; model: string; year: number | null }[];
  kits: { id: string; name: string }[];
  upgrades: KioskUpgrade[];
}

// ── Stage generation (mirrors server-side logic) ─────────────────────────────

const wrapPat = /wrap|graphics|livery/i;
const wallPat = /interior.wall/i;

function generateStages(kitName: string | null, selectedUpgrades: KioskUpgrade[]) {
  const stages: { id: string; label: string }[] = [];
  stages.push({ id: "prep", label: "Van Preparation" });
  if (kitName) stages.push({ id: "kit", label: `Install ${kitName}` });
  const nonWrap = selectedUpgrades.filter((u) => !wrapPat.test(u.name) && !wrapPat.test(u.category) && !wallPat.test(u.name));
  const wrapOnly = selectedUpgrades.filter((u) => (wrapPat.test(u.name) || wrapPat.test(u.category)) && !wallPat.test(u.name));
  const wallOnly = selectedUpgrades.filter((u) => wallPat.test(u.name) && !wrapPat.test(u.name));
  for (const u of nonWrap) stages.push({ id: `upg_${u.id}`, label: u.name });
  if (wrapOnly.length > 0) {
    stages.push({ id: "artwork_sent", label: "Artwork Sent" });
    stages.push({ id: "artwork_approved", label: "Artwork Approved" });
    stages.push({ id: "wrap_printed", label: "Wrap Printed" });
  }
  for (const u of wrapOnly) stages.push({ id: `upg_${u.id}`, label: u.name });
  if (wallOnly.length > 0) {
    stages.push({ id: "interior_walls_artwork_sent", label: "Interior Walls Artwork Sent" });
    stages.push({ id: "interior_wall_artwork_approved", label: "Interior Wall Artwork Approved" });
    stages.push({ id: "interior_walls_ordered", label: "Interior Walls Ordered" });
  }
  for (const u of wallOnly) stages.push({ id: `upg_${u.id}`, label: u.name });
  stages.push({ id: "final_checks", label: "Final Checks" });
  stages.push({ id: "valet", label: "Valet & Handover" });
  return stages;
}

function normaliseCompleted(raw: Array<string | { id: string; initials: string }>): StageEntry[] {
  return raw.map((e) => typeof e === "string" ? { id: e, initials: null } : { id: e.id, initials: e.initials ?? null });
}

// ── Clock ────────────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })), 10000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

// ── Job card ─────────────────────────────────────────────────────────────────

function JobCard({ q, van, kit, selectedUpgrades }: {
  q: KioskQuote;
  van: { make: string; model: string; year: number | null } | undefined;
  kit: { name: string } | undefined;
  selectedUpgrades: KioskUpgrade[];
}) {
  const stages = q.customBuildStages ?? generateStages(kit?.name ?? null, selectedUpgrades);
  const completed = normaliseCompleted(q.completedBuildStages);
  const completedIds = new Set(completed.map((c) => c.id));
  const initialsMap = new Map(completed.map((c) => [c.id, c.initials]));
  const doneCount = stages.filter((s) => completedIds.has(s.id)).length;
  const total = stages.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = doneCount === total && total > 0;

  const vanLabel = van ? `${van.year ?? ""} ${van.make} ${van.model}`.trim() : q.customVanDescription || "—";
  const days = daysUntil(q.targetCompletionDate);
  const dueColour = days === null ? "text-zinc-500"
    : days < 0 ? "text-red-400"
    : days === 0 ? "text-orange-400"
    : days <= 2 ? "text-yellow-400"
    : "text-lime-400";

  return (
    <div className={`rounded-xl border p-4 flex flex-col gap-3 ${allDone ? "border-lime-500/50 bg-lime-950/30" : "border-zinc-700 bg-zinc-900"}`}>

      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-lg font-black text-white leading-tight truncate">
            {q.userName || "—"}
          </p>
          {q.company && (
            <p className="text-sm text-zinc-400 leading-tight truncate">{q.company}</p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded text-white ${STATUS_COLOUR[q.status] ?? "bg-zinc-600"}`}>
            {STATUS_LABEL[q.status] ?? q.status}
          </span>
          {q.vanRegistration && (
            <span className="text-sm font-extrabold tracking-widest bg-yellow-400 text-black px-2 py-0.5 rounded font-mono uppercase">
              {q.vanRegistration}
            </span>
          )}
        </div>
      </div>

      {/* Van */}
      <div>
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Van</p>
        <p className="text-sm font-semibold text-white leading-snug">{vanLabel}</p>
      </div>

      {/* Kit */}
      {kit && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Pack</p>
          <p className="text-sm font-semibold text-white leading-snug">{kit.name}</p>
        </div>
      )}

      {/* Upgrades */}
      {selectedUpgrades.length > 0 && (
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Upgrades</p>
          <div className="flex flex-wrap gap-1">
            {selectedUpgrades.map((u) => (
              <span key={u.id} className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-800 border border-zinc-600 text-zinc-200 leading-tight">
                {u.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Build progress */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Build Progress</p>
          <span className="text-[11px] font-bold text-zinc-300 tabular-nums">{doneCount}/{total} — {pct}%</span>
        </div>
        <div className="w-full h-2 bg-zinc-700 rounded-full mb-2">
          <div className={`h-full rounded-full transition-all ${allDone ? "bg-lime-400" : "bg-sky-500"}`} style={{ width: `${pct}%` }} />
        </div>
        <div className="flex flex-wrap gap-1">
          {stages.map((stage) => {
            const done = completedIds.has(stage.id);
            const initials = initialsMap.get(stage.id) ?? null;
            return (
              <span key={stage.id} className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded border leading-tight ${
                done ? "bg-zinc-800/50 border-zinc-700 text-zinc-500 line-through" : "bg-zinc-800 border-zinc-600 text-zinc-200"
              }`}>
                {stage.label}
                {done && initials && (
                  <span className="ml-0.5 text-[8px] font-bold text-zinc-400 no-underline">{initials}</span>
                )}
              </span>
            );
          })}
        </div>
      </div>

      {/* Due date */}
      <div className="flex items-center justify-between pt-1 border-t border-zinc-800">
        <div>
          <p className="text-[10px] uppercase tracking-widest text-zinc-500">Due out</p>
          {q.statusChangedAt && (
            <p className="text-[10px] text-zinc-600">Since {fmtDate(q.statusChangedAt)}</p>
          )}
        </div>
        <div className={`text-right ${dueColour}`}>
          {q.targetCompletionDate ? (
            <>
              <p className="text-sm font-black leading-tight tabular-nums">{fmtDate(q.targetCompletionDate)}</p>
              <p className="text-[10px] font-semibold">
                {days === null ? "" : days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "Due today" : `${days}d left`}
              </p>
            </>
          ) : (
            <p className="text-xs font-semibold opacity-30">No due date</p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Auto-scroll hook ─────────────────────────────────────────────────────────

function useAutoScroll(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;
    let pos = 0;
    let dir = 1;
    let paused = false;
    let pauseTimer: ReturnType<typeof setTimeout>;
    const step = () => {
      if (!paused && el) {
        pos += dir * 0.6;
        const maxScroll = el.scrollHeight - el.clientHeight;
        if (pos >= maxScroll) { pos = maxScroll; dir = -1; paused = true; pauseTimer = setTimeout(() => { paused = false; }, 3000); }
        if (pos <= 0) { pos = 0; dir = 1; paused = true; pauseTimer = setTimeout(() => { paused = false; }, 3000); }
        el.scrollTop = pos;
      }
    };
    const id = setInterval(step, 16);
    return () => { clearInterval(id); clearTimeout(pauseTimer); };
  }, [enabled]);
  return ref;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function KioskPipelineBoard() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const { data, isLoading, isError } = useQuery<KioskData>({
    queryKey: ["/api/kiosk/pipeline", token],
    queryFn: async () => {
      const res = await fetch(`/api/kiosk/pipeline/${token}`);
      if (!res.ok) throw new Error("Invalid token");
      return res.json();
    },
    enabled: !!token,
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    retry: false,
    staleTime: 0,
  });

  const committedQuotes = data?.quotes.filter((q) => COMMITTED_STATUSES.has(q.status)) ?? [];
  const needsScroll = committedQuotes.length > 6;
  const scrollRef = useAutoScroll(needsScroll && !isLoading && !isError);

  if (isLoading) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center text-white gap-4">
        <div className="text-5xl font-black text-red-400">Access Denied</div>
        <p className="text-zinc-400 text-lg">This kiosk link is invalid or has been reset.</p>
        <p className="text-zinc-500 text-sm">Ask an admin to generate a new kiosk URL.</p>
      </div>
    );
  }

  const cols = committedQuotes.length <= 2 ? "grid-cols-1 max-w-3xl mx-auto w-full"
    : committedQuotes.length <= 4 ? "grid-cols-2"
    : "grid-cols-3";

  return (
    <div className="h-screen bg-zinc-950 text-white flex flex-col select-none" style={{ cursor: "none" }}>

      {/* Header bar */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          <h1 className="text-2xl font-black tracking-tight text-white">Workshop Pipeline</h1>
          <span className="text-zinc-500 text-sm">
            {committedQuotes.length} active job{committedQuotes.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-6 text-zinc-400 text-sm">
          <span>Refreshes every 30s</span>
          <span className="text-white font-bold text-lg tabular-nums"><LiveClock /></span>
        </div>
      </div>

      {/* Job cards */}
      {committedQuotes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
          <p className="text-6xl font-black mb-4">—</p>
          <p className="text-2xl font-semibold">Nothing in build right now</p>
          <p className="text-base mt-2">No committed jobs at the moment.</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          style={{ scrollbarWidth: "none" }}
        >
          <div className={`grid ${cols} gap-4 p-4`}>
            {committedQuotes.map((q) => {
              const van = data.vans.find((v) => v.id === q.vanId);
              const kit = data.kits.find((k) => k.id === q.kitId);
              const selectedUpgrades = data.upgrades.filter((u) => (q.selectedUpgradeIds ?? []).includes(u.id));
              return (
                <JobCard
                  key={q.id}
                  q={q}
                  van={van}
                  kit={kit}
                  selectedUpgrades={selectedUpgrades}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
