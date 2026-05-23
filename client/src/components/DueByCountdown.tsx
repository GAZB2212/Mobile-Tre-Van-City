import { useEffect, useState, useMemo } from "react";
import { addWeeks, countdown, isAutoSeeded, DUE_BY_LEAD_WEEKS_MIN, DUE_BY_LEAD_WEEKS_MAX } from "@shared/dueByCountdown";

interface DueByCountdownProps {
  targetCompletionDate: string | Date | null | undefined;
  artworkApprovedAt: string | Date | null | undefined;
  editable?: boolean;
  onChange?: (isoDateOrNull: string | null) => void;
  variant?: "light" | "dark";
}

function pad(n: number, width = 2) {
  return String(Math.max(0, n)).padStart(width, "0");
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function DueByCountdown({
  targetCompletionDate,
  artworkApprovedAt,
  editable = false,
  onChange,
  variant = "light",
}: DueByCountdownProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const target = useMemo(() => {
    if (!targetCompletionDate) return null;
    const d = targetCompletionDate instanceof Date ? targetCompletionDate : new Date(targetCompletionDate);
    return isNaN(d.getTime()) ? null : d;
  }, [targetCompletionDate]);

  const approved = useMemo(() => {
    if (!artworkApprovedAt) return null;
    const d = artworkApprovedAt instanceof Date ? artworkApprovedAt : new Date(artworkApprovedAt);
    return isNaN(d.getTime()) ? null : d;
  }, [artworkApprovedAt]);

  const c = countdown(target, now);
  const seeded = isAutoSeeded(approved, target);
  const sixWeekDate = approved ? addWeeks(approved, DUE_BY_LEAD_WEEKS_MIN) : null;
  const nineWeekDate = approved ? addWeeks(approved, DUE_BY_LEAD_WEEKS_MAX) : null;
  const showSixWeekChip = !!(sixWeekDate && now < sixWeekDate.getTime());

  // Convert target to YYYY-MM-DD for the date input
  const inputValue = target ? target.toISOString().slice(0, 10) : "";

  const handleDateChange = (e: React.InputEvent<HTMLInputElement> | React.ChangeEvent<HTMLInputElement>) => {
    const v = (e.target as HTMLInputElement).value;
    if (!onChange) return;
    onChange(v ? `${v}T00:00:00.000Z` : null);
  };

  const isDark = variant === "dark";
  const subText = isDark ? "text-zinc-400" : "text-muted-foreground";
  const dim = isDark ? "text-zinc-500" : "text-muted-foreground/60";
  const accent = c?.overdue ? "text-red-500" : isDark ? "text-yellow-400" : "text-foreground";
  const chipBase = isDark
    ? "bg-zinc-800 text-zinc-300 border-zinc-700"
    : "bg-muted text-muted-foreground border-border";

  return (
    <div
      className={`rounded-md border px-3 py-2 ${isDark ? "bg-zinc-900 border-zinc-800" : "bg-card"} no-print`}
      data-testid="due-by-countdown"
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <span className={`text-[10px] font-semibold uppercase tracking-widest ${subText}`}>Due By</span>
          {c ? (
            <div
              className={`font-mono font-bold tabular-nums leading-none ${accent} text-2xl sm:text-3xl`}
              data-testid="text-countdown"
              title={c.overdue ? "Overdue" : "Time until due date"}
            >
              {pad(c.weeks)}<span className={dim}>:</span>
              {pad(c.days)}<span className={dim}>:</span>
              {pad(c.hours)}<span className={dim}>:</span>
              {pad(c.minutes)}
            </div>
          ) : (
            <div className={`font-mono font-bold tabular-nums leading-none text-2xl sm:text-3xl ${dim}`} data-testid="text-countdown-empty">
              --<span>:</span>--<span>:</span>--<span>:</span>--
            </div>
          )}
          <div className={`text-[10px] uppercase tracking-wider ${dim} hidden sm:flex gap-2`}>
            <span>wks</span><span>days</span><span>hrs</span><span>min</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {c?.overdue && (
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-red-500 text-white" data-testid="chip-overdue">
              Overdue
            </span>
          )}
          {showSixWeekChip && sixWeekDate && (
            <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded border ${chipBase}`} data-testid="chip-6wk">
              6wk · {fmtDate(sixWeekDate)}
            </span>
          )}
          {nineWeekDate && (
            <span className={`text-[10px] font-medium uppercase tracking-wider px-2 py-1 rounded border ${chipBase}`} data-testid="chip-9wk">
              9wk · {fmtDate(nineWeekDate)}
            </span>
          )}
          {editable ? (
            <input
              type="date"
              value={inputValue}
              onChange={handleDateChange}
              className={`text-xs rounded border px-2 py-1 ${
                isDark ? "bg-zinc-900 border-zinc-700 text-zinc-200" : "bg-background border-input"
              }`}
              data-testid="input-target-completion-date"
              title="Edit due-by date"
            />
          ) : target ? (
            <span className={`text-xs ${subText}`} data-testid="text-target-date">
              {fmtDate(target)}
            </span>
          ) : (
            <span className={`text-xs ${dim}`}>No date set</span>
          )}
          {seeded && !editable && (
            <span className={`text-[9px] uppercase tracking-wider ${dim}`} title="Auto-set from artwork approval + 9 weeks">auto</span>
          )}
        </div>
      </div>
    </div>
  );
}
