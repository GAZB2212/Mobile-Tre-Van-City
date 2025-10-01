import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
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
  currentStage: string | null;
}

const buildStages = [
  { id: "graphics", label: "Graphics Design", icon: FileImage },
  { id: "electrical_systems", label: "Electrical Systems", icon: Zap },
  { id: "accessories", label: "Accessories", icon: Package },
  { id: "emergency_lighting", label: "Emergency Lighting", icon: AlertTriangle },
  { id: "tyre_equipment", label: "Tyre Equipment", icon: Cog },
  { id: "final_checks", label: "Final Checks", icon: Eye },
  { id: "valet", label: "Valet & Completion", icon: Sparkles },
];

export default function BuildProgressTracker({ currentStage }: BuildProgressTrackerProps) {
  if (!currentStage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Build Progress
          </CardTitle>
          <CardDescription>
            Your build will start soon
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Circle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              Build has not started yet. You'll see progress updates here once work begins.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentIndex = buildStages.findIndex(stage => stage.id === currentStage);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Build Progress
        </CardTitle>
        <CardDescription>
          Track your van conversion through each stage
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          {buildStages.map((stage, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isUpcoming = index > currentIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.id} className="relative">
                {/* Connecting line */}
                {index < buildStages.length - 1 && (
                  <div 
                    className={cn(
                      "absolute left-6 top-12 w-0.5 h-8 -ml-px",
                      isCompleted ? "bg-accent" : "bg-border"
                    )}
                  />
                )}

                {/* Stage row */}
                <div 
                  className={cn(
                    "flex items-start gap-4 py-3 px-3 rounded-md transition-colors",
                    isCurrent && "bg-accent/10"
                  )}
                  data-testid={`stage-${stage.id}`}
                >
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    {isCompleted ? (
                      <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
                        <CheckCircle className="w-6 h-6 text-accent" />
                      </div>
                    ) : isCurrent ? (
                      <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center animate-pulse">
                        <Icon className="w-6 h-6 text-accent-foreground" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                        <Icon className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 
                        className={cn(
                          "font-medium",
                          isCompleted && "text-muted-foreground",
                          isCurrent && "text-accent font-semibold",
                          isUpcoming && "text-muted-foreground"
                        )}
                      >
                        {stage.label}
                      </h4>
                      {isCurrent && (
                        <Badge variant="outline" className="text-xs" data-testid="badge-current-stage">
                          In Progress
                        </Badge>
                      )}
                      {isCompleted && (
                        <Badge variant="secondary" className="text-xs">
                          Complete
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Summary */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold">
              {currentIndex + 1} of {buildStages.length} stages
            </span>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${((currentIndex + 1) / buildStages.length) * 100}%` }}
              data-testid="progress-bar"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
