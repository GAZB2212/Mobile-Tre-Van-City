import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Quote, Van, Kit, Upgrade } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { useEffect } from "react";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";

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

/**
 * DB timestamp columns are typed as `Date | null` by Drizzle's $inferSelect, but arrive
 * over the wire as ISO strings after JSON serialisation.  This helper normalises both
 * forms to a JS Date so callers never need type-escape casts.
 */
function parseDbDate(val: Date | string | null | undefined): Date | null {
  if (!val) return null;
  const d = val instanceof Date ? val : new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Format a DB date value as a human-readable date, comparing in UTC so the displayed
 * calendar day is not shifted by the browser's local timezone offset.
 */
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

/**
 * Return the number of calendar days between now and the given date, comparing in UTC
 * to avoid timezone-induced off-by-one errors.  Negative = overdue.
 */
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
  if (!parseDbDate(val)) return <span className="text-4xl font-bold opacity-30">No due date</span>;
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
      <div className="text-5xl font-black leading-none tabular-nums">{fmtDate(val)}</div>
      <div className="text-2xl font-semibold mt-1">{label}</div>
    </div>
  );
}

export default function PipelineBoard() {
  const { user, isAuthenticated, isLoading } = useAuth();

  const { data: quotes = [] } = useQuery<Quote[]>({
    queryKey: ["/api/admin/quotes"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
    refetchInterval: 60_000,
    refetchIntervalInBackground: true,
  });

  const { data: vans = [] } = useQuery<Van[]>({
    queryKey: ["/api/admin/vans"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
    staleTime: 300_000,
  });

  const { data: kits = [] } = useQuery<Kit[]>({
    queryKey: ["/api/admin/kits"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
    staleTime: 300_000,
  });

  const { data: upgrades = [] } = useQuery<Upgrade[]>({
    queryKey: ["/api/admin/upgrades"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
    staleTime: 300_000,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/login";
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-lime-400" />
      </div>
    );
  }

  if (!isAuthenticated || !user?.adminRole || user.adminRole === "none") return null;

  const committedQuotes = quotes.filter((q) => COMMITTED_STATUSES.has(q.status));

  return (
    <div className="min-h-screen bg-zinc-950 text-white px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Workshop Pipeline</h1>
          <p className="text-zinc-400 text-lg mt-1">
            {committedQuotes.length} active job{committedQuotes.length !== 1 ? "s" : ""}
            &nbsp;·&nbsp;auto-refreshes every 60 s
          </p>
        </div>
        <Link href="/admin" className="flex items-center gap-1.5 text-zinc-400 hover:text-white text-sm transition-colors">
          <ExternalLink className="w-4 h-4" />
          Admin
        </Link>
      </div>

      {committedQuotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-zinc-500">
          <div className="text-7xl font-black mb-4">—</div>
          <p className="text-2xl font-semibold">Nothing in build</p>
          <p className="text-lg mt-2">No committed jobs at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {committedQuotes.map((q) => {
            const van = vans.find((v) => v.id === q.vanId);
            const kit = kits.find((k) => k.id === q.kitId);
            const selectedUpgrades = upgrades.filter((u) => (q.selectedUpgradeIds || []).includes(u.id));
            const vanLabel = van
              ? `${van.year} ${van.make} ${van.model}`
              : q.customVanDescription || "—";

            return (
              <div
                key={q.id}
                className="bg-zinc-900 rounded-xl border border-zinc-700 p-6 flex flex-col gap-5 min-h-[340px]"
                data-testid={`card-pipeline-${q.id}`}
              >
                {/* Top row: name + status badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-3xl font-black leading-tight truncate">{q.userName || q.email}</p>
                    {q.company && (
                      <p className="text-xl text-zinc-400 font-semibold mt-0.5 truncate">{q.company}</p>
                    )}
                    {q.phone && (
                      <p className="text-lg text-zinc-300 mt-1">{q.phone}</p>
                    )}
                  </div>
                  <Badge
                    className={`shrink-0 text-base font-bold px-3 py-1 no-default-active-elevate ${STATUS_COLOUR[q.status] ?? "bg-zinc-700 text-white"}`}
                  >
                    {STATUS_LABEL[q.status] ?? q.status}
                  </Badge>
                </div>

                {/* Van */}
                <div>
                  <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Van</p>
                  <p className="text-xl font-bold text-white">{vanLabel}</p>
                </div>

                {/* Kit */}
                {kit && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Pack</p>
                    <p className="text-lg font-semibold text-white">{kit.name}</p>
                  </div>
                )}

                {/* Upgrades */}
                {selectedUpgrades.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1.5">Upgrades</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUpgrades.map((u) => (
                        <span
                          key={u.id}
                          className="bg-zinc-800 border border-zinc-600 text-zinc-200 text-sm font-medium px-2.5 py-0.5 rounded"
                        >
                          {u.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status since */}
                {q.statusChangedAt && (
                  <p className="text-sm text-zinc-500">
                    In this stage since {fmtDate(q.statusChangedAt)}
                  </p>
                )}

                {/* Due out — pushed to bottom */}
                <div className="mt-auto pt-4 border-t border-zinc-700">
                  <p className="text-xs uppercase tracking-widest text-zinc-500 mb-2">Due out</p>
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
