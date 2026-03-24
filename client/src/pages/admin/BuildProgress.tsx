import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface BuildProgressData {
  id: string;
  userName: string;
  status: string;
  customBuildStages: Array<{ id: string; label: string; section?: string }> | null;
  completedBuildStages: string[];
  kit: { id: string; name: string } | null;
  upgrades: Array<{ id: string; name: string; category: string }>;
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
    const stages: Array<{ id: string; label: string; section?: string }> = [];
    stages.push({ id: "prep", label: "Van Preparation" });
    if (kit) {
      stages.push({ id: "kit", label: `Install ${kit.name}` });
    }
    const wrapGraphicsPattern = /wrap|graphics|livery/i;
    const interiorWallPattern = /interior.wall/i;
    const isInteriorWall = (u: { name: string; category: string }) =>
      interiorWallPattern.test(u.name) || interiorWallPattern.test(u.category);
    const isWrapGraphics = (u: { name: string; category: string }) =>
      wrapGraphicsPattern.test(u.name) || wrapGraphicsPattern.test(u.category);
    const nonWrap = upgrades.filter((u) => !isWrapGraphics(u) && !isInteriorWall(u));
    const wrap = upgrades.filter((u) => isWrapGraphics(u) && !isInteriorWall(u));
    const wallUpgrades = upgrades.filter((u) => isInteriorWall(u) && !isWrapGraphics(u));
    for (const u of nonWrap) stages.push({ id: `upg_${u.id}`, label: u.name });
    if (wrap.length > 0) {
      stages.push({ id: "artwork_sent", label: "Artwork Sent", section: "Design Work" });
      stages.push({ id: "artwork_approved", label: "Artwork Approved", section: "Design Work" });
      stages.push({ id: "wrap_printed", label: "Wrap Printed", section: "Design Work" });
    }
    for (const u of wrap) stages.push({ id: `upg_${u.id}`, label: u.name });
    if (wallUpgrades.length > 0) {
      stages.push({ id: "interior_walls_artwork_sent", label: "Interior Walls Artwork Sent", section: "Design Work" });
      stages.push({ id: "interior_wall_artwork_approved", label: "Interior Wall Artwork Approved", section: "Design Work" });
      stages.push({ id: "interior_walls_ordered", label: "Interior Walls Ordered", section: "Design Work" });
    }
    for (const u of wallUpgrades) stages.push({ id: `upg_${u.id}`, label: u.name });
    stages.push({ id: "final_checks", label: "Final Checks" });
    stages.push({ id: "valet", label: "Valet & Handover" });
    return stages;
  };

  const activeStages: Array<{ id: string; label: string; section?: string }> = data
    ? (Array.isArray(data.customBuildStages) && data.customBuildStages.length > 0
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
      toast({ title: "Save failed", description: "Could not save the update. Please try again.", variant: "destructive" });
    },
  });

  const handleToggle = (stageId: string, checked: boolean) => {
    const updated = checked
      ? [...completedStages, stageId]
      : completedStages.filter((s) => s !== stageId);
    setCompletedStages(updated);
    saveMutation.mutate(updated);
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
      {/* Locked header — no navigation */}
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
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 max-w-lg mx-auto w-full">
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
                    "w-full flex items-center gap-3 py-3 px-4 rounded-md text-left transition-colors",
                    isComplete ? "bg-[#8bc440]/10" : "bg-muted/20"
                  )}
                  onClick={() => handleToggle(stage.id, !isComplete)}
                  data-testid={`toggle-stage-${stage.id}`}
                >
                  <Checkbox
                    checked={isComplete}
                    onCheckedChange={(checked) => handleToggle(stage.id, !!checked)}
                    className="pointer-events-none shrink-0"
                    data-testid={`checkbox-stage-${stage.id}`}
                  />
                  <span
                    className={cn(
                      "flex-1 text-sm font-medium",
                      isComplete ? "line-through text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {stage.label}
                  </span>
                  {isComplete && (
                    <Badge variant="secondary" className="text-xs shrink-0">Done</Badge>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer */}
      {!allDone && (
        <div className="border-t border-border/40 px-4 py-3 text-center text-xs text-muted-foreground">
          {doneCount} of {totalCount} stages complete — saves automatically
        </div>
      )}
    </div>
  );
}
