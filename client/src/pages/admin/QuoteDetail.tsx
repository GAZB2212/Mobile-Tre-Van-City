import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Save, 
  Upload,
  FileText,
  User as UserIcon,
  Truck,
  Wrench,
  DollarSign,
  Image as ImageIcon
} from "lucide-react";
import type { Quote } from "@shared/schema";
import BuildProgressTracker from "@/components/BuildProgressTracker";

const quoteStatuses = ["pending", "approved", "in_progress", "completed", "cancelled"] as const;
const financeStatuses = ["pending", "approved", "declined", "more_info_needed"] as const;
const buildStages = [
  "graphics",
  "electrical_systems",
  "accessories",
  "emergency_lighting",
  "tyre_equipment",
  "final_checks",
  "valet"
] as const;

export default function AdminQuoteDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [status, setStatus] = useState("");
  const [financeStatus, setFinanceStatus] = useState("");
  const [buildStage, setBuildStage] = useState("");
  const [artworkUrl, setArtworkUrl] = useState("");
  const [artworkNotes, setArtworkNotes] = useState("");

  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: [`/api/admin/quotes/${id}`],
    enabled: !!user?.isAdmin && !!id,
  });

  // Initialize form fields when quote loads
  useEffect(() => {
    if (quote) {
      setStatus(quote.status || "pending");
      setFinanceStatus(quote.financeStatus || "pending");
      setBuildStage(quote.buildStage || "");
      setArtworkUrl(quote.graphicsArtworkUrl || "");
      setArtworkNotes(quote.graphicsArtworkNotes || "");
    }
  }, [quote]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Quote>) => {
      return await apiRequest("PATCH", `/api/admin/quotes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({
        title: "Success",
        description: "Quote updated successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update quote",
      });
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Access Denied - Admin only</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading quote...</p>
        </div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Quote not found</p>
            <Button asChild variant="default" className="mt-4">
              <Link href="/admin/quotes">Back to Quotes</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSave = () => {
    updateMutation.mutate({
      status,
      financeStatus,
      buildStage: buildStage || null,
      graphicsArtworkUrl: artworkUrl || null,
      graphicsArtworkNotes: artworkNotes || null,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            asChild 
            className="mb-4"
            data-testid="button-back-to-quotes"
          >
            <Link href="/admin/quotes">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Quotes
            </Link>
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2" data-testid="text-quote-title">
                Quote #{quote.id.slice(0, 8).toUpperCase()}
              </h1>
              <p className="text-lg text-muted-foreground">
                Manage customer quote and build progress
              </p>
            </div>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              className="bg-accent hover:bg-accent/90"
              data-testid="button-save"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Quote Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Name</div>
                    <div className="text-base">{quote.userName}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Email</div>
                    <div className="text-base">{quote.email}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Phone</div>
                    <div className="text-base">{quote.phone}</div>
                  </div>
                  {quote.company && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Company</div>
                      <div className="text-base">{quote.company}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Build Progress Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="w-5 h-5" />
                  Build Stage Management
                </CardTitle>
                <CardDescription>
                  Update the current build stage to notify the customer of progress
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="build-stage">Current Build Stage</Label>
                  <Select value={buildStage} onValueChange={setBuildStage}>
                    <SelectTrigger id="build-stage" data-testid="select-build-stage">
                      <SelectValue placeholder="Select build stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Not Started</SelectItem>
                      {buildStages.map((stage) => (
                        <SelectItem key={stage} value={stage}>
                          {stage.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Visual Progress Preview */}
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-3">Customer's View:</div>
                  <BuildProgressTracker currentStage={buildStage || null} />
                </div>
              </CardContent>
            </Card>

            {/* Graphics Artwork Management */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Graphics Artwork
                </CardTitle>
                <CardDescription>
                  Upload artwork for customer review and approval
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="artwork-url">Artwork URL</Label>
                  <Input
                    id="artwork-url"
                    type="url"
                    placeholder="https://example.com/artwork.jpg"
                    value={artworkUrl}
                    onChange={(e) => setArtworkUrl(e.target.value)}
                    data-testid="input-artwork-url"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter the URL of the uploaded artwork image
                  </p>
                </div>

                {artworkUrl && (
                  <div>
                    <div className="text-sm font-medium mb-2">Preview</div>
                    <img
                      src={artworkUrl}
                      alt="Artwork preview"
                      className="w-full rounded-md border"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="artwork-notes">Notes for Customer</Label>
                  <Textarea
                    id="artwork-notes"
                    placeholder="Add notes or instructions for the customer..."
                    value={artworkNotes}
                    onChange={(e) => setArtworkNotes(e.target.value)}
                    rows={3}
                    data-testid="textarea-artwork-notes"
                  />
                </div>

                {quote.graphicsArtworkApproved && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="default">Approved by Customer</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quote Notes */}
            {quote.notes && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {quote.notes}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Status Management */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quote Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Quote Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="quote-status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="quote-status" data-testid="select-quote-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quoteStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Finance Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Finance Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="finance-status">Finance Application</Label>
                  <Select value={financeStatus} onValueChange={setFinanceStatus}>
                    <SelectTrigger id="finance-status" data-testid="select-finance-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {financeStatuses.map((fs) => (
                        <SelectItem key={fs} value={fs}>
                          {fs.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Price Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Price Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">
                    £{(quote.estSubtotal / 100).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT (20%)</span>
                  <span className="font-medium">
                    £{(quote.estVAT / 100).toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-accent">
                    £{(quote.estTotal / 100).toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
