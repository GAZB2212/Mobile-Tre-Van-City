import { useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Building2, CheckCircle2, XCircle, ExternalLink, Plug, PlugZap } from "lucide-react";
import type { User } from "@shared/schema";

export default function AdminSettings() {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const isFullAdmin = user?.adminRole === "full";

  const { data: sageStatus, isLoading: sageLoading } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/sage/status"],
    enabled: isFullAdmin,
  });

  const sageConnected = sageStatus?.connected ?? false;

  const disconnectSageMutation = useMutation({
    mutationFn: () => apiRequest("DELETE", "/api/sage/disconnect"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sage/status"] });
      toast({ title: "Sage disconnected", description: "Sage Business Cloud has been unlinked." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to disconnect Sage." });
    },
  });

  // Read ?sage= query param on mount and show a toast
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sageParam = params.get("sage");
    if (sageParam === "connected") {
      queryClient.invalidateQueries({ queryKey: ["/api/sage/status"] });
      toast({ title: "Sage connected", description: "Sage Business Cloud is now linked to your account." });
      setLocation("/admin/settings", { replace: true });
    } else if (sageParam === "error") {
      toast({ variant: "destructive", title: "Sage connection failed", description: "Something went wrong during authorisation. Please try again." });
      setLocation("/admin/settings", { replace: true });
    }
  }, []);

  if (!isFullAdmin) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground text-sm">You do not have permission to view this page.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage integrations and system configuration.</p>
      </div>

      <Separator />

      {/* Sage Business Cloud Accounting */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="text-base">Sage Business Cloud Accounting</CardTitle>
            </div>
            {!sageLoading && (
              sageConnected ? (
                <Badge
                  className="bg-[#8bc440]/15 text-[#8bc440] border-[#8bc440]/30 no-default-active-elevate"
                  variant="outline"
                  data-testid="badge-sage-status"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge
                  variant="outline"
                  className="text-muted-foreground no-default-active-elevate"
                  data-testid="badge-sage-status"
                >
                  <XCircle className="w-3 h-3 mr-1" />
                  Not connected
                </Badge>
              )
            )}
          </div>
          <CardDescription className="mt-1">
            Push completed quotes directly to Sage as sales invoices with one click from any quote detail page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sageConnected ? (
            <>
              <p className="text-sm text-muted-foreground">
                Your Sage account is linked. You can now push any quote to Sage from the quote detail page using the
                "Push to Sage" button.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("https://accounting.sage.com", "_blank")}
                  data-testid="button-open-sage"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Open Sage
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => disconnectSageMutation.mutate()}
                  disabled={disconnectSageMutation.isPending}
                  data-testid="button-disconnect-sage"
                >
                  <PlugZap className="w-3.5 h-3.5 mr-1.5" />
                  {disconnectSageMutation.isPending ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Connect your Sage Business Cloud Accounting account to enable one-click invoice creation from quotes.
                You will be redirected to Sage to authorise the connection.
              </p>
              <Button
                size="sm"
                className="bg-[#1c5f3a] text-white"
                onClick={() => { window.location.href = "/api/sage/auth"; }}
                data-testid="button-connect-sage"
              >
                <Plug className="w-3.5 h-3.5 mr-1.5" />
                Connect Sage
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
