import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Wrench, CircleDot, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface BuildProgressData {
  id: string;
  userName: string;
  status: string;
  customBuildStages: Array<{ id: string; label: string; section?: string }> | null;
  completedBuildStages: string[];
  kit: { id: string; name: string } | null;
  upgrades: Array<{ id: string; name: string; category: string; variantName: string | null }>;
}

export default function BuildProgress() {
  const { id: quoteId } = useParams<{ id: string }>();
  const { toast } = useToast();

  const { data, isLoading, isError } = useQuery<BuildProgressData>({
    queryKey: ["/api/build-progress", quoteId],
    queryFn: async () => {
      const res = await fetch(`/api/build-progress/${quoteId}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
  });

  const [completedStages, setCompletedStages] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  useEffect(() => {
    if (data && !initialized) {
      setCompletedStages(data.completedBuildStages ?? []);
      setInitialized(true);
    }
  }, [data, initialized]);

  const autoGenerateStages = (
    kit: BuildProgressData["kit"],
    upgrades: BuildProgressData["upgrades"]
  ): Array<{ id: string; label: string; section?: string }> => {
    const upgradeLabel = (u: BuildProgressData["upgrades"][0]) =>
      u.variantName ? `${u.name} — ${u.variantName}` : u.name;
    const interiorWallPattern = /interior.wall/i;
    const wrapGraphicsPattern = /wrap|graphic/i;
    const isInteriorWall = (u: { name: string; category: string }) =>
      interiorWallPattern.test(u.name) || interiorWallPattern.test(u.category);
    const isWrapGraphics = (u: { name: string; category: string }) =>
      wrapGraphicsPattern.test(u.name) || wrapGraphicsPattern.test(u.category);
    const stages: Array<{ id: string; label: string; section?: string }> = [];
    stages.push({ id: "prep", label: "Van Preparation" });
    if (kit) {
      stages.push({ id: "kit", label: `Install ${kit.name}` });
    }
    const nonWrap = upgrades.filter((u) => !isWrapGraphics(u) && !isInteriorWall(u));
    const wrap = upgrades.filter((u) => isWrapGraphics(u) && !isInteriorWall(u));
    const wallUpgrades = upgrades.filter((u) => isInteriorWall(u) && !isWrapGraphics(u));
    for (const u of nonWrap) stages.push({ id: `upg_${u.id}`, label: upgradeLabel(u) });
    if (wrap.length > 0) {
      stages.push({ id: "artwork_sent", label: "Artwork Sent", section: "Design Work" });
      stages.push({ id: "artwork_approved", label: "Artwork Approved", section: "Design Work" });
      stages.push({ id: "wrap_printed", label: "Wrap Printed", section: "Design Work" });
    }
    for (const u of wrap) stages.push({ id: `upg_${u.id}`, label: upgradeLabel(u) });
    if (wallUpgrades.length > 0) {
      stages.push({ id: "interior_walls_artwork_sent", label: "Interior Walls Artwork Sent", section: "Design Work" });
      stages.push({ id: "interior_wall_artwork_approved", label: "Interior Wall Artwork Approved", section: "Design Work" });
      stages.push({ id: "interior_walls_ordered", label: "Interior Walls Ordered", section: "Design Work" });
    }
    for (const u of wallUpgrades) stages.push({ id: `upg_${u.id}`, label: upgradeLabel(u) });
    stages.push({ id: "final_checks", label: "Final Checks" });
    stages.push({ id: "valet", label: "Valet & Handover" });
    return stages;
  };

  const activeStages =
    data
      ? (data.customBuildStages && data.customBuildStages.length > 0
        ? data.customBuildStages
        : autoGenerateStages(data.kit, data.upgrades))
      : [];

  const saveMutation = useMutation({
    mutationFn: async (updated: string[]) => {
      const res = await fetch(`/api/build-progress/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completedBuildStages: updated }),
      });
      if (!res.ok) throw new Error("Save failed");
      return res.json();
    },
    onError: () => {
      toast({ title: "Save failed", description: "Could not save. Please try again.", variant: "destructive" });
    },
  });

  const handleStagePress = (stageId: string) => {
    const isComplete = completedStages.includes(stageId);

    if (isComplete) {
      // Uncheck immediately — no confirmation needed
      const updated = completedStages.filter((s) => s !== stageId);
      setCompletedStages(updated);
      setPendingId(null);
      saveMutation.mutate(updated);
      return;
    }

    // Toggle the pending selection
    setPendingId((prev) => (prev === stageId ? null : stageId));
  };

  const handleConfirmSave = () => {
    if (!pendingId) return;
    const updated = [...completedStages, pendingId];
    setCompletedStages(updated);
    setPendingId(null);
    saveMutation.mutate(updated);
    toast({ title: "Stage marked complete", description: activeStages.find((s) => s.id === pendingId)?.label });
  };

  const doneCount = completedStages.filter((id) => activeStages.some((s) => s.id === id)).length;
  const totalCount = activeStages.length;
  const progressPct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
  const allDone = totalCount > 0 && doneCount === totalCount;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8bc440] mx-auto" />
          <p className="mt-3 text-muted-foreground text-sm">Loading build stages...</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-[#191919] flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Build not found. Check the QR code and try again.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#191919] flex flex-col">
      {/* Header */}
      <div className="border-b border-border/40 px-4 py-4 flex items-center gap-3">
        <Wrench className="w-5 h-5 text-[#8bc440] shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{data.userName}</p>
          <p className="text-xs text-muted-foreground">Build Stage Progress</p>
        </div>
        <Badge variant="secondary" className="shrink-0 text-xs" data-testid="badge-progress-pct">
          {progressPct}%
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted/40 w-full">
        <div
          className="h-full bg-[#8bc440] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
          data-testid="progress-bar"
        />
      </div>

      {/* Stage list */}
      <div className={cn("flex-1 overflow-y-auto px-4 py-4 space-y-2 max-w-lg mx-auto w-full", pendingId && "pb-28")}>
        {allDone ? (
          <div className="flex flex-col items-center gap-3 py-16" data-testid="all-done-banner">
            <CheckCircle2 className="w-14 h-14 text-[#8bc440]" />
            <span className="text-xl font-bold text-[#8bc440]">All stages complete</span>
            <span className="text-sm text-muted-foreground text-center">
              Every build stage has been ticked off.
            </span>
          </div>
        ) : (
          activeStages.map((stage, idx) => {
            const isComplete = completedStages.includes(stage.id);
            const isPending = pendingId === stage.id;
            const prevSection = idx > 0 ? activeStages[idx - 1].section : undefined;
            const showSectionHeader = stage.section && stage.section !== prevSection;
            return (
              <div key={stage.id}>
                {showSectionHeader && (
                  <div
                    className="pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                    data-testid={`section-header-${stage.section!.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {stage.section}
                  </div>
                )}
                <button
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-3 py-4 px-4 rounded-md text-left transition-all duration-150 active:scale-[0.99]",
                    isComplete && "bg-[#8bc440]/10",
                    isPending && "bg-amber-500/15 ring-2 ring-amber-400/60",
                    !isComplete && !isPending && "bg-muted/20"
                  )}
                  onClick={() => handleStagePress(stage.id)}
                  data-testid={`toggle-stage-${stage.id}`}
                >
                  {/* Status indicator */}
                  <span className="shrink-0">
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5 text-[#8bc440]" />
                    ) : isPending ? (
                      <CircleDot className="w-5 h-5 text-amber-400" />
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-muted-foreground/40 block" />
                    )}
                  </span>
                  <span
                    className={cn(
                      "flex-1 text-sm font-medium leading-snug",
                      isComplete ? "line-through text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {stage.label}
                    {isPending && (
                      <span className="ml-2 text-xs text-amber-400 font-normal">— tap Save to confirm</span>
                    )}
                  </span>
                  {isComplete && (
                    <Check className="w-4 h-4 text-[#8bc440] shrink-0" />
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Sticky Save confirmation */}
      {pendingId && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#191919] border-t border-amber-400/30 px-4 py-4 flex flex-col gap-2 max-w-lg mx-auto" data-testid="save-confirm-bar">
          <p className="text-xs text-amber-400 text-center font-medium truncate">
            {activeStages.find((s) => s.id === pendingId)?.label}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setPendingId(null)}
              data-testid="button-cancel-confirm"
            >
              Cancel
            </Button>
            <Button
              className="flex-2 bg-[#8bc440] text-[#191919] font-bold"
              onClick={handleConfirmSave}
              disabled={saveMutation.isPending}
              data-testid="button-save-confirm"
            >
              {saveMutation.isPending ? "Saving..." : "Save — Mark Complete"}
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      {!allDone && !pendingId && (
        <div className="border-t border-border/40 px-4 py-3 text-center text-xs text-muted-foreground">
          {doneCount} of {totalCount} stages complete
        </div>
      )}
    </div>
  );
}
