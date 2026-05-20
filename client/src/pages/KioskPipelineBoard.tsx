import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { Lock, Circle, CheckCircle2 } from "lucide-react";

const COMMITTED_STATUSES = new Set(["deposit_taken", "finance_approved", "in_build"]);

const STATUS_LABEL: Record<string, string> = {
  deposit_taken: "Deposit Taken",
  finance_approved: "Finance Approved",
  in_build: "In Build",
};

const STATUS_COLOUR: Record<string, string> = {
  deposit_taken: "bg-lime-600",
  finance_approved: "bg-sky-600",
  in_build: "bg-orange-500",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseDbDate(val: Date | string | null | undefined): Date | null {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val as string);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(val: Date | string | null | undefined): string {
  const d = parseDbDate(val);
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
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

// ── Stage generation ──────────────────────────────────────────────────────────

const wrapPat = /wrap|graphics|livery/i;
const wallPat = /interior.wall/i;

function generateStages(kitName: string | null, selectedUpgrades: KioskUpgrade[]) {
  const stages: { id: string; label: string }[] = [];
  stages.push({ id: "prep", label: "Van Preparation" });
  if (kitName) stages.push({ id: "kit", label: `Install ${kitName}` });
  if (selectedUpgrades.some((u) => wrapPat.test(u.name)))
    stages.push({ id: "wrap", label: "Wrap / Livery" });
  if (selectedUpgrades.some((u) => wallPat.test(u.name)))
    stages.push({ id: "wall", label: "Interior Wall Lining" });
  stages.push({ id: "qa", label: "Quality Check" });
  stages.push({ id: "handover", label: "Handover" });
  return stages;
}

function normaliseCompleted(raw: Array<string | { id: string; initials: string }>) {
  return raw.map((e) =>
    typeof e === "string" ? { id: e, initials: null } : { id: e.id, initials: e.initials ?? null }
  );
}

// ── Clock ─────────────────────────────────────────────────────────────────────

function LiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
  );
  useEffect(() => {
    const id = setInterval(
      () => setTime(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })),
      10000
    );
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

// ── Job card — full spec visible ───────────────────────────────────────────────

function JobCard({
  q, van, kit, selectedUpgrades,
}: {
  q: KioskQuote;
  van: { make: string; model: string; year: number | null } | undefined;
  kit: { name: string } | undefined;
  selectedUpgrades: KioskUpgrade[];
}) {
  const stages = q.customBuildStages ?? generateStages(kit?.name ?? null, selectedUpgrades);
  const completed = normaliseCompleted(q.completedBuildStages);
  const completedIds = new Set(completed.map((c) => c.id));

  const doneCount = stages.filter((s) => completedIds.has(s.id)).length;
  const total = stages.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;
  const allDone = doneCount === total && total > 0;

  const vanLabel = van
    ? `${van.year ?? ""} ${van.make} ${van.model}`.trim()
    : q.customVanDescription || null;

  const days = daysUntil(q.targetCompletionDate);
  const dueColour =
    days === null ? "text-zinc-600"
    : days < 0 ? "text-red-400"
    : days === 0 ? "text-orange-400"
    : days <= 3 ? "text-yellow-400"
    : "text-zinc-500";

  const workshopUrl = q.confirmationToken
    ? `${window.location.origin}/workshop/${q.confirmationToken}`
    : null;

  const barColour = allDone ? "bg-lime-400" : pct > 50 ? "bg-sky-400" : pct > 0 ? "bg-orange-400" : "bg-zinc-700";

  // Group upgrades by category
  const upgradesByCategory: Record<string, KioskUpgrade[]> = {};
  for (const u of selectedUpgrades) {
    const cat = u.category || "Other";
    if (!upgradesByCategory[cat]) upgradesByCategory[cat] = [];
    upgradesByCategory[cat].push(u);
  }
  const upgradeCategories = Object.entries(upgradesByCategory);

  return (
    <div className={`rounded-lg border flex flex-col overflow-hidden ${allDone ? "border-zinc-800 bg-zinc-950 opacity-50 grayscale" : "border-zinc-800 bg-zinc-900"}`}>

      {/* Progress header at top — bar + count */}
      <div className="shrink-0 bg-zinc-950 border-b border-zinc-800">
        <div className="h-3 bg-zinc-800">
          <div className={`h-full ${barColour}`} style={{ width: `${Math.max(pct, 2)}%` }} />
        </div>
        <div className="flex items-center justify-between px-3 py-1">
          <span className={`text-[10px] font-black tabular-nums ${allDone ? "text-lime-400" : "text-zinc-300"}`}>
            {doneCount} / {total} stages
          </span>
          <span className={`text-[10px] font-black tabular-nums ${allDone ? "text-lime-400" : "text-zinc-400"}`}>
            {pct}%
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="flex gap-3 px-3 py-2.5 min-w-0">

        {/* Left: all details */}
        <div className="flex-1 min-w-0 flex flex-col gap-2">

          {/* Name + status badge */}
          <div className="flex items-start justify-between gap-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black text-white leading-tight">{q.userName || "—"}</p>
              {q.company && <p className="text-sm font-black text-white leading-tight mt-0.5">{q.company}</p>}
            </div>
            <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded text-white ${STATUS_COLOUR[q.status] ?? "bg-zinc-600"}`}>
              {STATUS_LABEL[q.status] ?? q.status}
            </span>
          </div>

          {/* Reg + van */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {q.vanRegistration && (
              <span className="text-[9px] font-extrabold tracking-widest bg-yellow-400 text-black px-1.5 py-0.5 rounded font-mono uppercase shrink-0">
                {q.vanRegistration}
              </span>
            )}
            {vanLabel && <span className="text-[10px] text-zinc-400">{vanLabel}</span>}
          </div>

          {/* Equipment Pack */}
          {kit && (
            <div className="space-y-0.5">
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider font-semibold">Equipment Pack</p>
              <p className="text-[11px] text-sky-400 font-semibold leading-tight">{kit.name}</p>
            </div>
          )}

          {/* Build stages — same look as workshop QR scan page */}
          {stages.length > 0 && (
            <div className="space-y-1">
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider font-semibold">Build Stages</p>
              <div className="space-y-1">
                {stages.map((s) => {
                  const done = completedIds.has(s.id);
                  const entry = completed.find((c) => c.id === s.id);
                  return (
                    <div
                      key={s.id}
                      className={[
                        "w-full flex items-center gap-2 px-2 py-1.5 rounded-lg",
                        done
                          ? "bg-zinc-900/50 border border-zinc-800/50 opacity-70"
                          : "bg-zinc-900 border border-zinc-800",
                      ].join(" ")}
                    >
                      {done ? (
                        <Lock className="w-4 h-4 shrink-0 text-zinc-600" />
                      ) : (
                        <Circle className="w-4 h-4 shrink-0 text-zinc-600" />
                      )}
                      <span
                        className={[
                          "flex-1 min-w-0 text-[11px] font-medium leading-tight",
                          done ? "line-through text-zinc-600" : "text-white",
                        ].join(" ")}
                      >
                        {s.label}
                      </span>
                      {done && entry?.initials && (
                        <span className="shrink-0 text-[9px] font-bold text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded uppercase tracking-wide">
                          {entry.initials}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Upgrades grouped by category — reference list */}
          {upgradeCategories.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[9px] text-zinc-600 uppercase tracking-wider font-semibold">Upgrades & Options</p>
              {upgradeCategories.map(([cat, items]) => (
                <div key={cat}>
                  <p className="text-[9px] text-zinc-600 leading-none mb-0.5">{cat}</p>
                  <div className="flex flex-wrap gap-1">
                    {items.map((u) => (
                      <span key={u.id} className="text-[10px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded leading-tight">
                        {u.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Due date */}
          <p className={`text-[9px] ${dueColour}`}>
            {q.targetCompletionDate ? (
              <>
                <span className="font-semibold">Due: {fmtDate(q.targetCompletionDate)}</span>
                {days !== null && (
                  <span className="ml-1 opacity-70">
                    {days < 0 ? `${Math.abs(days)}d overdue` : days === 0 ? "today" : `${days}d`}
                  </span>
                )}
              </>
            ) : (
              <span className="text-zinc-700">No due date set</span>
            )}
          </p>
        </div>

        {/* Right: QR code */}
        {workshopUrl && (
          <div className="shrink-0 flex flex-col items-center gap-1 pt-0.5">
            <div className="bg-white rounded p-1">
              <QRCodeSVG value={workshopUrl} size={64} level="M" />
            </div>
            <span className="text-[8px] text-zinc-700 text-center leading-tight">scan to<br />update</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Touch-drag scroll hook ────────────────────────────────────────────────────

function useTouchScroll(ref: React.RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let startY = 0;
    let startScrollTop = 0;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;
    let rafId: number;

    const onTouchStart = (e: TouchEvent) => {
      cancelAnimationFrame(rafId);
      startY = e.touches[0].clientY;
      startScrollTop = el.scrollTop;
      lastY = startY;
      lastTime = Date.now();
      velocity = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      const now = Date.now();
      const dt = now - lastTime;
      if (dt > 0) velocity = (lastY - y) / dt;
      lastY = y;
      lastTime = now;
      el.scrollTop = startScrollTop + (startY - y);
      e.preventDefault();
    };

    const onTouchEnd = () => {
      // Momentum: keep scrolling at velocity, decaying
      const momentum = () => {
        if (Math.abs(velocity) < 0.05) return;
        el.scrollTop += velocity * 16;
        velocity *= 0.93;
        rafId = requestAnimationFrame(momentum);
      };
      rafId = requestAnimationFrame(momentum);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      cancelAnimationFrame(rafId);
    };
  }, [ref]);
}

// ── Main board ────────────────────────────────────────────────────────────────

export default function KioskPipelineBoard() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const scrollRef = useRef<HTMLDivElement>(null);
  useTouchScroll(scrollRef as React.RefObject<HTMLElement>);

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

  const committedQuotes = data.quotes.filter((q) => COMMITTED_STATUSES.has(q.status));
  const n = committedQuotes.length;

  const cols = n <= 2 ? 2 : n <= 6 ? 3 : 4;

  return (
    <div
      className="h-screen bg-zinc-950 text-white flex flex-col overflow-hidden select-none"
      style={{ cursor: "none" }}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-2 bg-zinc-900 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
          <h1 className="text-lg font-black tracking-tight text-white">Workshop Pipeline</h1>
          <span className="text-zinc-600 text-xs">{n} active job{n !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-4 text-zinc-500 text-xs">
          <span>refreshes every 30s</span>
          <span className="text-white font-bold text-base tabular-nums"><LiveClock /></span>
        </div>
      </div>

      {/* Scrollable grid */}
      {n === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-600">
          <p className="text-5xl font-black mb-3">—</p>
          <p className="text-xl font-semibold">No active jobs right now</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            touchAction: "pan-y",
          }}
        >
          <div
            className="p-2 gap-2"
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${cols}, 1fr)`,
            }}
          >
            {committedQuotes.map((q) => {
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
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
