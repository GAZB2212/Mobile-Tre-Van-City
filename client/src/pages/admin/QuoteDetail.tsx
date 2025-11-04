import { useState, useEffect, useRef } from "react";
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
  Image as ImageIcon,
  X,
  Send,
  Percent,
  MessageSquare,
  Settings
} from "lucide-react";
import type { Quote, Van, Kit, Upgrade } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import BuildProgressTracker from "@/components/BuildProgressTracker";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const quoteStatuses = ["pending", "under_review", "awaiting_confirmation", "confirmed", "in_progress", "completed", "cancelled"] as const;
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
  const pendingArtworkPathRef = useRef<string | null>(null);
  
  const [status, setStatus] = useState("");
  const [financeStatus, setFinanceStatus] = useState("");
  const [buildStage, setBuildStage] = useState("");
  const [artworkUrl, setArtworkUrl] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed" | "">("");
  const [discountValue, setDiscountValue] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [confirmationUrl, setConfirmationUrl] = useState("");
  
  // Configuration state
  const [selectedVanId, setSelectedVanId] = useState<string | null>(null);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  const [selectedUpgradeIds, setSelectedUpgradeIds] = useState<string[]>([]);
  const [selectedUpgrades, setSelectedUpgrades] = useState<Record<string, number>>({});

  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: [`/api/admin/quotes/${id}`],
    enabled: !!user?.isAdmin && !!id,
  });

  const { data: vans = [] } = useQuery<Van[]>({
    queryKey: ["/api/admin/vans"],
    enabled: !!user?.isAdmin,
  });

  const { data: kits = [] } = useQuery<Kit[]>({
    queryKey: ["/api/admin/kits"],
    enabled: !!user?.isAdmin,
  });

  const { data: upgrades = [] } = useQuery<Upgrade[]>({
    queryKey: ["/api/admin/upgrades"],
    enabled: !!user?.isAdmin,
  });

  // Initialize form fields when quote loads
  useEffect(() => {
    if (quote) {
      setStatus(quote.status || "pending");
      setFinanceStatus(quote.financeStatus || "pending");
      setBuildStage(quote.buildStage || "");
      setArtworkUrl(quote.graphicsArtworkUrl || "");
      setDiscountType(quote.discountType as any || "");
      setDiscountValue(quote.discountValue ? String(quote.discountValue) : "");
      setAdminNotes(quote.adminNotes || "");
      setCustomerNotes(quote.customerNotes || "");
      setSelectedVanId(quote.vanId || null);
      setSelectedKitId(quote.kitId || null);
      setSelectedUpgradeIds(quote.selectedUpgradeIds || []);
      setSelectedUpgrades(quote.selectedUpgrades || {});
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

  const handleGetArtworkUploadParameters = async (file: { name: string; type: string }) => {
    const response = await apiRequest("POST", "/api/objects/upload", {
      filename: file.name,
      contentType: file.type,
    });
    
    const data = response as unknown as { uploadURL: string; objectPath: string };
    pendingArtworkPathRef.current = data.objectPath;
    
    return {
      method: "PUT" as const,
      url: data.uploadURL,
      objectPath: data.objectPath,
    };
  };

  const handleArtworkUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (result.successful && result.successful.length > 0 && pendingArtworkPathRef.current) {
      setArtworkUrl(pendingArtworkPathRef.current);
      pendingArtworkPathRef.current = null;
      toast({
        title: "Upload Complete",
        description: "Artwork uploaded successfully. Click 'Save Changes' to update the quote.",
      });
    }
  };

  const sendConfirmationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/quotes/${id}/send-confirmation`);
      return response as unknown as { confirmationUrl: string; token: string; emailSent: boolean };
    },
    onSuccess: (data) => {
      setConfirmationUrl(data.confirmationUrl);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({
        title: "Email Sent Successfully!",
        description: `Confirmation email sent to ${quote?.email}. The link is also available below for your reference.`,
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send confirmation email. Please try again.",
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

  const handleUpgradeToggle = (upgradeId: string, upgrade: Upgrade) => {
    const isSelected = selectedUpgradeIds.includes(upgradeId);
    
    if (isSelected) {
      // Remove upgrade
      setSelectedUpgradeIds(selectedUpgradeIds.filter(id => id !== upgradeId));
      const newUpgrades = { ...selectedUpgrades };
      delete newUpgrades[upgradeId];
      setSelectedUpgrades(newUpgrades);
    } else {
      // Add upgrade
      setSelectedUpgradeIds([...selectedUpgradeIds, upgradeId]);
      if (upgrade.allowQuantity) {
        setSelectedUpgrades({ ...selectedUpgrades, [upgradeId]: 1 });
      }
    }
  };

  const handleQuantityChange = (upgradeId: string, quantity: number) => {
    if (quantity < 1) return;
    setSelectedUpgrades({ ...selectedUpgrades, [upgradeId]: quantity });
  };

  const recalculatePricing = () => {
    const selectedVan = vans.find(v => v.id === selectedVanId);
    const selectedKit = kits.find(k => k.id === selectedKitId);
    
    let subtotal = 0;
    
    // Add van price
    if (selectedVan) {
      subtotal += selectedVan.price;
    }
    
    // Add kit price
    if (selectedKit) {
      subtotal += selectedKit.price;
    }
    
    // Add upgrades prices
    selectedUpgradeIds.forEach(upgradeId => {
      const upgrade = upgrades.find(u => u.id === upgradeId);
      if (upgrade) {
        const quantity = selectedUpgrades[upgradeId] || 1;
        subtotal += upgrade.price * quantity;
      }
    });
    
    return subtotal;
  };

  const handleSave = () => {
    const updates: any = {
      status,
      financeStatus,
      buildStage: buildStage || null,
      graphicsArtworkUrl: artworkUrl || null,
      discountType: discountType || null,
      discountValue: discountValue ? parseInt(discountValue) : null,
      adminNotes: adminNotes || null,
      customerNotes: customerNotes || null,
      selectedUpgradeIds,
      selectedUpgrades,
    };
    
    // Explicitly include null values for van and kit to allow clearing
    updates.vanId = selectedVanId;
    updates.kitId = selectedKitId;
    
    updateMutation.mutate(updates);
  };

  const calculateAdjustedPrice = () => {
    if (!quote) return { subtotal: 0, discount: 0, subtotalAfterDiscount: 0, vat: 0, total: 0 };

    let subtotal = quote.estSubtotal;
    let discountAmount = 0;

    if (discountType && discountValue) {
      const value = parseInt(discountValue);
      if (discountType === "percentage") {
        discountAmount = Math.round((subtotal * value) / 100);
      } else if (discountType === "fixed") {
        discountAmount = value;
      }
    }

    const subtotalAfterDiscount = subtotal - discountAmount;
    const vat = Math.round(subtotalAfterDiscount * 0.2);
    const total = subtotalAfterDiscount + vat;

    return {
      subtotal,
      discount: discountAmount,
      subtotalAfterDiscount,
      vat,
      total
    };
  };

  const pricing = calculateAdjustedPrice();

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

            {/* Configuration Editor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Edit Configuration
                </CardTitle>
                <CardDescription>
                  Modify the van, kit, and equipment selections
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Van Selection */}
                <div>
                  <Label htmlFor="van-select">Van</Label>
                  <Select value={selectedVanId || "none"} onValueChange={(v) => setSelectedVanId(v === "none" ? null : v)}>
                    <SelectTrigger id="van-select" data-testid="select-van">
                      <SelectValue placeholder="Select van" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No van selected</SelectItem>
                      {vans.filter(v => v.published).map((van) => (
                        <SelectItem key={van.id} value={van.id}>
                          {van.year} {van.make} {van.model} - £{(van.price / 100).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Kit Selection */}
                <div>
                  <Label htmlFor="kit-select">Equipment Kit</Label>
                  <Select value={selectedKitId || "none"} onValueChange={(v) => setSelectedKitId(v === "none" ? null : v)}>
                    <SelectTrigger id="kit-select" data-testid="select-kit">
                      <SelectValue placeholder="Select kit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No kit selected</SelectItem>
                      {kits.filter(k => k.published).map((kit) => (
                        <SelectItem key={kit.id} value={kit.id}>
                          {kit.name} - £{(kit.price / 100).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Upgrades Selection */}
                <div>
                  <Label>Equipment & Upgrades</Label>
                  <div className="mt-2 space-y-3 max-h-96 overflow-y-auto border rounded-md p-4">
                    {upgrades.filter(u => u.published && !u.parentId).map((upgrade) => {
                      const isSelected = selectedUpgradeIds.includes(upgrade.id);
                      const quantity = selectedUpgrades[upgrade.id] || 1;
                      
                      return (
                        <div key={upgrade.id} className="flex items-start gap-3">
                          <Checkbox
                            id={`upgrade-${upgrade.id}`}
                            checked={isSelected}
                            onCheckedChange={() => handleUpgradeToggle(upgrade.id, upgrade)}
                            data-testid={`checkbox-upgrade-${upgrade.id}`}
                          />
                          <div className="flex-1">
                            <label
                              htmlFor={`upgrade-${upgrade.id}`}
                              className="text-sm font-medium cursor-pointer"
                            >
                              {upgrade.name} - £{(upgrade.price / 100).toLocaleString()}
                            </label>
                            {upgrade.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {upgrade.description}
                              </p>
                            )}
                            {isSelected && upgrade.allowQuantity && (
                              <div className="flex items-center gap-2 mt-2">
                                <Label htmlFor={`qty-${upgrade.id}`} className="text-xs">
                                  Quantity:
                                </Label>
                                <Input
                                  id={`qty-${upgrade.id}`}
                                  type="number"
                                  min="1"
                                  value={quantity}
                                  onChange={(e) => handleQuantityChange(upgrade.id, parseInt(e.target.value))}
                                  className="w-20 h-8 text-sm"
                                  data-testid={`input-quantity-${upgrade.id}`}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Selected: {selectedUpgradeIds.length} items
                  </p>
                </div>

                {/* Pricing Preview */}
                <div className="pt-4 border-t">
                  <div className="text-sm font-medium mb-2">Updated Pricing:</div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal:</span>
                      <span className="font-medium">£{(recalculatePricing() / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VAT (20%):</span>
                      <span className="font-medium">£{(Math.round(recalculatePricing() * 0.2) / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t">
                      <span className="font-semibold">Total:</span>
                      <span className="font-semibold">£{((recalculatePricing() + Math.round(recalculatePricing() * 0.2)) / 100).toLocaleString()}</span>
                    </div>
                  </div>
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
                  <Select value={buildStage || "not_started"} onValueChange={(value) => setBuildStage(value === "not_started" ? "" : value)}>
                    <SelectTrigger id="build-stage" data-testid="select-build-stage">
                      <SelectValue placeholder="Select build stage" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="not_started">Not Started</SelectItem>
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
                  <Label>Upload Artwork</Label>
                  {!artworkUrl ? (
                    <div className="pt-2">
                      <ObjectUploader
                        maxNumberOfFiles={1}
                        maxFileSize={20 * 1024 * 1024}
                        allowedFileTypes={['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml']}
                        onGetUploadParameters={handleGetArtworkUploadParameters}
                        onComplete={handleArtworkUploadComplete}
                        buttonClassName="w-full"
                      >
                        <div className="flex items-center justify-center gap-2" data-testid="button-upload-artwork">
                          <Upload className="w-4 h-4" />
                          <span>Upload Artwork</span>
                        </div>
                      </ObjectUploader>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2">
                      <div className="relative rounded-md border overflow-hidden">
                        <img
                          src={artworkUrl}
                          alt="Artwork preview"
                          className="w-full"
                          data-testid="img-artwork-preview"
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EFailed to load%3C/text%3E%3C/svg%3E";
                          }}
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={() => setArtworkUrl("")}
                          data-testid="button-remove-artwork"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload artwork for the customer to review (PNG, JPEG, SVG - max 20MB)
                  </p>
                </div>

                {quote.graphicsArtworkApproved && (
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="default">Approved by Customer</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Customer Logos */}
            {quote.customerLogoUrls && quote.customerLogoUrls.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5" />
                    Customer Logos & Graphics
                  </CardTitle>
                  <CardDescription>
                    Logos and graphics uploaded by the customer for van wrapping
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {quote.customerLogoUrls.map((logoPath, index) => (
                      <div 
                        key={index} 
                        className="aspect-square bg-muted rounded-md overflow-hidden border"
                        data-testid={`container-customer-logo-${index}`}
                      >
                        <img
                          src={logoPath}
                          alt={`Customer logo ${index + 1}`}
                          className="w-full h-full object-contain p-2"
                          data-testid={`img-customer-logo-${index}`}
                          onError={(e) => {
                            e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23999'%3EFailed to load%3C/text%3E%3C/svg%3E";
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

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

            {/* Discount */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="w-5 h-5" />
                  Apply Discount
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="discount-type">Discount Type</Label>
                  <Select value={discountType || "none"} onValueChange={(value: any) => setDiscountType(value === "none" ? "" : value)}>
                    <SelectTrigger id="discount-type" data-testid="select-discount-type">
                      <SelectValue placeholder="No discount" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No discount</SelectItem>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {discountType && (
                  <div>
                    <Label htmlFor="discount-value">
                      {discountType === "percentage" ? "Percentage" : "Amount (in pence)"}
                    </Label>
                    <Input
                      id="discount-value"
                      type="number"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percentage" ? "e.g., 10" : "e.g., 50000"}
                      data-testid="input-discount-value"
                    />
                    {discountType === "fixed" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter amount in pence (e.g., 50000 = £500)
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Internal Notes
                </CardTitle>
                <CardDescription>Only visible to staff</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes for staff..."
                  rows={3}
                  data-testid="textarea-admin-notes"
                />
              </CardContent>
            </Card>

            {/* Customer Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Customer Notes
                </CardTitle>
                <CardDescription>Shown to customer in confirmation</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="Add notes for the customer..."
                  rows={4}
                  data-testid="textarea-customer-notes"
                />
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
                    £{(pricing.subtotal / 100).toLocaleString()}
                  </span>
                </div>
                {pricing.discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm text-accent">
                      <span className="font-medium">
                        Discount {discountType === "percentage" ? `(${discountValue}%)` : ""}
                      </span>
                      <span className="font-medium">
                        -£{(pricing.discount / 100).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal After Discount</span>
                      <span className="font-medium">
                        £{(pricing.subtotalAfterDiscount / 100).toLocaleString()}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT (20%)</span>
                  <span className="font-medium">
                    £{(pricing.vat / 100).toLocaleString()}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total</span>
                  <span className="text-2xl font-bold text-accent">
                    £{(pricing.total / 100).toLocaleString()}
                  </span>
                </div>
                {pricing.discount > 0 && (
                  <div className="text-xs text-muted-foreground text-center pt-2">
                    Original: £{(quote.estTotal / 100).toLocaleString()}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Send Confirmation Email */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Send to Customer
                </CardTitle>
                <CardDescription>
                  Email confirmation link to customer automatically
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={() => sendConfirmationMutation.mutate()}
                  disabled={sendConfirmationMutation.isPending}
                  className="w-full"
                  data-testid="button-send-confirmation"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendConfirmationMutation.isPending ? "Sending Email..." : "Send Confirmation Email"}
                </Button>
                
                {(confirmationUrl || quote.confirmationToken) && (
                  <div className="space-y-2">
                    <Label>Confirmation Link (Reference)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={confirmationUrl || `${window.location.origin}/quote/confirm/${quote.confirmationToken}`}
                        readOnly
                        className="font-mono text-xs"
                        data-testid="input-confirmation-url"
                      />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(confirmationUrl || `${window.location.origin}/quote/confirm/${quote.confirmationToken}`);
                          toast({
                            title: "Copied!",
                            description: "Link copied to clipboard",
                          });
                        }}
                        data-testid="button-copy-link"
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Email already sent to customer. This link is for your reference.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
