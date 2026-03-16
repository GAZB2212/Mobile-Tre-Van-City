import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useParams, Link, useLocation } from "wouter";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { 
  ArrowLeft, 
  Save, 
  Upload,
  FileText,
  User as UserIcon,
  Truck,
  Wrench,
  PoundSterling,
  Image as ImageIcon,
  X,
  Send,
  Percent,
  MessageSquare,
  Settings,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  CheckCircle2,
  Pencil,
  Trash2,
  Check,
  XCircle,
  Calculator,
  Plus,
  RefreshCw
} from "lucide-react";
import type { Quote, Van, Kit, Upgrade } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { upgradeCategories } from "@shared/schema";
import BuildProgressTracker from "@/components/BuildProgressTracker";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Helper to transform upgrades with variations
interface UpgradeGroup {
  parent: Upgrade;
  variants: Upgrade[];
}

function groupUpgradeVariations(upgrades: Upgrade[]): { groups: UpgradeGroup[]; standalone: Upgrade[] } {
  const groups: UpgradeGroup[] = [];
  const standalone: Upgrade[] = [];
  
  const parentIds = new Set<string>();
  const childIds = new Set<string>();
  
  upgrades.forEach(upgrade => {
    if (upgrade.parentId) {
      childIds.add(upgrade.id);
      parentIds.add(upgrade.parentId);
    }
  });
  
  const parentMap = new Map<string, UpgradeGroup>();
  upgrades.forEach(upgrade => {
    if (upgrade.parentId) {
      let group = parentMap.get(upgrade.parentId);
      if (!group) {
        const parent = upgrades.find(u => u.id === upgrade.parentId);
        if (parent) {
          group = { parent, variants: [] };
          parentMap.set(upgrade.parentId, group);
        }
      }
      if (group) {
        group.variants.push(upgrade);
      }
    }
  });
  
  upgrades.forEach(upgrade => {
    if (!upgrade.parentId && !parentIds.has(upgrade.id)) {
      standalone.push(upgrade);
    }
  });
  
  return {
    groups: Array.from(parentMap.values())
      .map(g => ({
        ...g,
        variants: g.variants.sort((a, b) => a.sortOrder - b.sortOrder)
      }))
      .sort((a, b) => a.parent.sortOrder - b.parent.sortOrder),
    standalone: standalone.sort((a, b) => a.sortOrder - b.sortOrder)
  };
}

const quoteStatuses = [
  "new", "contacted", "awaiting_deposit", "awaiting_finance",
  "deposit_taken", "finance_approved", "in_build", "completed", "cancelled"
] as const;

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  awaiting_deposit: "Awaiting Deposit",
  awaiting_finance: "Finance Submitted",
  deposit_taken: "Deposit Taken",
  finance_approved: "Finance Approved",
  in_build: "In Build",
  completed: "Completed",
  cancelled: "Cancelled",
};


export default function AdminQuoteDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const canEdit = user?.adminRole === "full";
  
  const [status, setStatus] = useState("");
  const [completedBuildStages, setCompletedBuildStages] = useState<string[]>([]);
  const [customBuildStages, setCustomBuildStages] = useState<Array<{id: string; label: string}> | null>(null);
  const [newStageName, setNewStageName] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed" | "">("");
  const [discountValue, setDiscountValue] = useState("");
  const [newAdminNote, setNewAdminNote] = useState("");
  const [customerConfirmed, setCustomerConfirmed] = useState(false);
  const [vanRegistration, setVanRegistration] = useState("");
  const [vanMileage, setVanMileage] = useState("");
  
  // Note editing state - stores { noteType, timestamp, text } when editing a note
  const [editingNote, setEditingNote] = useState<{ noteType: 'admin' | 'customer'; timestamp: string; text: string } | null>(null);
  
  // Configuration state
  const [selectedVanId, setSelectedVanId] = useState<string | null>(null);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);
  const [selectedUpgradeIds, setSelectedUpgradeIds] = useState<string[]>([]);
  const [selectedUpgrades, setSelectedUpgrades] = useState<Record<string, number>>({});
  
  // Track originally selected items from customer's quote (for highlighting)
  const [originalUpgradeIds, setOriginalUpgradeIds] = useState<string[]>([]);
  
  // Track original configuration values to detect changes
  const [originalVanId, setOriginalVanId] = useState<string | null>(null);
  const [originalKitId, setOriginalKitId] = useState<string | null>(null);
  const [originalSelectedUpgradeIds, setOriginalSelectedUpgradeIds] = useState<string[]>([]);
  const [originalSelectedUpgrades, setOriginalSelectedUpgrades] = useState<Record<string, number>>({});
  
  // Configuration editor collapse state
  const [isConfigEditorOpen, setIsConfigEditorOpen] = useState(true);

  // Customer info inline edit state
  const [editingCustomer, setEditingCustomer] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerEmail, setEditCustomerEmail] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [editCustomerCompany, setEditCustomerCompany] = useState("");

  // Active detail tab
  const [activeTab, setActiveTab] = useState<"overview" | "configuration" | "finance" | "build" | "notes">("overview");

  // Unsaved-changes guard (all tabs + back navigation)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingTabRef = useRef<string | null>(null);
  const pendingNavRef = useRef<string | null>(null);

  // Finance editor state (deposit in £ pounds, term in years 1-5)
  const [editorDepositAmount, setEditorDepositAmount] = useState<string>("");
  const [editorTermYears, setEditorTermYears] = useState<number>(3);

  // Service type (car / commercial / hybrid) — determines customer's path
  const [serviceType, setServiceType] = useState<"car" | "commercial" | "hybrid" | null>(null);

  // Custom van state (for vans not in the system)
  const [customVanDescription, setCustomVanDescription] = useState<string>("");
  const [customVanValue, setCustomVanValue] = useState<string>("");

  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: [`/api/admin/quotes/${id}`],
    enabled: !!(user?.adminRole && user.adminRole !== "none") && !!id,
  });

  const { data: vans = [] } = useQuery<Van[]>({
    queryKey: ["/api/admin/vans"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const { data: kits = [] } = useQuery<Kit[]>({
    queryKey: ["/api/admin/kits"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  const { data: upgrades = [] } = useQuery<Upgrade[]>({
    queryKey: ["/api/admin/upgrades"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });

  // Initialize form fields when quote loads
  useEffect(() => {
    if (quote) {
      setStatus(quote.status || "new");
      setCompletedBuildStages(Array.isArray(quote.completedBuildStages) ? quote.completedBuildStages : []);
      setCustomBuildStages(Array.isArray(quote.customBuildStages) ? quote.customBuildStages : null);
      setCustomerConfirmed(quote.customerConfirmed ?? false);
      setVanRegistration(quote.vanRegistration ?? "");
      setVanMileage(quote.vanMileage !== null && quote.vanMileage !== undefined ? String(quote.vanMileage) : "");
      setDiscountType(quote.discountType as any || "");
      // Convert discount from pence to pounds for fixed amounts
      if (quote.discountValue) {
        if (quote.discountType === "fixed") {
          setDiscountValue(String(quote.discountValue / 100));
        } else {
          setDiscountValue(String(quote.discountValue));
        }
      } else {
        setDiscountValue("");
      }
      // Notes are now in history format, no need to set them here
      
      // Initialize service type
      setServiceType((quote.serviceType as any) ?? null);

      // Initialize custom van fields
      // Fall back to registration number if no description entered yet (e.g. submitted via configurator)
      setCustomVanDescription(quote.customVanDescription ?? quote.vanRegistration ?? "");
      setCustomVanValue(quote.customVanValue !== null && quote.customVanValue !== undefined ? String(quote.customVanValue / 100) : "");

      // Set current configuration — use "custom" sentinel when no system van but custom details exist
      // Also detect custom van when only customVanValue or vanRegistration is set (e.g. from configurator flow)
      setSelectedVanId(quote.vanId || (quote.customVanDescription || quote.customVanValue || quote.vanRegistration ? "custom" : null));
      setSelectedKitId(quote.kitId || null);
      setSelectedUpgradeIds(quote.selectedUpgradeIds || []);
      setSelectedUpgrades(quote.selectedUpgrades || {});
      setOriginalUpgradeIds(quote.selectedUpgradeIds || []);
      
      // Store original configuration for change detection
      // Mirror the "custom" sentinel used by selectedVanId so dirty-check works correctly for custom vans
      setOriginalVanId(quote.vanId || (quote.customVanDescription || quote.customVanValue || quote.vanRegistration ? "custom" : null));
      setOriginalKitId(quote.kitId || null);
      setOriginalSelectedUpgradeIds(quote.selectedUpgradeIds || []);
      setOriginalSelectedUpgrades(quote.selectedUpgrades || {});

      // Initialize finance editor (deposit stored in pence, convert to £; term stored in months, convert to years)
      const depositPence = quote.financeInputs?.deposit;
      setEditorDepositAmount(depositPence !== undefined && depositPence !== null ? String(depositPence / 100) : "");
      const termMonths = quote.financeInputs?.term;
      setEditorTermYears(termMonths ? Math.round(termMonths / 12) : 3);
    }
  }, [quote]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Quote>) => {
      return await apiRequest("PATCH", `/api/admin/quotes/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      // Clear note inputs after successful save
      setNewAdminNote("");
      toast({
        title: "Success",
        description: "Quote updated successfully",
      });
      // If save was triggered by the unsaved-changes dialog, navigate to the pending tab or page
      if (pendingTabRef.current) {
        setActiveTab(pendingTabRef.current as any);
        pendingTabRef.current = null;
      }
      if (pendingNavRef.current) {
        setLocation(pendingNavRef.current);
        pendingNavRef.current = null;
      }
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update quote",
      });
    },
  });

  const sendConfirmationMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/admin/quotes/${id}/send-confirmation`);
      return response as unknown as { emailSent: boolean };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${id}`] });
      toast({
        title: "Spec Summary Sent",
        description: `Configuration summary emailed to ${quote?.email}.`,
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send summary email. Please try again.",
      });
    },
  });

  const { data: siteSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/site-settings"],
  });
  const [financeEmailOverride, setFinanceEmailOverride] = useState("");
  const defaultFinanceEmail = siteSettings?.finance_company_email ?? "stephen.quinn@jigsawfinance.com";
  const financeEmail = financeEmailOverride || defaultFinanceEmail;

  const saveFinanceEmailMutation = useMutation({
    mutationFn: async (email: string) => {
      return await apiRequest("PUT", `/api/admin/site-settings/finance_company_email`, { value: email });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      setFinanceEmailOverride("");
      toast({ title: "Finance email saved", description: "Default finance company email updated." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to save finance email." });
    },
  });

  const sendFinanceMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/admin/quotes/${id}/send-finance`, {
        vanRegistration: vanRegistration.trim() || null,
        vanMileage: vanMileage.trim() ? parseInt(vanMileage.trim()) : null,
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({
        title: "Sent to Finance Company",
        description: `Application emailed to ${data?.sentTo ?? "the finance company"}.`,
      });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to send finance email." });
    },
  });

  const saveFinanceMutation = useMutation({
    mutationFn: async () => {
      const depositPence = editorDepositAmount !== "" ? Math.round(parseFloat(editorDepositAmount) * 100) : 0;
      const termMonths = editorTermYears * 12;
      return await apiRequest("PATCH", `/api/admin/quotes/${id}`, {
        financePlanId: null,
        financeInputs: {
          deposit: depositPence,
          term: termMonths,
          balloon: 0,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${id}`] });
      toast({ title: "Finance updated", description: "Finance settings saved." });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to save finance settings." });
    },
  });

  const quickStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      return await apiRequest("PATCH", `/api/admin/quotes/${id}`, { status: newStatus });
    },
    onSuccess: (_, newStatus) => {
      setStatus(newStatus);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({ title: "Status updated", description: `Moved to: ${STATUS_LABELS[newStatus] ?? newStatus}` });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    },
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/admin/quotes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/quotes"] });
      toast({
        title: "Quote Deleted",
        description: "The quote has been permanently deleted.",
      });
      setLocation("/admin/quotes");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete quote. Please try again.",
      });
    },
  });

  const editNoteMutation = useMutation({
    mutationFn: async (data: { noteType: 'admin' | 'customer'; timestamp: string; text: string }) => {
      return await apiRequest("PATCH", `/api/admin/quotes/${id}/notes`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${id}`] });
      setEditingNote(null);
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update note",
      });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (data: { noteType: 'admin' | 'customer'; timestamp: string }) => {
      return await apiRequest("DELETE", `/api/admin/quotes/${id}/notes`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${id}`] });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete note",
      });
    },
  });

  // Detect unsaved changes across ALL saveable fields (every tab)
  // Computed before early returns so the useEffect below is never conditionally called
  const isDirty = quote ? (() => {
    if (selectedVanId !== (originalVanId ?? null)) return true;
    if (selectedKitId !== (originalKitId ?? null)) return true;
    if (JSON.stringify([...selectedUpgradeIds].sort()) !== JSON.stringify([...originalSelectedUpgradeIds].sort())) return true;
    if (JSON.stringify(selectedUpgrades) !== JSON.stringify(originalSelectedUpgrades)) return true;
    if (serviceType !== ((quote.serviceType as any) ?? null)) return true;
    if (status !== (quote.status || "new")) return true;
    if (discountType !== (quote.discountType || "")) return true;
    const origDiscountValue = quote.discountValue
      ? (quote.discountType === "fixed" ? String(quote.discountValue / 100) : String(quote.discountValue))
      : "";
    if (discountValue !== origDiscountValue) return true;
    if (vanRegistration !== (quote.vanRegistration ?? "")) return true;
    if (vanMileage !== (quote.vanMileage !== null && quote.vanMileage !== undefined ? String(quote.vanMileage) : "")) return true;
    if (customerConfirmed !== (quote.customerConfirmed ?? false)) return true;
    if (JSON.stringify([...completedBuildStages].sort()) !== JSON.stringify([...(quote.completedBuildStages || [])].sort())) return true;
    if (newAdminNote.trim() !== "") return true;
    return false;
  })() : false;

  // Must be called before any early return (Rules of Hooks)
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  if (!user?.adminRole || user.adminRole === "none") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-destructive">Access Denied - Admin access required</p>
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
    if (!Number.isFinite(quantity) || quantity < 1) return;
    setSelectedUpgrades({ ...selectedUpgrades, [upgradeId]: quantity });
  };

  const recalculatePricing = () => {
    const selectedVan = selectedVanId !== "custom" ? vans.find(v => v.id === selectedVanId) : null;
    const selectedKit = kits.find(k => k.id === selectedKitId);
    
    let subtotal = 0;
    
    // Add van price — either system van or custom van value
    if (selectedVan) {
      subtotal += selectedVan.price;
    } else if (selectedVanId === "custom" && customVanValue) {
      subtotal += Math.round(parseFloat(customVanValue) * 100);
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

  // Detect if configuration has changed
  const hasConfigurationChanged = () => {
    // Check if van changed
    if (selectedVanId !== originalVanId) return true;
    
    // Check if kit changed
    if (selectedKitId !== originalKitId) return true;
    
    // Check if upgrade IDs changed (order doesn't matter)
    const currentIds = [...selectedUpgradeIds].sort();
    const originalIds = [...originalSelectedUpgradeIds].sort();
    if (JSON.stringify(currentIds) !== JSON.stringify(originalIds)) return true;
    
    // Check if upgrade quantities changed
    if (JSON.stringify(selectedUpgrades) !== JSON.stringify(originalSelectedUpgrades)) return true;
    
    return false;
  };

  // Auto-generate bespoke build stages from the quote's configuration
  const autoGenerateStages = (): Array<{id: string; label: string}> => {
    const stages: Array<{id: string; label: string}> = [];
    stages.push({ id: "prep", label: "Van Preparation" });
    const selectedKit = kits.find(k => k.id === selectedKitId);
    if (selectedKit) {
      stages.push({ id: "kit", label: `Install ${selectedKit.name}` });
    }
    const selectedUpgradesList = upgrades.filter(u => selectedUpgradeIds.includes(u.id));
    for (const u of selectedUpgradesList) {
      stages.push({ id: `upg_${u.id}`, label: u.name });
    }
    stages.push({ id: "final_checks", label: "Final Checks" });
    stages.push({ id: "valet", label: "Valet & Handover" });
    return stages;
  };

  // The active stage list: use custom if set, otherwise auto-generate from config
  const activeStages = customBuildStages ?? autoGenerateStages();

  const allBuildStagesDone = activeStages.length > 0 && activeStages.every(s => completedBuildStages.includes(s.id));

  // Tab switch — guard ALL tab changes when ANY field is dirty
  const handleTabChange = (newTab: string) => {
    if (isDirty) {
      pendingTabRef.current = newTab;
      pendingNavRef.current = null;
      setShowUnsavedDialog(true);
    } else {
      setActiveTab(newTab as any);
    }
  };

  // Navigation away from the page (e.g. "Back to Quotes") — guard when dirty
  const handleNavigation = (url: string) => {
    if (isDirty) {
      pendingNavRef.current = url;
      pendingTabRef.current = null;
      setShowUnsavedDialog(true);
    } else {
      setLocation(url);
    }
  };

  const handleSave = () => {
    // Block saving as completed unless all build stages are ticked
    if (status === "completed" && !allBuildStagesDone) {
      toast({
        title: "Build stages incomplete",
        description: `Please tick all ${activeStages.length} build stages before marking as Complete.`,
        variant: "destructive",
      });
      return;
    }

    // Convert discount value to pence based on type
    let discountValueInPence: number | null = null;
    if (discountValue) {
      if (discountType === "percentage") {
        const parsed = parseInt(discountValue);
        if (Number.isFinite(parsed)) discountValueInPence = parsed;
      } else if (discountType === "fixed") {
        // Convert pounds to pence
        const parsed = Math.round(parseFloat(discountValue) * 100);
        if (Number.isFinite(parsed)) discountValueInPence = parsed;
      }
    }
    
    // Calculate current pricing to update stored values
    const currentPricing = calculateAdjustedPrice();
    
    const updates: any = {
      status: (quoteStatuses as readonly string[]).includes(status) ? status : "new",
      serviceType: (serviceType === 'car' || serviceType === 'commercial' || serviceType === 'hybrid') ? serviceType : null,
      completedBuildStages,
      customBuildStages: customBuildStages,
      discountType: (discountType === 'percentage' || discountType === 'fixed') ? discountType : null,
      discountValue: discountValueInPence,
      selectedUpgradeIds,
      selectedUpgrades,
      customerConfirmed,
      vanRegistration: vanRegistration.trim() || null,
      vanMileage: vanMileage.trim() ? parseInt(vanMileage.trim()) : null,
      // Update stored pricing values to match recalculated prices
      estSubtotal: currentPricing.subtotal,
      estDiscount: currentPricing.discount,
      estVAT: currentPricing.vat,
      estTotal: currentPricing.total,
    };
    
    // Add new notes to history if provided
    if (newAdminNote.trim()) {
      updates.newAdminNote = newAdminNote.trim();
    }
    
    // Explicitly include null values for van and kit to allow clearing
    // When "custom" is selected, send vanId: null but include custom van details
    if (selectedVanId === "custom") {
      updates.vanId = null;
      updates.customVanDescription = customVanDescription.trim() || null;
      updates.customVanValue = customVanValue ? Math.round(parseFloat(customVanValue) * 100) : null;
    } else {
      updates.vanId = selectedVanId;
      updates.customVanDescription = null;
      updates.customVanValue = null;
    }
    updates.kitId = selectedKitId;
    
    updateMutation.mutate(updates);
  };

  const calculateAdjustedPrice = () => {
    if (!quote) return { subtotal: 0, discount: 0, subtotalAfterDiscount: 0, vat: 0, total: 0 };

    // Use recalculated pricing from current configuration (not original quote.estSubtotal)
    let subtotal = recalculatePricing();
    const vat = Math.round(subtotal * 0.2);
    const totalWithVat = subtotal + vat;
    
    let discountAmount = 0;

    if (discountType && discountValue) {
      if (discountType === "percentage") {
        const percentValue = parseInt(discountValue);
        // Apply discount to total including VAT
        discountAmount = Math.round((totalWithVat * percentValue) / 100);
      } else if (discountType === "fixed") {
        // Convert pounds to pence for calculation
        discountAmount = Math.round(parseFloat(discountValue) * 100);
      }
    }

    // Clamp discount to prevent negative totals
    discountAmount = Math.min(discountAmount, totalWithVat);

    const totalAfterDiscount = totalWithVat - discountAmount;
    // Back-calculate VAT from final total (VAT is 1/6 of total when rate is 20%)
    const finalVat = Math.round(totalAfterDiscount / 6);
    const finalSubtotal = totalAfterDiscount - finalVat;

    return {
      subtotal: finalSubtotal,
      discount: discountAmount,
      subtotalAfterDiscount: finalSubtotal,
      vat: finalVat,
      total: totalAfterDiscount
    };
  };

  const pricing = calculateAdjustedPrice();

  // Fixed APR for finance calculations
  const FINANCE_APR = 0.109; // 10.9%

  // Calculate saved finance info from quote.financeInputs (deposit in pence, term in months)
  const calculateSavedFinance = () => {
    if (quote?.financeInputs?.deposit === undefined || quote?.financeInputs?.deposit === null || !quote?.financeInputs?.term) return null;
    const depositAmount = quote.financeInputs.deposit; // pence
    const termMonths = quote.financeInputs.term;
    const principal = pricing.total - depositAmount;
    if (principal <= 0 || termMonths <= 0) return null;
    const monthlyRate = FINANCE_APR / 12;
    const pv = Math.pow(1 + monthlyRate, termMonths);
    const monthlyPayment = Math.round((principal * monthlyRate * pv) / (pv - 1));
    const weeklyPayment = Math.round((monthlyPayment * 12) / 52);
    return { depositAmount, termMonths, monthlyPayment, weeklyPayment, principal };
  };

  const financeInfo = calculateSavedFinance();

  // Live calculation for the editor
  const editorDepositPence = editorDepositAmount !== "" ? Math.round(parseFloat(editorDepositAmount) * 100) : 0;
  const editorTermMonths = editorTermYears * 12;
  const editorPrincipal = pricing.total - editorDepositPence;
  const editorFinanceInfo = (() => {
    if (editorPrincipal <= 0) return null;
    const monthlyRate = FINANCE_APR / 12;
    const pv = Math.pow(1 + monthlyRate, editorTermMonths);
    const monthlyPayment = Math.round((editorPrincipal * monthlyRate * pv) / (pv - 1));
    const weeklyPayment = Math.round((monthlyPayment * 12) / 52);
    return { monthlyPayment, weeklyPayment, termMonths: editorTermMonths, depositPence: editorDepositPence };
  })();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            className="mb-4"
            data-testid="button-back-to-quotes"
            onClick={() => handleNavigation("/admin/quotes")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Quotes
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

        {/* Unsaved changes dialog — fires for any tab switch or navigation when dirty */}
        <AlertDialog open={showUnsavedDialog} onOpenChange={setShowUnsavedDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>You have unsaved changes</AlertDialogTitle>
              <AlertDialogDescription>
                Changes have been made that haven't been saved yet. Would you like to save before continuing?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
              <AlertDialogCancel
                onClick={() => {
                  pendingTabRef.current = null;
                  pendingNavRef.current = null;
                  setShowUnsavedDialog(false);
                }}
                data-testid="button-unsaved-keep-editing"
              >
                Keep Editing
              </AlertDialogCancel>
              <Button
                variant="outline"
                onClick={() => {
                  // Discard ALL changes — reset every saveable field back to original
                  if (quote) {
                    setStatus(quote.status || "new");
                    setDiscountType(quote.discountType as any || "");
                    setDiscountValue(
                      quote.discountValue
                        ? (quote.discountType === "fixed" ? String(quote.discountValue / 100) : String(quote.discountValue))
                        : ""
                    );
                    setVanRegistration(quote.vanRegistration ?? "");
                    setVanMileage(quote.vanMileage !== null && quote.vanMileage !== undefined ? String(quote.vanMileage) : "");
                    setCustomerConfirmed(quote.customerConfirmed ?? false);
                    setCompletedBuildStages(Array.isArray(quote.completedBuildStages) ? quote.completedBuildStages : []);
                    setNewAdminNote("");
                    setServiceType((quote.serviceType as any) ?? null);
                    setCustomVanDescription(quote.customVanDescription ?? quote.vanRegistration ?? "");
                    setCustomVanValue(quote.customVanValue !== null && quote.customVanValue !== undefined ? String(quote.customVanValue / 100) : "");
                  }
                  setSelectedVanId(originalVanId);
                  setSelectedKitId(originalKitId);
                  setSelectedUpgradeIds(originalSelectedUpgradeIds);
                  setSelectedUpgrades(originalSelectedUpgrades);
                  const tab = pendingTabRef.current;
                  const nav = pendingNavRef.current;
                  pendingTabRef.current = null;
                  pendingNavRef.current = null;
                  setShowUnsavedDialog(false);
                  if (tab) setActiveTab(tab as any);
                  else if (nav) setLocation(nav);
                }}
                data-testid="button-unsaved-discard"
              >
                Discard Changes
              </Button>
              <AlertDialogAction
                className="bg-[#8bc440e6] text-[#191919]"
                onClick={() => {
                  setShowUnsavedDialog(false);
                  handleSave();
                }}
                data-testid="button-unsaved-save"
              >
                Save & Continue
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-0">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="configuration" data-testid="tab-configuration">Configuration</TabsTrigger>
            <TabsTrigger value="finance" data-testid="tab-finance">Finance</TabsTrigger>
            <TabsTrigger value="build" data-testid="tab-build">Build Progress</TabsTrigger>
            <TabsTrigger value="notes" data-testid="tab-notes">Internal Notes</TabsTrigger>
          </TabsList>

          <div className={`grid gap-6 ${activeTab === "finance" ? "lg:grid-cols-3" : ""}`}>
          {/* Left Column / Main content */}
          <div className={`space-y-6 ${activeTab === "finance" ? "lg:col-span-2" : ""}`}>
            {/* Customer Information — Overview tab */}
            {activeTab === "overview" && <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5" />
                    Customer Information
                  </CardTitle>
                  {canEdit && !editingCustomer && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditCustomerName(quote.userName || "");
                        setEditCustomerEmail(quote.email || "");
                        setEditCustomerPhone(quote.phone || "");
                        setEditCustomerCompany(quote.company || "");
                        setEditingCustomer(true);
                      }}
                      data-testid="button-edit-customer"
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {editingCustomer ? (
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <Input
                          value={editCustomerName}
                          onChange={(e) => setEditCustomerName(e.target.value)}
                          data-testid="input-edit-customer-name"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <Input
                          type="email"
                          value={editCustomerEmail}
                          onChange={(e) => setEditCustomerEmail(e.target.value)}
                          data-testid="input-edit-customer-email"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <Input
                          type="tel"
                          value={editCustomerPhone}
                          onChange={(e) => setEditCustomerPhone(e.target.value)}
                          data-testid="input-edit-customer-phone"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                        <Input
                          value={editCustomerCompany}
                          onChange={(e) => setEditCustomerCompany(e.target.value)}
                          placeholder="e.g. Smith Tyres Ltd"
                          data-testid="input-edit-customer-company"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          updateMutation.mutate({
                            userName: editCustomerName,
                            email: editCustomerEmail,
                            phone: editCustomerPhone,
                            company: editCustomerCompany || null,
                          } as any);
                          setEditingCustomer(false);
                        }}
                        disabled={updateMutation.isPending}
                        data-testid="button-save-customer"
                      >
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingCustomer(false)}
                        data-testid="button-cancel-edit-customer"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
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
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">Business Name</div>
                      <div className="text-base">
                        {quote.company || <span className="text-muted-foreground italic text-sm">Not set</span>}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>}

            {/* Configuration Editor — Configuration tab */}
            {activeTab === "configuration" && <Card>
              <Collapsible open={isConfigEditorOpen} onOpenChange={setIsConfigEditorOpen}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Edit Configuration
                      </CardTitle>
                      <CardDescription>
                        Modify the van, kit, and equipment selections
                      </CardDescription>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid="button-toggle-config-editor">
                        <ChevronDown className={`w-4 h-4 transition-transform ${isConfigEditorOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                {/* Service Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="service-type-select">Customer Type</Label>
                  <p className="text-xs text-muted-foreground">Change this if the customer chose the wrong path in the configurator.</p>
                  <Select
                    value={serviceType || "none"}
                    onValueChange={(v) => setServiceType(v === "none" ? null : v as "car" | "commercial" | "hybrid")}
                  >
                    <SelectTrigger id="service-type-select" data-testid="select-service-type">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Not set</SelectItem>
                      <SelectItem value="car">Car / Van (personal)</SelectItem>
                      <SelectItem value="commercial">Commercial Vehicle</SelectItem>
                      <SelectItem value="hybrid">Hybrid / Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Van Selection */}
                <div className="space-y-3">
                  <Label htmlFor="van-select">Van</Label>
                  <Select
                    value={selectedVanId || "none"}
                    onValueChange={(v) => {
                      if (v === "none") { setSelectedVanId(null); setCustomVanDescription(""); setCustomVanValue(""); }
                      else setSelectedVanId(v);
                    }}
                  >
                    <SelectTrigger id="van-select" data-testid="select-van">
                      <SelectValue placeholder="Select van" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No van selected</SelectItem>
                      <SelectItem value="custom">Custom / Off-website van</SelectItem>
                      {vans.filter(v => v.published).map((van) => (
                        <SelectItem key={van.id} value={van.id}>
                          {van.year} {van.make} {van.model} - £{(van.price / 100).toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Custom van fields — shown only when custom is selected */}
                  {selectedVanId === "custom" && (
                    <div className="rounded-md border p-4 space-y-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground font-medium">Enter the customer's van details below. The cost will be included in the quote total.</p>
                      <div className="space-y-1.5">
                        <Label htmlFor="custom-van-description" className="text-sm">Reg Number</Label>
                        <Input
                          id="custom-van-description"
                          placeholder="e.g. AB12 CDE"
                          value={customVanDescription}
                          onChange={(e) => setCustomVanDescription(e.target.value)}
                          data-testid="input-custom-van-description"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="custom-van-value" className="text-sm">Van Cost (£)</Label>
                        <div className="relative">
                          <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="custom-van-value"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="0.00"
                            className="pl-9"
                            value={customVanValue}
                            onChange={(e) => setCustomVanValue(e.target.value)}
                            data-testid="input-custom-van-value"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Kit Selection — only for car/van customers (not commercial or hybrid) */}
                {(serviceType === null || serviceType === "car") && (
                <div className="space-y-1.5">
                  <Label htmlFor="kit-select">Equipment Kit</Label>
                  <Select value={selectedKitId || "none"} onValueChange={(v) => setSelectedKitId(v === "none" ? null : v)}>
                    <SelectTrigger id="kit-select" data-testid="select-kit">
                      <SelectValue placeholder="Select kit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No kit selected</SelectItem>
                      {kits
                        .filter(k => k.published)
                        .map((kit) => (
                          <SelectItem key={kit.id} value={kit.id}>
                            {kit.name} - £{(kit.price / 100).toLocaleString()}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                )}

                {/* Upgrades Selection - Organized by Category */}
                <div>
                  <Label>Equipment & Upgrades</Label>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Items with a green outline were originally selected by the customer
                  </p>
                  <div className="mt-2 space-y-4 max-h-96 overflow-y-auto border rounded-md p-4">
                    {upgradeCategories.map((category) => {
                      // Hide the "commercial" category entirely for car/personal customers
                      if (category === "commercial" && serviceType === "car") return null;

                      const categoryUpgrades = upgrades.filter(u => {
                        if (!u.published || u.category !== category) return false;
                        // Hide commercial-only items from car/personal customers
                        if (serviceType === "car" && u.forCommercial) return false;
                        // Hide car-only items from commercial/hybrid customers
                        if ((serviceType === "commercial" || serviceType === "hybrid") && u.carOnly) return false;
                        return true;
                      });
                      if (categoryUpgrades.length === 0) return null;
                      
                      const { groups, standalone } = groupUpgradeVariations(categoryUpgrades);
                      
                      return (
                        <div key={category} className="space-y-3">
                          <div className="text-sm font-semibold text-foreground border-b pb-1">
                            {category.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                          </div>
                          
                          {/* Standalone upgrades with checkbox */}
                          {standalone.map((upgrade) => {
                            const isSelected = selectedUpgradeIds.includes(upgrade.id);
                            const wasOriginallySelected = originalUpgradeIds.includes(upgrade.id);
                            const quantity = selectedUpgrades[upgrade.id] || 1;
                            
                            return (
                              <div 
                                key={upgrade.id} 
                                className={`flex items-start gap-3 p-2 rounded ${wasOriginallySelected ? 'border-2 border-green-500' : 'border-2 border-transparent'}`}
                              >
                                <Checkbox
                                  id={`upgrade-${upgrade.id}`}
                                  checked={isSelected}
                                  onCheckedChange={() => handleUpgradeToggle(upgrade.id, upgrade)}
                                  data-testid={`checkbox-upgrade-${upgrade.id}`}
                                />
                                <div className="flex-1 min-w-0">
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
                          
                          {/* Grouped upgrades with variants */}
                          {groups.map(({ parent, variants }) => {
                            const selectedVariantId = selectedUpgradeIds.find(id => 
                              variants.some(v => v.id === id)
                            );
                            const selectedVariant = variants.find(v => v.id === selectedVariantId);
                            const wasOriginallySelected = originalUpgradeIds.some(id => 
                              variants.some(v => v.id === id)
                            );
                            const quantity = selectedVariant ? (selectedUpgrades[selectedVariant.id] || 1) : 1;
                            
                            return (
                              <div 
                                key={parent.id} 
                                className={`p-2 rounded ${wasOriginallySelected ? 'border-2 border-green-500' : 'border-2 border-transparent'}`}
                              >
                                <Label className="text-sm font-medium">{parent.name}</Label>
                                {parent.description && (
                                  <p className="text-xs text-muted-foreground mb-2">{parent.description}</p>
                                )}
                                <Select
                                  value={selectedVariantId || "none"}
                                  onValueChange={(value) => {
                                    if (value === "none") {
                                      variants.forEach(v => {
                                        if (selectedUpgradeIds.includes(v.id)) {
                                          handleUpgradeToggle(v.id, v);
                                        }
                                      });
                                    } else {
                                      variants.forEach(v => {
                                        if (selectedUpgradeIds.includes(v.id)) {
                                          handleUpgradeToggle(v.id, v);
                                        }
                                      });
                                      const variant = variants.find(v => v.id === value);
                                      if (variant) {
                                        handleUpgradeToggle(variant.id, variant);
                                      }
                                    }
                                  }}
                                >
                                  <SelectTrigger className="mt-2">
                                    <SelectValue placeholder="Select option" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {variants.map((variant) => (
                                      <SelectItem key={variant.id} value={variant.id}>
                                        {variant.name} - £{(variant.price / 100).toLocaleString()}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {selectedVariant && selectedVariant.allowQuantity && (
                                  <div className="flex items-center gap-2 mt-2">
                                    <Label htmlFor={`qty-${selectedVariant.id}`} className="text-xs">
                                      Quantity:
                                    </Label>
                                    <Input
                                      id={`qty-${selectedVariant.id}`}
                                      type="number"
                                      min="1"
                                      value={quantity}
                                      onChange={(e) => handleQuantityChange(selectedVariant.id, parseInt(e.target.value))}
                                      className="w-20 h-8 text-sm"
                                      data-testid={`input-quantity-${selectedVariant.id}`}
                                    />
                                  </div>
                                )}
                              </div>
                            );
                          })}
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

                {/* Confirm Changes Button - Only show if changes detected */}
                {hasConfigurationChanged() && (
                  <div className="pt-4">
                    <Button
                      onClick={handleSave}
                      disabled={updateMutation.isPending}
                      className="w-full bg-accent hover:bg-accent/90"
                      data-testid="button-confirm-config-changes"
                    >
                      {updateMutation.isPending ? "Saving..." : "Confirm Changes"}
                    </Button>
                  </div>
                )}
              </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>}

            {/* Build Progress Management — Build Progress tab */}
            {activeTab === "build" && (
              <Card className={status === "completed" ? "border-accent bg-accent/5" : ""}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="w-5 h-5" />
                    Build Stage Management
                  </CardTitle>
                  {status === "in_build" && (
                    <CardDescription>
                      Tick off each stage as it's completed — stages can be done in any order
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  {status === "completed" ? (
                    <div className="flex flex-col items-center gap-3 py-6" data-testid="build-complete-banner">
                      <CheckCircle2 className="w-12 h-12 text-accent" />
                      <span className="text-xl font-bold text-accent">Complete</span>
                      <span className="text-sm text-muted-foreground">All build stages finished — van delivered</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Stage checklist */}
                      <div className="space-y-1">
                        {activeStages.map((stage, idx) => {
                          const isComplete = completedBuildStages.includes(stage.id);
                          return (
                            <div
                              key={stage.id}
                              className={cn(
                                "flex items-center gap-2 py-2 px-3 rounded-md",
                                isComplete ? "bg-accent/10" : "bg-muted/30"
                              )}
                              data-testid={`toggle-stage-${stage.id}`}
                            >
                              <Checkbox
                                checked={isComplete}
                                onCheckedChange={(checked) => {
                                  if (!canEdit) return;
                                  setCompletedBuildStages(prev =>
                                    checked
                                      ? [...prev, stage.id]
                                      : prev.filter(s => s !== stage.id)
                                  );
                                }}
                                data-testid={`checkbox-stage-${stage.id}`}
                                disabled={!canEdit}
                                className="cursor-pointer"
                              />
                              <span className={cn("flex-1 text-sm font-medium", isComplete ? "text-foreground" : "text-muted-foreground")}>
                                {stage.label}
                              </span>
                              {isComplete && (
                                <Badge variant="secondary" className="text-xs">Done</Badge>
                              )}
                              {canEdit && (
                                <div className="flex items-center gap-0.5 ml-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    disabled={idx === 0}
                                    onClick={() => {
                                      const next = [...activeStages];
                                      [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                                      setCustomBuildStages(next);
                                    }}
                                    data-testid={`button-stage-up-${stage.id}`}
                                  >
                                    <ChevronUp className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    disabled={idx === activeStages.length - 1}
                                    onClick={() => {
                                      const next = [...activeStages];
                                      [next[idx + 1], next[idx]] = [next[idx], next[idx + 1]];
                                      setCustomBuildStages(next);
                                    }}
                                    data-testid={`button-stage-down-${stage.id}`}
                                  >
                                    <ChevronDown className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive"
                                    onClick={() => {
                                      setCustomBuildStages(activeStages.filter(s => s.id !== stage.id));
                                      setCompletedBuildStages(prev => prev.filter(id => id !== stage.id));
                                    }}
                                    data-testid={`button-stage-remove-${stage.id}`}
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Add stage + regenerate */}
                      {canEdit && (
                        <div className="space-y-2 pt-1">
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a build stage..."
                              value={newStageName}
                              onChange={e => setNewStageName(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter" && newStageName.trim()) {
                                  const id = `custom_${Date.now()}`;
                                  setCustomBuildStages([...activeStages, { id, label: newStageName.trim() }]);
                                  setNewStageName("");
                                }
                              }}
                              data-testid="input-new-stage-name"
                            />
                            <Button
                              size="icon"
                              variant="outline"
                              disabled={!newStageName.trim()}
                              onClick={() => {
                                const id = `custom_${Date.now()}`;
                                setCustomBuildStages([...activeStages, { id, label: newStageName.trim() }]);
                                setNewStageName("");
                              }}
                              data-testid="button-add-stage"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-muted-foreground"
                            onClick={() => {
                              setCustomBuildStages(null);
                              setCompletedBuildStages([]);
                            }}
                            data-testid="button-regenerate-stages"
                          >
                            <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                            Re-generate from configuration
                          </Button>
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Overall Progress</span>
                          <span className="font-semibold">
                            {activeStages.length > 0
                              ? `${Math.round((completedBuildStages.filter(id => activeStages.some(s => s.id === id)).length / activeStages.length) * 100)}% — ${completedBuildStages.filter(id => activeStages.some(s => s.id === id)).length} of ${activeStages.length} stages`
                              : "No stages defined"}
                          </span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all duration-500"
                            style={{ width: activeStages.length > 0 ? `${Math.round((completedBuildStages.filter(id => activeStages.some(s => s.id === id)).length / activeStages.length) * 100)}%` : "0%" }}
                            data-testid="admin-progress-bar"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Customer Logos — Configuration tab */}
            {activeTab === "configuration" && quote.customerLogoUrls && quote.customerLogoUrls.length > 0 && (
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

            {/* Finance Submission — Finance tab (left/main col) */}
            {activeTab === "finance" && canEdit && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PoundSterling className="w-5 h-5" />
                    Finance Submission
                  </CardTitle>
                  <CardDescription>
                    Send the full spec to the finance company
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Step 1 */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Step 1 — Customer confirmation</Label>
                    <div className="flex items-start gap-3 p-3 rounded-md border">
                      <Checkbox id="customer-confirmed-fin" checked={customerConfirmed} onCheckedChange={(v) => setCustomerConfirmed(!!v)} data-testid="checkbox-customer-confirmed" />
                      <div className="flex-1">
                        <label htmlFor="customer-confirmed-fin" className="text-sm font-medium cursor-pointer select-none">Customer confirms the configurator</label>
                        <p className="text-xs text-muted-foreground mt-0.5">Tick once the customer has verbally agreed their configuration and spec on the phone</p>
                      </div>
                    </div>
                    {customerConfirmed && <p className="text-xs text-accent font-medium">Confirmed — ready to submit to finance</p>}
                  </div>
                  {/* Step 2 */}
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Step 2 — Vehicle details</Label>
                    <div className="space-y-2">
                      <Label htmlFor="van-registration-fin" className="text-sm">Van Registration</Label>
                      <Input id="van-registration-fin" placeholder="e.g. AB12 CDE" value={vanRegistration} onChange={(e) => setVanRegistration(e.target.value.toUpperCase())} className="font-mono uppercase" data-testid="input-van-registration" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="van-mileage-fin" className="text-sm">Van Mileage</Label>
                      <Input id="van-mileage-fin" type="number" placeholder="e.g. 15000" value={vanMileage} onChange={(e) => setVanMileage(e.target.value)} data-testid="input-van-mileage" />
                    </div>
                    <p className="text-xs text-muted-foreground">Save changes above to store registration and mileage.</p>
                  </div>
                  {/* Step 3 */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Step 3 — Finance company</Label>
                    <div className="flex items-center gap-2">
                      <Input placeholder="Finance company email" value={financeEmailOverride || defaultFinanceEmail} onChange={(e) => setFinanceEmailOverride(e.target.value)} className="text-sm" data-testid="input-finance-email" />
                      {financeEmailOverride && financeEmailOverride !== defaultFinanceEmail && (
                        <Button size="sm" variant="outline" onClick={() => saveFinanceEmailMutation.mutate(financeEmailOverride)} disabled={saveFinanceEmailMutation.isPending} data-testid="button-save-finance-email">Save</Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">Default: Jigsaw Finance (Stephen Quinn). Editing and saving will update the default for all quotes.</p>
                  </div>
                  {/* Step 4 */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Step 4 — Send application</Label>
                    <Button className="w-full bg-[#8bc440e6] text-[#191919] border-green-600" onClick={() => sendFinanceMutation.mutate()} disabled={!customerConfirmed || sendFinanceMutation.isPending} data-testid="button-send-finance">
                      <Send className="w-4 h-4 mr-2" />
                      {sendFinanceMutation.isPending ? "Sending..." : "Send to Finance Company"}
                    </Button>
                    {!customerConfirmed && <p className="text-xs text-muted-foreground text-center">Tick "Customer confirms the configurator" to enable</p>}
                    {quote.financeSentAt && (
                      <p className="text-xs text-muted-foreground text-center">
                        Last sent: {new Date(quote.financeSentAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Internal Notes — Notes tab */}
            {activeTab === "notes" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Internal Notes
                  </CardTitle>
                  <CardDescription>Only visible to staff — never shown to customers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Note History */}
                  {quote?.adminNotesHistory && quote.adminNotesHistory.length > 0 ? (
                    <div className="space-y-3">
                      {quote.adminNotesHistory.map((note, index) => {
                        const isEditing = editingNote?.noteType === 'admin' && editingNote?.timestamp === note.timestamp;
                        return (
                          <div key={index} className="p-3 rounded-lg bg-muted/50 border">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <span className="text-xs font-medium text-muted-foreground">
                                {note.author || 'Admin'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(note.timestamp).toLocaleString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                                {!isEditing && (
                                  <div className="flex gap-1">
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={() => setEditingNote({ noteType: 'admin', timestamp: note.timestamp, text: note.text })}
                                      data-testid={`button-edit-admin-note-${index}`}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 text-destructive"
                                      onClick={() => {
                                        if (confirm('Are you sure you want to delete this note?')) {
                                          deleteNoteMutation.mutate({ noteType: 'admin', timestamp: note.timestamp });
                                        }
                                      }}
                                      data-testid={`button-delete-admin-note-${index}`}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                            {isEditing ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editingNote.text}
                                  onChange={(e) => setEditingNote({ ...editingNote, text: e.target.value })}
                                  rows={4}
                                  data-testid="textarea-edit-admin-note"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (editingNote.text.trim()) {
                                        editNoteMutation.mutate({
                                          noteType: 'admin',
                                          timestamp: editingNote.timestamp,
                                          text: editingNote.text
                                        });
                                      }
                                    }}
                                    disabled={!editingNote.text.trim()}
                                    data-testid="button-save-admin-note"
                                  >
                                    <Check className="h-4 w-4 mr-1" />
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setEditingNote(null)}
                                    data-testid="button-cancel-admin-note"
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-sm whitespace-pre-wrap">{note.text}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-6">No notes yet — add the first one below.</p>
                  )}

                  {/* Add New Note */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label htmlFor="new-admin-note-tab">Add Note</Label>
                    <Textarea
                      id="new-admin-note-tab"
                      value={newAdminNote}
                      onChange={(e) => setNewAdminNote(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (newAdminNote.trim()) {
                            handleSave();
                            setNewAdminNote("");
                          }
                        }
                      }}
                      placeholder="Type a note and press Enter to save (Shift+Enter for new line)..."
                      rows={3}
                      data-testid="textarea-new-admin-note"
                    />
                    <p className="text-xs text-muted-foreground">Press Enter to save · Shift+Enter for new line</p>
                  </div>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Right Column - shown only in overview and finance tabs */}
          {(activeTab === "overview" || activeTab === "finance") && <div className="lg:col-span-1 space-y-6">
            {/* Overview-only sections */}
            {activeTab === "overview" && <>
            {/* Workflow Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Workflow Status
                </CardTitle>
                <CardDescription>Current stage in the build journey</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Pipeline visual */}
                {(() => {
                  const pipelineStages = [
                    { key: "new", label: "New" },
                    { key: "contacted", label: "Contacted" },
                    { key: "payment", label: "Payment / Finance" },
                    { key: "in_build", label: "In Build" },
                    { key: "completed", label: "Completed" },
                  ];
                  const paymentStatuses = ["awaiting_deposit", "awaiting_finance", "deposit_taken", "finance_approved"];
                  const currentKey = status === "cancelled" ? null :
                    paymentStatuses.includes(status) ? "payment" : status;
                  const stageOrder = pipelineStages.map(s => s.key);
                  const currentIdx = currentKey ? stageOrder.indexOf(currentKey) : -1;
                  return (
                    <div className="flex items-center gap-1 flex-wrap" data-testid="workflow-pipeline">
                      {pipelineStages.map((stage, i) => {
                        const isActive = stage.key === currentKey;
                        const isPast = currentIdx > -1 && i < currentIdx;
                        const isCancelled = status === "cancelled";
                        return (
                          <div key={stage.key} className="flex items-center gap-1">
                            <div className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                              isCancelled ? "bg-destructive/10 text-destructive" :
                              isActive ? "bg-accent text-accent-foreground" :
                              isPast ? "bg-accent/20 text-accent" :
                              "bg-muted text-muted-foreground"
                            }`}>
                              {isCancelled && i === 0 ? "Cancelled" : stage.label}
                            </div>
                            {i < pipelineStages.length - 1 && (
                              <div className={`text-xs ${isPast && !isCancelled ? "text-accent" : "text-muted-foreground"}`}>→</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Payment sub-status */}
                {["awaiting_deposit", "awaiting_finance", "deposit_taken", "finance_approved"].includes(status) && (
                  <div className="text-sm font-medium">
                    Payment stage: <span className="text-accent">{STATUS_LABELS[status]}</span>
                  </div>
                )}

                {/* Quick action buttons based on current status */}
                {canEdit && status !== "completed" && status !== "cancelled" && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Next Step</Label>
                    <div className="flex flex-col gap-2">
                      {status === "new" && (
                        <Button size="sm" onClick={() => quickStatusMutation.mutate("contacted")} disabled={quickStatusMutation.isPending} data-testid="button-mark-contacted">
                          Mark as Contacted
                        </Button>
                      )}
                      {status === "contacted" && (
                        <>
                          <Button size="sm" onClick={() => quickStatusMutation.mutate("awaiting_deposit")} disabled={quickStatusMutation.isPending} data-testid="button-awaiting-deposit">
                            Awaiting Deposit
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => quickStatusMutation.mutate("awaiting_finance")} disabled={quickStatusMutation.isPending} data-testid="button-awaiting-finance">
                            Submit to Finance
                          </Button>
                        </>
                      )}
                      {status === "awaiting_deposit" && (
                        <Button size="sm" className="bg-[#8bc440e6] text-[#191919] border-green-600" onClick={() => quickStatusMutation.mutate("deposit_taken")} disabled={quickStatusMutation.isPending} data-testid="button-deposit-taken">
                          Confirm Deposit Taken
                        </Button>
                      )}
                      {status === "awaiting_finance" && (
                        <>
                          <Button size="sm" className="bg-[#8bc440e6] text-[#191919] border-green-600" onClick={() => quickStatusMutation.mutate("finance_approved")} disabled={quickStatusMutation.isPending} data-testid="button-finance-approved">
                            Finance Approved
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => quickStatusMutation.mutate("contacted")} disabled={quickStatusMutation.isPending} data-testid="button-finance-declined">
                            Finance Declined
                          </Button>
                        </>
                      )}
                      {(status === "deposit_taken" || status === "finance_approved") && (
                        <Button size="sm" className="bg-[#8bc440e6] text-[#191919] border-green-600" onClick={() => quickStatusMutation.mutate("in_build")} disabled={quickStatusMutation.isPending} data-testid="button-move-to-build">
                          Move to Build
                        </Button>
                      )}
                      {status === "in_build" && allBuildStagesDone && (
                        <Button size="sm" className="bg-[#8bc440e6] text-[#191919] border-green-600" onClick={() => quickStatusMutation.mutate("completed")} disabled={quickStatusMutation.isPending} data-testid="button-mark-completed">
                          Mark as Completed
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Manual override dropdown */}
                <div>
                  <Label htmlFor="quote-status" className="text-xs text-muted-foreground">Manual override</Label>
                  <Select
                    value={status}
                    onValueChange={(val) => {
                      if (val === "completed" && !allBuildStagesDone) {
                        toast({
                          title: "Build stages incomplete",
                          description: `Please tick all ${activeStages.length} build stages in Build Stage Management before marking as Complete.`,
                          variant: "destructive",
                        });
                        return;
                      }
                      setStatus(val);
                    }}
                  >
                    <SelectTrigger id="quote-status" data-testid="select-quote-status" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {quoteStatuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {STATUS_LABELS[s] ?? s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Save changes to apply manual override.</p>
                </div>
              </CardContent>
            </Card>

            {/* Customer Confirmation Status */}
            <Card className={quote.confirmedAt ? "border-accent bg-accent/5" : ""}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Customer Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent>
                {quote.confirmedAt ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="default" className="bg-accent text-accent-foreground">
                        ✓ Confirmed
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Confirmed on {new Date(quote.confirmedAt).toLocaleDateString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground pt-2">
                      Customer has reviewed and confirmed this quote
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Badge variant="secondary">Awaiting Confirmation</Badge>
                    <p className="text-sm text-muted-foreground">
                      Customer has not yet confirmed this quote
                    </p>
                  </div>
                )}
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
                      {discountType === "percentage" ? "Percentage" : "Amount (£)"}
                    </Label>
                    <Input
                      id="discount-value"
                      type="number"
                      step={discountType === "fixed" ? "0.01" : "1"}
                      min="0"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      placeholder={discountType === "percentage" ? "e.g., 10" : "e.g., 50.00"}
                      data-testid="input-discount-value"
                    />
                    {discountType === "fixed" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Enter amount in pounds (e.g., 50.00 = £50.00)
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            </>}

            {/* Price Summary — visible in both overview and finance tabs */}
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
                
                {/* Finance Summary (if saved) */}
                {financeInfo && (
                  <>
                    <Separator className="my-4" />
                    <div className="space-y-2 pt-2">
                      <div className="text-sm font-semibold text-accent">Finance (HP — 10.9% APR)</div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deposit</span>
                        <span className="font-medium">
                          £{(financeInfo.depositAmount / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Term</span>
                        <span className="font-medium">{financeInfo.termMonths} months</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Monthly payment</span>
                        <span className="font-bold text-accent">
                          £{(financeInfo.monthlyPayment / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })}/mo
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Weekly (approx.)</span>
                        <span className="font-medium">
                          £{(financeInfo.weeklyPayment / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })}/wk
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Finance Calculator Editor — Finance tab only */}
            {activeTab === "finance" && canEdit && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Finance Calculator
                  </CardTitle>
                  <CardDescription>
                    HP at 10.9% APR — set term to calculate payments (deposit optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Deposit in £ */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">Deposit Amount (£)</Label>
                    <div className="relative">
                      <PoundSterling className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        placeholder="0"
                        value={editorDepositAmount}
                        onChange={e => setEditorDepositAmount(e.target.value)}
                        className="pl-9"
                        data-testid="input-editor-deposit"
                      />
                    </div>
                  </div>

                  {/* Term selector */}
                  <div className="space-y-1.5">
                    <Label className="text-sm">Finance Term</Label>
                    <Select
                      value={String(editorTermYears)}
                      onValueChange={val => setEditorTermYears(parseInt(val))}
                    >
                      <SelectTrigger data-testid="select-editor-term">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Year (12 months)</SelectItem>
                        <SelectItem value="2">2 Years (24 months)</SelectItem>
                        <SelectItem value="3">3 Years (36 months)</SelectItem>
                        <SelectItem value="4">4 Years (48 months)</SelectItem>
                        <SelectItem value="5">5 Years (60 months)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Live result */}
                  {editorFinanceInfo ? (
                    <div className="rounded-md border p-3 space-y-2 bg-muted/30">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deposit</span>
                        <span className="font-medium">
                          £{(editorFinanceInfo.depositPence / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Term</span>
                        <span className="font-medium">{editorFinanceInfo.termMonths} months</span>
                      </div>
                      <div className="flex justify-between text-sm border-t pt-2 mt-1">
                        <span className="text-muted-foreground">Monthly payment</span>
                        <span className="text-lg font-bold text-accent">
                          £{(editorFinanceInfo.monthlyPayment / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Weekly (approx.)</span>
                        <span className="font-medium">
                          £{(editorFinanceInfo.weeklyPayment / 100).toLocaleString("en-GB", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground pt-1">
                        <span>APR</span>
                        <span>10.9%</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-2">
                      Enter a deposit amount to calculate payments
                    </p>
                  )}

                  <Button
                    onClick={() => saveFinanceMutation.mutate()}
                    disabled={saveFinanceMutation.isPending}
                    className="w-full"
                    data-testid="button-save-finance"
                  >
                    {saveFinanceMutation.isPending ? "Saving..." : "Save Finance Settings"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Finance Submission Card — now in Finance tab left col; hidden here */}
            {false && canEdit && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PoundSterling className="w-5 h-5" />
                    Finance Submission
                  </CardTitle>
                  <CardDescription>
                    Send the full spec to the finance company
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Step 1: Customer confirms */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Step 1 — Customer confirmation</Label>
                    <div className="flex items-start gap-3 p-3 rounded-md border">
                      <Checkbox
                        id="customer-confirmed"
                        checked={customerConfirmed}
                        onCheckedChange={(v) => setCustomerConfirmed(!!v)}
                        data-testid="checkbox-customer-confirmed"
                      />
                      <div className="flex-1">
                        <label htmlFor="customer-confirmed" className="text-sm font-medium cursor-pointer select-none">
                          Customer confirms the configurator
                        </label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Tick once the customer has verbally agreed their configuration and spec on the phone
                        </p>
                      </div>
                    </div>
                    {customerConfirmed && (
                      <p className="text-xs text-accent font-medium">Confirmed — ready to submit to finance</p>
                    )}
                  </div>

                  {/* Step 2: Vehicle details */}
                  <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Step 2 — Vehicle details</Label>
                    <div className="space-y-2">
                      <Label htmlFor="van-registration" className="text-sm">Van Registration</Label>
                      <Input
                        id="van-registration"
                        placeholder="e.g. AB12 CDE"
                        value={vanRegistration}
                        onChange={(e) => setVanRegistration(e.target.value.toUpperCase())}
                        className="font-mono uppercase"
                        data-testid="input-van-registration"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="van-mileage" className="text-sm">Van Mileage</Label>
                      <Input
                        id="van-mileage"
                        type="number"
                        placeholder="e.g. 15000"
                        value={vanMileage}
                        onChange={(e) => setVanMileage(e.target.value)}
                        data-testid="input-van-mileage"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">Save changes above to store registration and mileage.</p>
                  </div>

                  {/* Step 3: Finance company email */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Step 3 — Finance company</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Finance company email"
                        value={financeEmailOverride || defaultFinanceEmail}
                        onChange={(e) => setFinanceEmailOverride(e.target.value)}
                        className="text-sm"
                        data-testid="input-finance-email"
                      />
                      {financeEmailOverride && financeEmailOverride !== defaultFinanceEmail && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => saveFinanceEmailMutation.mutate(financeEmailOverride)}
                          disabled={saveFinanceEmailMutation.isPending}
                          data-testid="button-save-finance-email"
                        >
                          Save
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Default: Jigsaw Finance (Stephen Quinn). Editing and saving will update the default for all quotes.
                    </p>
                  </div>

                  {/* Step 4: Send button */}
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">Step 4 — Send application</Label>
                    <Button
                      className="w-full bg-[#8bc440e6] text-[#191919] border-green-600"
                      onClick={() => sendFinanceMutation.mutate()}
                      disabled={!customerConfirmed || sendFinanceMutation.isPending}
                      data-testid="button-send-finance"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sendFinanceMutation.isPending ? "Sending..." : "Send to Finance Company"}
                    </Button>
                    {!customerConfirmed && (
                      <p className="text-xs text-muted-foreground text-center">
                        Tick "Customer confirms the configurator" to enable
                      </p>
                    )}
                    {quote.financeSentAt && (
                      <p className="text-xs text-muted-foreground text-center">
                        Last sent: {new Date(quote.financeSentAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Send Spec Summary Email - Only for full admins in overview */}
            {activeTab === "overview" && canEdit && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Send to Customer
                  </CardTitle>
                  <CardDescription>
                    Email the customer their van spec and agreed price — send after discussing on the phone
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    onClick={() => sendConfirmationMutation.mutate()}
                    disabled={sendConfirmationMutation.isPending}
                    className="w-full"
                    data-testid="button-send-confirmation"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sendConfirmationMutation.isPending ? "Sending..." : "Send Spec Summary Email"}
                  </Button>
                  {(quote as any).specSentAt && (
                    <p className="text-xs text-muted-foreground text-center" data-testid="text-spec-sent-at">
                      Last sent: {new Date((quote as any).specSentAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Sends the van, pack, upgrades, and price to {quote.email}.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Delete Quote - Only for full admins in overview */}
            {activeTab === "overview" && canEdit && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="w-5 h-5" />
                    Delete Quote
                  </CardTitle>
                  <CardDescription>
                    Permanently delete this quote from the system
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="w-full"
                        data-testid="button-delete-quote"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Quote
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to delete this quote?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the quote for{" "}
                          <span className="font-semibold">{quote.userName}</span> ({quote.email}) and remove all associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteQuoteMutation.mutate()}
                          disabled={deleteQuoteMutation.isPending}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          data-testid="button-confirm-delete"
                        >
                          {deleteQuoteMutation.isPending ? "Deleting..." : "Delete Quote"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}
          </div>}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
