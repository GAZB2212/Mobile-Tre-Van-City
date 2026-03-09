import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Circle,
  Wrench,
  FileImage,
  Zap,
  Package,
  AlertTriangle,
  Cog,
  Eye,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BuildProgressTrackerProps {
  completedStages: string[];
}

export const BUILD_STAGES = [
  { id: "graphics", label: "Graphics Design", icon: FileImage },
  { id: "electrical_systems", label: "Electrical Systems", icon: Zap },
  { id: "accessories", label: "Accessories", icon: Package },
  { id: "emergency_lighting", label: "Emergency Lighting", icon: AlertTriangle },
  { id: "tyre_equipment", label: "Tyre Equipment", icon: Cog },
  { id: "final_checks", label: "Final Checks", icon: Eye },
  { id: "valet", label: "Valet & Completion", icon: Sparkles },
];

export default function BuildProgressTracker({ completedStages }: BuildProgressTrackerProps) {
  const completedCount = completedStages.length;
  const totalCount = BUILD_STAGES.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);
  const allDone = completedCount === totalCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Build Progress
        </CardTitle>
        <CardDescription>
          {allDone
            ? "All stages complete — van is ready"
            : completedCount === 0
            ? "Build has not started yet"
            : "Track progress through each build stage"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {BUILD_STAGES.map((stage) => {
            const isComplete = completedStages.includes(stage.id);
            const Icon = stage.icon;

            return (
              <div
                key={stage.id}
                className={cn(
                  "flex items-center gap-3 py-2.5 px-3 rounded-md",
                  isComplete ? "bg-accent/10" : "bg-muted/30"
                )}
                data-testid={`stage-${stage.id}`}
              >
                <div className="flex-shrink-0">
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-accent" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <Icon className={cn("w-4 h-4 flex-shrink-0", isComplete ? "text-accent" : "text-muted-foreground")} />
                <span
                  className={cn(
                    "flex-1 text-sm font-medium",
                    isComplete ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {stage.label}
                </span>
                {isComplete && (
                  <Badge variant="secondary" className="text-xs" data-testid={`badge-complete-${stage.id}`}>
                    Done
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold" data-testid="progress-percent">
              {progressPercent}% &mdash; {completedCount} of {totalCount} stages
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
              data-testid="progress-bar"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
