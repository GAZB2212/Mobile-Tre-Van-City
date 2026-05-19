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

function DueChip({ val }: { val: Date | string | null | undefined }) {
  if (!parseDbDate(val)) {
    return <span className="text-sm font-semibold opacity-30">No due date</span>;
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
      <div className="text-lg font-black leading-tight tabular-nums">{fmtDate(val)}</div>
      <div className="text-xs font-semibold mt-0.5">{label}</div>
    </div>
  );
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
  kitId: string | null;
  selectedUpgradeIds: string[];
}

interface KioskData {
  quotes: KioskQuote[];
  vans: { id: string; make: string; model: string; year: number | null }[];
  kits: { id: string; name: string }[];
  upgrades: { id: string; name: string }[];
}

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

  // Pick column count based on card count so everything fills the screen sensibly
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
              (q.selectedUpgradeIds ?? []).includes(u.id)
            );
            const vanLabel = van
              ? `${van.year} ${van.make} ${van.model}`
              : q.customVanDescription || "—";

            return (
              <div
                key={q.id}
                className="bg-zinc-900 rounded-lg border border-zinc-700 p-3 flex flex-col gap-2 min-h-0 overflow-hidden"
                data-testid={`card-kiosk-${q.id}`}
              >
                {/* Name + badge */}
                <div className="flex items-start justify-between gap-2 shrink-0">
                  <div className="min-w-0">
                    <p className="text-xl font-black leading-tight truncate">{q.userName}</p>
                    {q.company && (
                      <p className="text-xs text-zinc-400 font-semibold truncate mt-0.5">{q.company}</p>
                    )}
                    {q.phone && (
                      <p className="text-xs text-zinc-300 mt-0.5">{q.phone}</p>
                    )}
                  </div>
                  <Badge
                    className={`shrink-0 text-xs font-bold px-2 py-0.5 no-default-active-elevate ${STATUS_COLOUR[q.status] ?? "bg-zinc-700 text-white"}`}
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
                    <p className="text-sm font-semibold text-white leading-tight">{kit.name}</p>
                  </div>
                )}

                {/* Upgrades — allow to scroll within the card if there are many */}
                {selectedUpgrades.length > 0 && (
                  <div className="flex-1 min-h-0 overflow-hidden">
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-1">Upgrades</p>
                    <div className="flex flex-wrap gap-1 overflow-hidden">
                      {selectedUpgrades.map((u) => (
                        <span
                          key={u.id}
                          className="bg-zinc-800 border border-zinc-600 text-zinc-300 text-[10px] font-medium px-1.5 py-0.5 rounded"
                        >
                          {u.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Due out — pinned to bottom */}
                <div className="mt-auto pt-2 border-t border-zinc-700 shrink-0 flex items-end justify-between gap-2">
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-0.5">Due out</p>
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
