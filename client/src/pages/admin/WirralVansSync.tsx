import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Download, CheckCircle, XCircle, Link as LinkIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

interface WirralVan {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  mileage: number;
  price: number;
  vatIncluded: boolean;
  slug: string;
  images?: string[];
  heroImage?: string;
  specs: {
    transmission: string;
    size: string;
    fuel: string;
  };
}

export default function WirralVansSync() {
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [selectedVans, setSelectedVans] = useState<Set<string>>(new Set());

  // Fetch Wirral Vans
  const { data: wirralVans = [], isLoading: isLoadingVans, refetch } = useQuery<WirralVan[]>({
    queryKey: ['/api/admin/wirral-vans/available'],
    enabled: false, // Don't auto-fetch, only when user clicks
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/wirral-vans/test-connection', {});
    },
    onSuccess: () => {
      toast({
        title: "Connection successful",
        description: "Successfully connected to Wirral Vans API",
      });
    },
    onError: () => {
      toast({
        title: "Connection failed",
        description: "Could not connect to Wirral Vans API. Check your settings.",
        variant: "destructive",
      });
    },
  });

  // Import vans mutation
  const importVansMutation = useMutation({
    mutationFn: async (vanIds: string[]) => {
      return apiRequest('POST', '/api/admin/wirral-vans/import', { vanIds });
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/vans'] });
      setSelectedVans(new Set());
      toast({
        title: "Import successful",
        description: `Imported ${response.imported} van(s) successfully`,
      });
    },
    onError: () => {
      toast({
        title: "Import failed",
        description: "Failed to import vans from Wirral Vans",
        variant: "destructive",
      });
    },
  });

  const handleFetchVans = async () => {
    setIsTestingConnection(true);
    try {
      await refetch();
      toast({
        title: "Vans loaded",
        description: "Successfully loaded available vans from Wirral Vans",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load vans from Wirral Vans",
        variant: "destructive",
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const toggleVanSelection = (vanId: string) => {
    const newSelection = new Set(selectedVans);
    if (newSelection.has(vanId)) {
      newSelection.delete(vanId);
    } else {
      newSelection.add(vanId);
    }
    setSelectedVans(newSelection);
  };

  const handleImportSelected = () => {
    if (selectedVans.size === 0) {
      toast({
        title: "No vans selected",
        description: "Please select at least one van to import",
        variant: "destructive",
      });
      return;
    }
    importVansMutation.mutate(Array.from(selectedVans));
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="sm" data-testid="button-back-admin">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Wirral Vans Integration</h1>
          <p className="text-muted-foreground">
            Import vans from your Wirral Vans site
          </p>
        </div>

        {/* Connection Settings */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Connection Settings
            </CardTitle>
            <CardDescription>
              Configure your connection to the Wirral Vans API
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Wirral Vans API URL</Label>
              <p className="text-sm text-muted-foreground">
                Set the environment variable <code className="bg-muted px-1 py-0.5 rounded">WIRRAL_VANS_API_URL</code> to your Wirral Vans site URL
              </p>
              <p className="text-xs text-muted-foreground">
                Example: https://your-wirral-vans-site.replit.app
              </p>
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <p className="text-sm text-muted-foreground">
                Set the environment variable <code className="bg-muted px-1 py-0.5 rounded">WIRRAL_VANS_API_KEY</code> to secure the connection
              </p>
            </div>

            <Button
              onClick={() => testConnectionMutation.mutate()}
              disabled={testConnectionMutation.isPending}
              data-testid="button-test-connection"
            >
              {testConnectionMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Available Vans */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Available Vans from Wirral Vans</CardTitle>
                <CardDescription>
                  Select vans to import into this site
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleFetchVans}
                  disabled={isTestingConnection}
                  data-testid="button-fetch-vans"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Fetch Vans
                    </>
                  )}
                </Button>
                {selectedVans.size > 0 && (
                  <Button
                    onClick={handleImportSelected}
                    disabled={importVansMutation.isPending}
                    data-testid="button-import-selected"
                  >
                    {importVansMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        Import Selected ({selectedVans.size})
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoadingVans ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-accent" />
              </div>
            ) : wirralVans.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No vans available. Click "Fetch Vans" to load from Wirral Vans.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wirralVans.map((van) => (
                  <Card
                    key={van.id}
                    className={`cursor-pointer transition-all ${
                      selectedVans.has(van.id)
                        ? "ring-2 ring-accent bg-accent/5"
                        : "hover-elevate"
                    }`}
                    onClick={() => toggleVanSelection(van.id)}
                    data-testid={`card-wirral-van-${van.id}`}
                  >
                    {van.heroImage && (
                      <div className="aspect-video overflow-hidden">
                        <img
                          src={van.heroImage}
                          alt={van.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold">{van.make} {van.model}</h3>
                          <p className="text-sm text-muted-foreground">{van.year}</p>
                        </div>
                        {selectedVans.has(van.id) && (
                          <Badge variant="default" className="bg-accent">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Selected
                          </Badge>
                        )}
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Price:</span>
                          <span className="font-medium">£{(van.price / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Mileage:</span>
                          <span>{van.mileage.toLocaleString()} mi</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Transmission:</span>
                          <span>{van.specs.transmission}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
