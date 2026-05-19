import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchJson } from "@/lib/queryClient";
import { CheckCircle2, Circle, Loader2, Wrench, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const NAME_KEY = "workshop:name";

type BuildProgressData = {
  customerName: string;
  vanRegistration: string | null;
  company: string | null;
  stages: Array<{ id: string; label: string; section?: string }>;
  completedStageIds: string[];
};

export default function WorkshopProgress() {
  const { token } = useParams<{ token: string }>();
  const qc = useQueryClient();

  const [staffName, setStaffName] = useState<string>(() => {
    try { return localStorage.getItem(NAME_KEY) ?? ""; } catch { return ""; }
  });
  const [nameInput, setNameInput] = useState("");

  // Two-step confirmation state
  const [selected, setSelected] = useState<string | null>(null); // tapped but not saved
  const [saving, setSaving] = useState<string | null>(null);     // in-flight

  const { data, isLoading, isError } = useQuery<BuildProgressData>({
    queryKey: [`/api/build-progress-public/${token}`],
    queryFn: () => fetchJson(`/api/build-progress-public/${token}`),
    refetchInterval: 15000,
    enabled: !!token,
  });

  const stageMutation = useMutation({
    mutationFn: ({ stageId, completed }: { stageId: string; completed: boolean }) =>
      fetch(`/api/build-progress-public/${token}/stage`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stageId, completed, initials: staffName }),
      }).then((r) => {
        if (!r.ok) throw new Error("Failed");
        return r.json();
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [`/api/build-progress-public/${token}`] });
      setSaving(null);
      setSelected(null);
    },
    onError: () => {
      setSaving(null);
    },
  });

  function saveName() {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    try { localStorage.setItem(NAME_KEY, trimmed); } catch {}
    setStaffName(trimmed);
  }

  function handleTap(stageId: string) {
    if (saving) return;
    setSelected((prev) => (prev === stageId ? null : stageId));
  }

  function handleConfirm() {
    if (!selected || saving) return;
    const isDone = completedSet.has(selected);
    setSaving(selected);
    stageMutation.mutate({ stageId: selected, completed: !isDone });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-red-900/40 flex items-center justify-center">
          <Wrench className="w-7 h-7 text-red-400" />
        </div>
        <h1 className="text-xl font-bold text-white">QR Code Not Found</h1>
        <p className="text-zinc-400 text-sm max-w-xs">
          This QR code could not be matched to a build. Ask the office to re-print the sticker.
        </p>
      </div>
    );
  }

  if (!staffName) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-yellow-400/10 flex items-center justify-center mx-auto">
              <Wrench className="w-7 h-7 text-yellow-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Workshop Sign-In</h1>
            <p className="text-zinc-400 text-sm">
              Enter your name or initials once — your phone will remember it.
            </p>
          </div>
          <div className="space-y-3">
            <Input
              placeholder="e.g. Dave or DJ"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500 text-lg h-12"
              autoFocus
              data-testid="input-workshop-name"
            />
            <Button
              className="w-full h-12 text-base bg-yellow-400 text-black hover:bg-yellow-300"
              onClick={saveName}
              disabled={!nameInput.trim()}
              data-testid="button-workshop-signin"
            >
              Continue
              <ChevronRight className="w-5 h-5 ml-1" />
            </Button>
          </div>
          <p className="text-center text-xs text-zinc-600">Mobile Tyre Van City — Workshop</p>
        </div>
      </div>
    );
  }

  const completedSet = new Set(data.completedStageIds);
  const doneCount = data.completedStageIds.length;
  const totalCount = data.stages.length;
  const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  const selectedStage = selected ? data.stages.find((s) => s.id === selected) : null;
  const selectedIsDone = selected ? completedSet.has(selected) : false;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-36">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-yellow-400">Workshop Build Sheet</p>
            <h1 className="text-xl font-bold text-white leading-tight">{data.customerName}</h1>
            {data.company && (
              <p className="text-yellow-400/80 text-sm font-medium">{data.company}</p>
            )}
            {data.vanRegistration && (
              <p className="text-2xl font-bold font-mono tracking-widest text-zinc-300 pt-1">
                {data.vanRegistration}
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="text-3xl font-bold text-yellow-400">{pct}%</p>
            <p className="text-xs text-zinc-500">{doneCount}/{totalCount} done</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all duration-500 rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Instruction hint */}
        <p className="text-xs text-zinc-500 text-center">
          Tap a job to select it, then press the confirm button to save
        </p>

        {/* Stage list */}
        <div className="space-y-2" data-testid="workshop-stage-list">
          {data.stages.map((stage) => {
            const isDone = completedSet.has(stage.id);
            const isSelected = selected === stage.id;
            const isSaving = saving === stage.id;

            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => handleTap(stage.id)}
                disabled={!!saving}
                data-testid={`workshop-stage-${stage.id}`}
                className={[
                  "w-full flex items-center gap-4 px-4 py-4 rounded-lg text-left transition-all",
                  isSelected
                    ? "bg-amber-400/15 border border-amber-400/60 scale-[1.01]"
                    : isDone
                    ? "bg-yellow-400/10 border border-yellow-400/30"
                    : "bg-zinc-900 border border-zinc-800",
                  saving && !isSaving ? "opacity-40" : "",
                ].join(" ")}
              >
                {isSaving ? (
                  <Loader2 className="w-6 h-6 shrink-0 animate-spin text-yellow-400" />
                ) : isDone ? (
                  <CheckCircle2 className={`w-6 h-6 shrink-0 ${isSelected ? "text-amber-400" : "text-yellow-400"}`} />
                ) : (
                  <Circle className={`w-6 h-6 shrink-0 ${isSelected ? "text-amber-400" : "text-zinc-600"}`} />
                )}
                <span className={[
                  "flex-1 font-medium text-sm",
                  isDone && !isSelected ? "line-through text-zinc-500" : isSelected ? "text-white" : "text-white",
                ].join(" ")}>
                  {stage.label}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest shrink-0">
                    Selected
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* All done card */}
        {doneCount === totalCount && totalCount > 0 && (
          <Card className="border-yellow-400/30 bg-yellow-400/10">
            <CardContent className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-yellow-400 mx-auto" />
              <p className="font-bold text-white text-lg">All stages complete!</p>
              <p className="text-sm text-zinc-400">Let the office know this one's ready.</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-zinc-600 pt-2">
          <span>Signed in as <span className="text-zinc-400">{staffName}</span></span>
          <button
            type="button"
            className="underline"
            onClick={() => {
              try { localStorage.removeItem(NAME_KEY); } catch {}
              setStaffName("");
              setNameInput("");
            }}
          >
            Change name
          </button>
        </div>
        <p className="text-center text-xs text-zinc-700 pb-4">Mobile Tyre Van City — Workshop</p>
      </div>

      {/* Sticky confirm bar — only shows when a stage is selected */}
      {selectedStage && (
        <div className="fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-700 px-4 py-4 z-50">
          <div className="max-w-lg mx-auto space-y-3">
            <p className="text-sm text-zinc-400 text-center leading-snug">
              <span className="font-semibold text-white">{selectedStage.label}</span>
              {" — "}
              {selectedIsDone ? "mark as not done?" : "confirm this is complete?"}
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 h-12 border border-zinc-700 text-zinc-400"
                onClick={() => setSelected(null)}
                data-testid="button-workshop-cancel"
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
              <Button
                className={`flex-2 flex-1 h-12 text-base font-bold ${
                  selectedIsDone
                    ? "bg-zinc-700 text-white"
                    : "bg-yellow-400 text-black"
                }`}
                onClick={handleConfirm}
                disabled={!!saving}
                data-testid="button-workshop-confirm"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : selectedIsDone ? (
                  "Undo"
                ) : (
                  "Confirm Done"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
