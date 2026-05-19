import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { QRCodeSVG } from "qrcode.react";

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

// Slide durations in ms — progress view is quick, full stage list gets longer
const SLIDE_DURATIONS = [
  4000,  // Slide 0: Progress ring + summary
  9000,  // Slide 1: Full stages list (needs reading time)
  5000,  // Slide 2: QR code
];
const TOTAL_CYCLE = SLIDE_DURATIONS.reduce((a, b) => a + b, 0);

// ── Helpers ───────────────────────────────────────────────────────────────────

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
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const tgt = new Date(d);
  tgt.setUTCHours(0, 0, 0, 0);
  return Math.round((tgt.getTime() - now.getTime()) / 86_400_000);
}

// ── Types ─────────────────────────────────────────────────────────────────────

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
  confirmationToken: string | null;
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

// ── Stage generation (same logic as server + workshop page) ───────────────────

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
    stages.push({ id: "interior_walls_artwork_sent", label: "Walls Artwork Sent" });
    stages.push({ id: "interior_wall_artwork_approved", label: "Walls Artwork Approved" });
    stages.push({ id: "interior_walls_ordered", label: "Walls Ordered" });
  }
  for (const u of wallOnly) stages.push({ id: `upg_${u.id}`, label: u.name });
  stages.push({ id: "final_checks", label: "Final Checks" });
  stages.push({ id: "valet", label: "Valet & Handover" });
  return stages;
}

function normaliseCompleted(raw: Array<string | { id: string; initials: string }>) {
  return raw.map((e) =>
    typeof e === "string" ? { id: e, initials: null } : { id: e.id, initials: e.initials ?? null }
  );
}

// ── Clock ─────────────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(() => new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })), 10000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

// ── Progress ring ─────────────────────────────────────────────────────────────

function ProgressRing({ pct, done, total, allDone }: { pct: number; done: number; total: number; allDone: boolean }) {
  const r = 48;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  return (
    <svg width="118" height="118" viewBox="0 0 118 118">
      <circle cx="59" cy="59" r={r} fill="none" stroke="#27272a" strokeWidth="10" />
      <circle
        cx="59" cy="59" r={r} fill="none"
        stroke={allDone ? "#84cc16" : "#38bdf8"}
        strokeWidth="10" strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        strokeDashoffset={0}
        transform="rotate(-90 59 59)"
        style={{ transition: "stroke-dasharray 0.6s ease" }}
      />
      <text x="59" y="55" textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="20" fontWeight="900">{pct}%</text>
      <text x="59" y="73" textAnchor="middle" dominantBaseline="middle" fill="#a1a1aa" fontSize="11">{done}/{total}</text>
    </svg>
  );
}

// ── Slide dots ────────────────────────────────────────────────────────────────

function SlideDots({ slide, total }: { slide: number; total: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className={`rounded-full transition-all duration-300 ${i === slide ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-zinc-600"}`} />
      ))}
    </div>
  );
}

// ── Job card ──────────────────────────────────────────────────────────────────

function JobCard({ q, van, kit, selectedUpgrades, cardIndex }: {
  q: KioskQuote;
  van: { make: string; model: string; year: number | null } | undefined;
  kit: { name: string } | undefined;
  selectedUpgrades: KioskUpgrade[];
  cardIndex: number;
}) {
  // Build the single authoritative stage list — this mirrors exactly what the workshop team sees
  const stages = q.customBuildStages ?? generateStages(kit?.name ?? null, selectedUpgrades);
  const completed = normaliseCompleted(q.completedBuildStages);
  const completedMap = new Map(completed.map((c) => [c.id, c.initials]));

  const doneCount = stages.filter((s) => completedMap.has(s.id)).length;
  const total = stages.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = doneCount === total && total > 0;

  const vanLabel = van
    ? `${van.year ?? ""} ${van.make} ${van.model}`.trim()
    : q.customVanDescription || "—";

  const days = daysUntil(q.targetCompletionDate);
  const dueColour = days === null ? "text-zinc-500"
    : days < 0 ? "text-red-400"
    : days === 0 ? "text-orange-400"
    : days <= 3 ? "text-yellow-400"
    : "text-lime-400";

  // Per-card slide timer, staggered by card index
  const [slide, setSlide] = useState(0);
  const slideRef = useRef(0);
  const workshopUrl = q.confirmationToken
    ? `${window.location.origin}/workshop/${q.confirmationToken}`
    : null;
  const numSlides = workshopUrl ? 3 : 2;

  useEffect(() => {
    const offset = (cardIndex % 6) * (TOTAL_CYCLE / 6);
    let startSlide = 0;
    let acc = 0;
    for (let i = 0; i < numSlides; i++) {
      acc += SLIDE_DURATIONS[i];
      if (offset < acc) { startSlide = i; break; }
    }
    slideRef.current = startSlide;
    setSlide(startSlide);

    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      const next = (slideRef.current + 1) % numSlides;
      slideRef.current = next;
      setSlide(next);
      return SLIDE_DURATIONS[next];
    };
    const schedule = (delay: number) => { timer = setTimeout(() => { schedule(tick()); }, delay); };
    schedule(SLIDE_DURATIONS[startSlide]);
    return () => clearTimeout(timer);
  }, [cardIndex, numSlides]);

  return (
    <div className={`rounded-xl border flex flex-col ${allDone ? "border-lime-500/60" : "border-zinc-700"} bg-zinc-900`}>

      {/* ── Pinned header ─────────────────────────────────────────────── */}
      <div className="p-3 border-b border-zinc-800 space-y-2">
        {/* Name row */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-base font-black text-white leading-tight truncate">{q.userName || "—"}</p>
            {q.company && <p className="text-xs text-zinc-400 truncate">{q.company}</p>}
          </div>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded text-white ${STATUS_COLOUR[q.status] ?? "bg-zinc-600"}`}>
            {STATUS_LABEL[q.status] ?? q.status}
          </span>
        </div>

        {/* Reg + van */}
        <div className="flex items-center gap-2 flex-wrap">
          {q.vanRegistration && (
            <span className="text-xs font-extrabold tracking-widest bg-yellow-400 text-black px-2 py-0.5 rounded font-mono uppercase shrink-0">
              {q.vanRegistration}
            </span>
          )}
          <span className="text-xs text-zinc-400 truncate">{vanLabel}</span>
        </div>

        {/* Kit name */}
        {kit && (
          <p className="text-xs font-semibold text-sky-400 truncate">{kit.name}</p>
        )}

        {/* Progress bar — always visible in header */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] uppercase tracking-widest text-zinc-600">Build progress</span>
            <span className={`text-[10px] font-bold tabular-nums ${allDone ? "text-lime-400" : "text-sky-400"}`}>
              {doneCount}/{total} — {pct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${allDone ? "bg-lime-400" : "bg-sky-500"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Due date */}
        <div className={`flex items-center justify-between text-[10px] ${dueColour}`}>
          <span className="text-zinc-700 uppercase tracking-widest">Due out</span>
          <span className="font-bold tabular-nums">
            {q.targetCompletionDate
              ? `${fmtDate(q.targetCompletionDate)}${days !== null ? ` · ${days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "today" : `${days}d`}` : ""}`
              : "No due date"}
          </span>
        </div>
      </div>

      {/* ── Sliding content area ──────────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden" style={{ minHeight: "200px" }}>

        {/* Slide 0 — Progress ring + quick stage summary */}
        <div className={`absolute inset-0 p-3 flex flex-col items-center justify-center gap-3 transition-opacity duration-500 ${slide === 0 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <ProgressRing pct={pct} done={doneCount} total={total} allDone={allDone} />
          {(() => {
            const recent = stages.filter((s) => completedMap.has(s.id)).slice(-2);
            const upcoming = stages.filter((s) => !completedMap.has(s.id)).slice(0, 3);
            return (
              <div className="flex flex-col gap-1 w-full max-w-xs">
                {recent.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-lime-500 shrink-0" />
                    <span className="text-[10px] text-zinc-500 line-through truncate flex-1">{s.label}</span>
                    {completedMap.get(s.id) && (
                      <span className="text-[9px] font-bold text-zinc-600 shrink-0">{completedMap.get(s.id)}</span>
                    )}
                  </div>
                ))}
                {upcoming.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full shrink-0 ${i === 0 ? "bg-sky-500" : "bg-zinc-700"}`} />
                    <span className={`text-[10px] truncate flex-1 ${i === 0 ? "text-white font-semibold" : "text-zinc-600"}`}>{s.label}</span>
                    {i === 0 && <span className="text-[9px] text-sky-600 shrink-0">Next</span>}
                  </div>
                ))}
              </div>
            );
          })()}
        </div>

        {/* Slide 1 — Full build stages list (the single source of truth) */}
        <div className={`absolute inset-0 p-3 flex flex-col gap-1.5 transition-opacity duration-500 ${slide === 1 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          <p className="text-[9px] uppercase tracking-widest text-zinc-600 shrink-0 mb-0.5">Build Sheet</p>
          <div className="flex-1 overflow-hidden flex flex-col gap-0.5">
            {stages.map((stage) => {
              const done = completedMap.has(stage.id);
              const initials = completedMap.get(stage.id) ?? null;
              return (
                <div key={stage.id} className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${done ? "bg-lime-500" : "bg-zinc-700"}`} />
                  <span className={`text-[10px] truncate flex-1 leading-tight ${done ? "line-through text-zinc-600" : "text-zinc-200"}`}>
                    {stage.label}
                  </span>
                  {done && initials && (
                    <span className="text-[8px] font-bold text-zinc-600 shrink-0">{initials}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Slide 2 — QR code */}
        {workshopUrl && (
          <div className={`absolute inset-0 p-3 flex flex-col items-center justify-center gap-3 transition-opacity duration-500 ${slide === 2 ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
            <p className="text-[10px] uppercase tracking-widest text-zinc-500">Scan to update build</p>
            <div className="bg-white p-2.5 rounded-lg">
              <QRCodeSVG value={workshopUrl} size={130} level="M" />
            </div>
            <p className="text-[9px] text-zinc-700 font-mono text-center break-all px-2">{workshopUrl}</p>
          </div>
        )}
      </div>

      {/* Slide indicator dots */}
      <div className="py-2 border-t border-zinc-800">
        <SlideDots slide={slide} total={numSlides} />
      </div>
    </div>
  );
}

// ── Page-level auto-scroll ────────────────────────────────────────────────────

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
    const id = setInterval(() => {
      if (paused || !el) return;
      pos += dir * 0.5;
      const max = el.scrollHeight - el.clientHeight;
      if (pos >= max) { pos = max; dir = -1; paused = true; pauseTimer = setTimeout(() => { paused = false; }, 4000); }
      if (pos <= 0) { pos = 0; dir = 1; paused = true; pauseTimer = setTimeout(() => { paused = false; }, 4000); }
      el.scrollTop = pos;
    }, 16);
    return () => { clearInterval(id); clearTimeout(pauseTimer); };
  }, [enabled]);
  return ref;
}

// ── Main board ────────────────────────────────────────────────────────────────

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

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          <h1 className="text-2xl font-black tracking-tight text-white">Workshop Pipeline</h1>
          <span className="text-zinc-500 text-sm">
            {committedQuotes.length} active job{committedQuotes.length !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-6 text-zinc-400 text-sm">
          <span>auto-refreshes every 30s</span>
          <span className="text-white font-bold text-lg tabular-nums"><LiveClock /></span>
        </div>
      </div>

      {/* Grid */}
      {committedQuotes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
          <p className="text-6xl font-black mb-4">—</p>
          <p className="text-2xl font-semibold">Nothing in build right now</p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          <div className={`grid ${cols} gap-4 p-4`}>
            {committedQuotes.map((q, i) => {
              const van = data.vans.find((v) => v.id === q.vanId);
              const kit = data.kits.find((k) => k.id === q.kitId);
              const selectedUpgrades = data.upgrades.filter((u) =>
                (q.selectedUpgradeIds ?? []).includes(u.id)
              );
              return (
                <JobCard
                  key={q.id}
                  q={q}
                  van={van}
                  kit={kit}
                  selectedUpgrades={selectedUpgrades}
                  cardIndex={i}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
