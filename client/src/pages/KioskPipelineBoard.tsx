import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";

const COMMITTED_STATUSES = new Set(["deposit_taken", "finance_approved", "in_build"]);

const STATUS_LABEL: Record<string, string> = {
  deposit_taken: "Deposit Taken",
  finance_approved: "Finance Approved",
  in_build: "In Build",
};

const STATUS_COLOUR: Record<string, string> = {
  deposit_taken: "bg-lime-600 text-white",
  finance_approved: "bg-sky-600 text-white",
  in_build: "bg-red-600 text-white",
};

function parseDbDate(val: Date | string | null | undefined): Date | null {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val as string);
  return isNaN(d.getTime()) ? null : d;
}

function fmtDate(val: Date | string | null | undefined): string {
  const d = parseDbDate(val);
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
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

function DueChip({ val }: { val: string | null }) {
  if (!parseDbDate(val)) {
    return <span className="text-xs font-semibold opacity-30">No due date</span>;
  }
  const days = daysUntil(val);
  if (days === null) return null;
  const overdue = days < 0;
  const isToday = days === 0;
  const soon = days > 0 && days <= 2;
  const colour = overdue
    ? "text-red-400"
    : isToday
    ? "text-orange-400"
    : soon
    ? "text-yellow-400"
    : "text-lime-400";
  const label = overdue
    ? `${Math.abs(days)}d overdue`
    : isToday
    ? "Due today"
    : `${days}d left`;
  return (
    <div className={`text-right ${colour}`}>
      <div className="text-base font-black leading-tight tabular-nums">{fmtDate(val)}</div>
      <div className="text-[10px] font-semibold mt-0.5">{label}</div>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────

interface StageEntry {
  id: string;
  initials: string | null; // null = not yet completed
}

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

interface KioskUpgrade {
  id: string;
  name: string;
  category: string;
}

interface KioskData {
  quotes: KioskQuote[];
  vans: { id: string; make: string; model: string; year: number | null }[];
  kits: { id: string; name: string }[];
  upgrades: KioskUpgrade[];
}

// ── Stage helpers ───────────────────────────────────────────────────────────

const wrapPat = /wrap|graphics|livery/i;
const wallPat = /interior.wall/i;

function isWrap(u: KioskUpgrade) {
  return wrapPat.test(u.name) || wrapPat.test(u.category);
}
function isWall(u: KioskUpgrade) {
  return wallPat.test(u.name) || wallPat.test(u.category);
}

/** Replicates QuoteDetail.tsx autoGenerateStages() */
function generateStages(
  kitName: string | null,
  selectedUpgrades: KioskUpgrade[],
): Array<{ id: string; label: string }> {
  const stages: Array<{ id: string; label: string }> = [];
  stages.push({ id: "prep", label: "Van Preparation" });
  if (kitName) stages.push({ id: "kit", label: `Install ${kitName}` });

  const nonWrap = selectedUpgrades.filter((u) => !isWrap(u) && !isWall(u));
  const wrapOnly = selectedUpgrades.filter((u) => isWrap(u) && !isWall(u));
  const wallOnly = selectedUpgrades.filter((u) => isWall(u) && !isWrap(u));

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

/** Normalise completedBuildStages entries to { id, initials } */
function normaliseCompleted(raw: Array<string | { id: string; initials: string }>): StageEntry[] {
  return raw.map((entry) =>
    typeof entry === "string"
      ? { id: entry, initials: null }
      : { id: entry.id, initials: entry.initials ?? null },
  );
}

// ── Build stage list component ──────────────────────────────────────────────

function BuildStageList({
  stages,
  completed,
}: {
  stages: Array<{ id: string; label: string }>;
  completed: StageEntry[];
}) {
  const completedIds = new Set(completed.map((c) => c.id));
  const initialsMap = new Map(completed.map((c) => [c.id, c.initials]));
  const doneCount = stages.filter((s) => completedIds.has(s.id)).length;
  const total = stages.length;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div>
      {/* Progress header */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500">Build</p>
        <span className="text-[10px] font-bold text-zinc-400 tabular-nums">
          {doneCount}/{total}
        </span>
      </div>

      {/* Thin progress bar */}
      <div className="w-full h-1 bg-zinc-700 rounded-full mb-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            pct === 100 ? "bg-lime-400" : "bg-sky-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Stage chips */}
      <div className="flex flex-wrap gap-1">
        {stages.map((stage) => {
          const done = completedIds.has(stage.id);
          const initials = initialsMap.get(stage.id) ?? null;
          return (
            <span
              key={stage.id}
              className={`inline-flex items-center gap-0.5 text-[9px] font-medium px-1.5 py-0.5 rounded border ${
                done
                  ? "bg-zinc-800/50 border-zinc-700 text-zinc-600 line-through"
                  : "bg-zinc-800 border-zinc-600 text-zinc-200"
              }`}
            >
              {stage.label}
              {done && initials && (
                <span className="ml-0.5 text-[8px] font-bold text-zinc-500 no-underline not-italic">
                  {initials}
                </span>
              )}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

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
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-lime-400" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="h-screen bg-zinc-950 flex flex-col items-center justify-center text-white gap-3">
        <div className="text-4xl font-black text-red-400">Access Denied</div>
        <p className="text-zinc-400 text-base">This kiosk link is invalid or has been reset.</p>
        <p className="text-zinc-500 text-sm">Ask an admin to generate a new kiosk URL.</p>
      </div>
    );
  }

  const committedQuotes = data.quotes.filter((q) => COMMITTED_STATUSES.has(q.status));

  const colClass =
    committedQuotes.length <= 2
      ? "grid-cols-2"
      : committedQuotes.length <= 4
      ? "grid-cols-2 xl:grid-cols-4"
      : "grid-cols-3";

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 text-white flex flex-col px-4 py-3 gap-3">
      {/* Compact header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white leading-none">
            Workshop Pipeline
          </h1>
          <p className="text-zinc-400 text-xs mt-0.5">
            {committedQuotes.length} active job{committedQuotes.length !== 1 ? "s" : ""}
            &nbsp;·&nbsp;auto-refreshes every 60 s
          </p>
        </div>
        <div className="text-zinc-600 text-xs tabular-nums">
          {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {committedQuotes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500">
          <div className="text-5xl font-black mb-3">—</div>
          <p className="text-xl font-semibold">Nothing in build</p>
          <p className="text-sm mt-1">No committed jobs at the moment.</p>
        </div>
      ) : (
        <div className={`flex-1 grid ${colClass} gap-3 min-h-0`}>
          {committedQuotes.map((q) => {
            const van = data.vans.find((v) => v.id === q.vanId);
            const kit = data.kits.find((k) => k.id === q.kitId);
            const selectedUpgrades = data.upgrades.filter((u) =>
              (q.selectedUpgradeIds ?? []).includes(u.id),
            );
            const vanLabel = van
              ? `${van.year} ${van.make} ${van.model}`
              : q.customVanDescription || "—";

            // Build stages — use custom list if staff overrode it, otherwise auto-generate
            const stages =
              q.customBuildStages ??
              generateStages(kit?.name ?? null, selectedUpgrades);
            const completed = normaliseCompleted(q.completedBuildStages);

            return (
              <div
                key={q.id}
                className="bg-zinc-900 rounded-lg border border-zinc-700 p-3 flex flex-col gap-2 min-h-0 overflow-hidden"
                data-testid={`card-kiosk-${q.id}`}
              >
                {/* Header: name + reg on top line + status badge */}
                <div className="flex items-center justify-between gap-2 shrink-0 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <p className="text-sm font-black leading-tight truncate min-w-0">
                      {q.userName || "—"}
                    </p>
                    {q.vanRegistration && (
                      <span className="shrink-0 text-[11px] font-extrabold tracking-wider bg-yellow-400 text-black px-1.5 py-0.5 rounded uppercase">
                        {q.vanRegistration}
                      </span>
                    )}
                  </div>
                  <Badge
                    className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 no-default-active-elevate ${STATUS_COLOUR[q.status] ?? "bg-zinc-700 text-white"}`}
                  >
                    {STATUS_LABEL[q.status] ?? q.status}
                  </Badge>
                </div>

                {/* Van */}
                <div className="shrink-0">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Van</p>
                  <p className="text-sm font-bold text-white leading-tight">{vanLabel}</p>
                </div>

                {/* Kit */}
                {kit && (
                  <div className="shrink-0">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Pack</p>
                    <p className="text-xs font-semibold text-white leading-tight">{kit.name}</p>
                  </div>
                )}

                {/* Build stages — fills remaining space */}
                <div className="flex-1 min-h-0 overflow-hidden">
                  <BuildStageList stages={stages} completed={completed} />
                </div>

                {/* Due out — pinned to bottom */}
                <div className="pt-2 border-t border-zinc-700 shrink-0 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">
                      Due out
                    </p>
                    {q.statusChangedAt && (
                      <p className="text-[10px] text-zinc-600">
                        Since {fmtDate(q.statusChangedAt)}
                      </p>
                    )}
                  </div>
                  <DueChip val={q.targetCompletionDate} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
