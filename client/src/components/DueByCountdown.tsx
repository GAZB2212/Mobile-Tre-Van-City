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
          {(() => {
            // Unit columns — digit on top, short label centred beneath. Reads like
            // a regular countdown clock and never overflows the kiosk job card.
            const units: { value: string; label: string; highlight?: boolean }[] = c
              ? [
                  { value: pad(c.weeks),   label: "wks"  },
                  { value: pad(c.days),    label: "days" },
                  { value: pad(c.hours),   label: "hrs"  },
                  { value: pad(c.minutes), label: "min"  },
                  { value: pad(c.seconds), label: "sec", highlight: true },
                ]
              : [
                  { value: "--", label: "wks"  },
                  { value: "--", label: "days" },
                  { value: "--", label: "hrs"  },
                  { value: "--", label: "min"  },
                  { value: "--", label: "sec"  },
                ];
            const digitColour = c
              ? accent
              : dim;
            const secondsColour = c?.overdue
              ? "text-red-500"
              : isDark ? "text-yellow-300" : "text-foreground/80";
            return (
              <div
                className="flex items-end gap-1 sm:gap-1.5"
                data-testid={c ? "text-countdown" : "text-countdown-empty"}
                title={c?.overdue ? "Overdue" : c ? "Time until due date" : undefined}
              >
                {units.map((u, i) => (
                  <div key={u.label} className="flex items-end gap-1 sm:gap-1.5">
                    <div className="flex flex-col items-center leading-none">
                      <span
                        className={`font-mono font-bold tabular-nums text-2xl sm:text-3xl ${
                          u.highlight && c ? secondsColour : digitColour
                        }`}
                        data-testid={u.label === "sec" && c ? "text-countdown-seconds" : undefined}
                      >
                        {u.value}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wider mt-1 ${dim}`}>
                        {u.label}
                      </span>
                    </div>
                    {i < units.length - 1 && (
                      <span className={`font-mono font-bold text-2xl sm:text-3xl leading-none pb-3 ${dim}`}>:</span>
                    )}
                  </div>
                ))}
              </div>
            );
          })()}
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
