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
  RefreshCw,
  GitCompare,
  Bot,
  Eye,
  Mail,
  Building2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Quote, Van, Kit, Upgrade } from "@shared/schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { upgradeCategories } from "@shared/schema";
import BuildProgressTracker from "@/components/BuildProgressTracker";
import { ObjectUploader } from "@/components/ObjectUploader";
import maxAvatarSrc from "@assets/max-avatar.png";
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
  "finance_declined", "deposit_taken", "finance_approved", "in_build", "completed", "cancelled"
] as const;

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  awaiting_deposit: "Awaiting Deposit",
  awaiting_finance: "Finance Submitted",
  finance_declined: "Finance Declined",
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

  // Parse URL query params for deep-linking and back-navigation context
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get("tab");
  const fromParam = urlParams.get("from"); // "leads" | "quotes"

  const [status, setStatus] = useState("");
  const [completedBuildStages, setCompletedBuildStages] = useState<string[]>([]);

  // Follow-up scheduling dialog (shown when marking as Contacted)
  const [fuDialogOpen, setFuDialogOpen] = useState(false);
  const [fuDate, setFuDate] = useState(new Date().toISOString().split("T")[0]);
  const [fuNotes, setFuNotes] = useState("");

  const scheduleFollowUpMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => apiRequest("POST", "/api/admin/follow-ups", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/follow-ups"], refetchType: "all" });
      setFuDialogOpen(false);
      toast({ title: "Follow-up scheduled", description: "Added to your calendar." });
    },
    onError: () => toast({ variant: "destructive", title: "Failed to schedule follow-up" }),
  });

  const [stageInitials, setStageInitials] = useState<Record<string, string>>({});
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

  // Active detail tab — initialised from ?tab= URL param for deep-linking
  const validTabs = ["overview", "configuration", "finance", "build", "notes"] as const;
  type TabValue = typeof validTabs[number];
  const initialTab: TabValue =
    tabParam && (validTabs as readonly string[]).includes(tabParam)
      ? (tabParam as TabValue)
      : "overview";
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);
  // Compare mode: which option is the admin currently viewing
  const [viewingSlot, setViewingSlot] = useState<'A' | 'B'>('A');

  // Undo choice confirmation dialog
  const [showUndoChoiceDialog, setShowUndoChoiceDialog] = useState(false);

  // Resend-to-customer prompt after saving config changes
  const [showResendDialog, setShowResendDialog] = useState(false);

  // AI transcript viewer
  const [showAiTranscript, setShowAiTranscript] = useState(false);

  // Unsaved-changes guard (all tabs + back navigation)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false);
  const pendingTabRef = useRef<string | null>(null);
  const pendingNavRef = useRef<string | null>(null);
  const hasLoadedRef = useRef(false); // prevents poll re-runs from overwriting admin edits

  // Finance editor state (deposit in £ pounds, term in years 1-5)
  const [editorDepositAmount, setEditorDepositAmount] = useState<string>("");
  const [editorTermYears, setEditorTermYears] = useState<number>(3);

  // Preview email — where the "Send preview to me" goes (pre-populated from account)
  const [previewEmail, setPreviewEmail] = useState<string>("");

  // Service type (car / commercial / hybrid) — determines customer's path
  const [serviceType, setServiceType] = useState<"car" | "commercial" | "hybrid" | null>(null);

  // Custom van state (for vans not in the system)
  const [customVanDescription, setCustomVanDescription] = useState<string>("");
  const [customVanValue, setCustomVanValue] = useState<string>("");

  // Custom extras — bespoke items not in standard configurator
  const [customExtras, setCustomExtras] = useState<Array<{id: string; description: string; pricePence: number}>>([]);
  const [newExtraDescription, setNewExtraDescription] = useState('');
  const [newExtraPrice, setNewExtraPrice] = useState('');

  const { data: quote, isLoading } = useQuery<Quote>({
    queryKey: [`/api/admin/quotes/${id}`],
    enabled: !!(user?.adminRole && user.adminRole !== "none") && !!id,
    // Poll for live workshop progress — only when quote is actively being built
    // refetchIntervalInBackground: false pauses polling when the admin tab is not visible
    refetchInterval: (query) => {
      const q = query.state.data as any;
      return q?.status === "in_build" ? 30000 : false;
    },
    refetchIntervalInBackground: false,
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

  const { data: sageStatus } = useQuery<{ connected: boolean }>({
    queryKey: ["/api/sage/status"],
    enabled: !!(user?.adminRole && user.adminRole !== "none"),
  });
  const sageConnected = sageStatus?.connected ?? false;

  // Initialize form fields when quote loads
  useEffect(() => {
    if (quote) {
      // Always sync workshop-managed build progress (updated by lads via QR page)
      {
        const rawStages = Array.isArray(quote.completedBuildStages) ? quote.completedBuildStages as Array<string | { id: string; initials: string }> : [];
        const stageIds = rawStages.map((s) => (typeof s === "string" ? s : s.id));
        const initialsMap: Record<string, string> = {};
        rawStages.forEach((s) => { if (typeof s !== "string" && s.initials) initialsMap[s.id] = s.initials; });
        setCompletedBuildStages(stageIds);
        setStageInitials(initialsMap);
      }
      // Only initialize admin-editable fields on first load — polls must not overwrite in-progress edits
      if (hasLoadedRef.current) return;
      hasLoadedRef.current = true;
      setStatus(quote.status || "new");
      setCustomBuildStages(Array.isArray(quote.customBuildStages) ? quote.customBuildStages : null);
      setCustomerConfirmed(quote.customerConfirmed ?? false);
      setVanRegistration(quote.vanRegistration ?? quote.customVanDescription ?? "");
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
      setCustomExtras((quote as any).customExtras || []);
      
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

      // Auto-sync viewing slot to chosen option when the quote loads
      if (quote.chosenOption === 'B') setViewingSlot('B');
      else setViewingSlot('A');
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
      const hasPendingNav = !!(pendingTabRef.current || pendingNavRef.current);
      if (pendingTabRef.current) {
        setActiveTab(pendingTabRef.current as any);
        pendingTabRef.current = null;
      }
      if (pendingNavRef.current) {
        setLocation(pendingNavRef.current);
        pendingNavRef.current = null;
      }
      // Prompt to resend only when customer-visible config actually changed (not for notes/status/internal fields)
      if (!hasPendingNav && hasConfigurationChanged()) {
        setShowResendDialog(true);
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
      setShowResendDialog(false);
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

  const sendFinancePreviewMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/admin/quotes/${id}/send-finance-preview`, {
        vanRegistration: vanRegistration.trim() || null,
        vanMileage: vanMileage.trim() ? parseInt(vanMileage.trim()) : null,
        previewEmail: previewEmail.trim() || undefined,
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Preview Sent",
        description: `Finance preview emailed to ${data?.sentTo ?? previewEmail ?? "your email"}.`,
      });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Error", description: "Failed to send finance preview email." });
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

  const chooseOptionMutation = useMutation({
    mutationFn: async (option: 'A' | 'B') => {
      return await apiRequest("PATCH", `/api/admin/quotes/${id}/choose-option`, { option });
    },
    onSuccess: (_, option) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotes'] });
      toast({
        title: "Option locked in",
        description: `Customer's choice of Option ${option} has been saved.`,
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save option choice",
      });
    },
  });

  const sendToDepotMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/admin/quotes/${id}/send-to-depot`);
    },
    onSuccess: () => {
      toast({
        title: "Sent to Depot",
        description: "Invoice request emailed to sharon@geg.co.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send depot email. Please try again.",
      });
    },
  });

  const pushToSageMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", `/api/sage/push/${id}`);
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${id}`] });
      toast({
        title: "Pushed to Sage",
        description: `Invoice ${data.invoiceNumber} created in Sage Business Cloud.`,
      });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Sage Error",
        description: err?.message ?? "Failed to push invoice to Sage.",
      });
    },
  });

  const undoChoiceMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("DELETE", `/api/admin/quotes/${id}/choose-option`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/quotes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/quotes'] });
      toast({
        title: "Choice undone",
        description: "The option selection has been cleared. The quote is back to a pending decision.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to undo option choice",
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
    if (vanRegistration !== (quote.vanRegistration ?? quote.customVanDescription ?? "")) return true;
    if (vanMileage !== (quote.vanMileage !== null && quote.vanMileage !== undefined ? String(quote.vanMileage) : "")) return true;
    if (customerConfirmed !== (quote.customerConfirmed ?? false)) return true;
    const serverStageIds = (quote.completedBuildStages || []).map((s: any) => typeof s === "string" ? s : s.id).sort();
    if (JSON.stringify([...completedBuildStages].sort()) !== JSON.stringify(serverStageIds)) return true;
    if (newAdminNote.trim() !== "") return true;
    return false;
  })() : false;

  // Pre-populate preview email from the logged-in user's account email
  useEffect(() => {
    if ((user as any)?.email && !previewEmail) {
      setPreviewEmail((user as any).email);
    }
  }, [(user as any)?.email]);

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
      // Remove upgrade and its stale quantity entry
      setSelectedUpgradeIds(prev => prev.filter(id => id !== upgradeId));
      setSelectedUpgrades(prev => {
        const next = { ...prev };
        delete next[upgradeId];
        return next;
      });
    } else {
      // Add upgrade
      setSelectedUpgradeIds(prev => [...prev, upgradeId]);
      if (upgrade.allowQuantity) {
        setSelectedUpgrades(prev => ({ ...prev, [upgradeId]: 1 }));
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

    // Add bespoke extras
    customExtras.forEach(e => { subtotal += e.pricePence; });
    
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

    // Check if van registration changed
    if (vanRegistration !== (quote?.vanRegistration ?? "")) return true;

    // Check if discount changed
    if (discountType !== (quote?.discountType || "")) return true;
    const origDiscountValue = quote?.discountValue
      ? (quote.discountType === "fixed" ? String(quote.discountValue / 100) : String(quote.discountValue))
      : "";
    if (discountValue !== origDiscountValue) return true;

    // Check if custom extras changed
    if (JSON.stringify(customExtras) !== JSON.stringify((quote as any)?.customExtras || [])) return true;

    // Check if custom van details changed
    const origCustomVanDesc = quote?.customVanDescription ?? (quote?.vanRegistration ?? "");
    if (customVanDescription !== origCustomVanDesc) return true;
    const origCustomVanValue = quote?.customVanValue !== null && quote?.customVanValue !== undefined
      ? String(quote.customVanValue / 100) : "";
    if (customVanValue !== origCustomVanValue) return true;

    return false;
  };

  // Auto-generate bespoke build stages from the quote's configuration
  const autoGenerateStages = (): Array<{id: string; label: string; section?: string}> => {
    const stages: Array<{id: string; label: string; section?: string}> = [];
    stages.push({ id: "prep", label: "Van Preparation" });
    const selectedKit = kits.find(k => k.id === selectedKitId);
    if (selectedKit) {
      stages.push({ id: "kit", label: `Install ${selectedKit.name}` });
    }
    const selectedUpgradesList = upgrades.filter(u => selectedUpgradeIds.includes(u.id));
    const wrapGraphicsPattern = /wrap|graphics|livery/i;
    const interiorWallPattern = /interior.wall/i;
    const isInteriorWall = (u: Upgrade) =>
      interiorWallPattern.test(u.name) || interiorWallPattern.test(u.category);
    const isWrapGraphics = (u: Upgrade) => wrapGraphicsPattern.test(u.name) || wrapGraphicsPattern.test(u.category);
    const nonWrapUpgrades = selectedUpgradesList.filter(u => !isWrapGraphics(u) && !isInteriorWall(u));
    const wrapUpgrades = selectedUpgradesList.filter(u => isWrapGraphics(u) && !isInteriorWall(u));
    const interiorWallUpgrades = selectedUpgradesList.filter(u => isInteriorWall(u) && !isWrapGraphics(u));
    for (const u of nonWrapUpgrades) {
      stages.push({ id: `upg_${u.id}`, label: u.name });
    }
    if (wrapUpgrades.length > 0) {
      stages.push({ id: "artwork_sent", label: "Artwork Sent", section: "Design Work" });
      stages.push({ id: "artwork_approved", label: "Artwork Approved", section: "Design Work" });
      stages.push({ id: "wrap_printed", label: "Wrap Printed", section: "Design Work" });
    }
    for (const u of wrapUpgrades) {
      stages.push({ id: `upg_${u.id}`, label: u.name });
    }
    if (interiorWallUpgrades.length > 0) {
      stages.push({ id: "interior_walls_artwork_sent", label: "Interior Walls Artwork Sent", section: "Design Work" });
      stages.push({ id: "interior_wall_artwork_approved", label: "Interior Wall Artwork Approved", section: "Design Work" });
      stages.push({ id: "interior_walls_ordered", label: "Interior Walls Ordered", section: "Design Work" });
    }
    for (const u of interiorWallUpgrades) {
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
      completedBuildStages: completedBuildStages.map((id) =>
        stageInitials[id] ? { id, initials: stageInitials[id] } : id
      ),
      customBuildStages: customBuildStages,
      discountType: (discountType === 'percentage' || discountType === 'fixed') ? discountType : null,
      discountValue: discountValueInPence,
      selectedUpgradeIds,
      selectedUpgrades,
      customExtras,
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

  // Pricing for the currently viewed slot (A = live edited, B = live recalculated with slotB's van)
  const isComparison = !!(quote?.comparisonConfig?.slotA && quote?.comparisonConfig?.slotB);
  const slotBStored = quote?.comparisonConfig?.slotB;

  // Live recalculation for Option B — uses slot B's van but the same kit/upgrades as Option A
  const recalculatePricingForSlotB = () => {
    if (!slotBStored) return null;
    let subtotal = 0;
    // Van price: use slot B's stored van
    const slotBVan = slotBStored.vanId ? vans.find(v => v.id === slotBStored.vanId) : null;
    if (slotBVan) {
      subtotal += slotBVan.price;
    } else if (slotBStored.customVanValue) {
      subtotal += slotBStored.customVanValue;
    }
    // Kit price: shared from slot A (use the currently selected kit)
    const selectedKit = kits.find(k => k.id === selectedKitId);
    if (selectedKit) subtotal += selectedKit.price;
    // Upgrades: shared from slot A (use current selectedUpgradeIds)
    selectedUpgradeIds.forEach(upgradeId => {
      const upgrade = upgrades.find(u => u.id === upgradeId);
      if (upgrade) {
        const quantity = selectedUpgrades[upgradeId] || 1;
        subtotal += upgrade.price * quantity;
      }
    });
    // Bespoke extras: shared from slot A
    customExtras.forEach(e => { subtotal += e.pricePence; });
    const vat = Math.round(subtotal * 0.2);
    const totalWithVat = subtotal + vat;
    // Apply same discount as Option A
    let discountAmount = 0;
    if (discountType && discountValue) {
      if (discountType === "percentage") {
        discountAmount = Math.round((totalWithVat * parseInt(discountValue)) / 100);
      } else if (discountType === "fixed") {
        discountAmount = Math.round(parseFloat(discountValue) * 100);
      }
    }
    discountAmount = Math.min(discountAmount, totalWithVat);
    const totalAfterDiscount = totalWithVat - discountAmount;
    const finalVat = Math.round(totalAfterDiscount / 6);
    const finalSubtotal = totalAfterDiscount - finalVat;
    return { subtotal: finalSubtotal, discount: discountAmount, subtotalAfterDiscount: finalSubtotal, vat: finalVat, total: totalAfterDiscount };
  };

  const slotBLivePricing = recalculatePricingForSlotB();
  const viewingPricing = (viewingSlot === 'B' && isComparison && slotBLivePricing)
    ? slotBLivePricing
    : pricing;

  // Calculate saved finance info from quote.financeInputs (deposit in pence, term in months)
  const calculateSavedFinance = (totalPence: number) => {
    if (quote?.financeInputs?.deposit === undefined || quote?.financeInputs?.deposit === null || !quote?.financeInputs?.term) return null;
    const depositAmount = quote.financeInputs.deposit; // pence
    const termMonths = quote.financeInputs.term;
    const principal = totalPence - depositAmount;
    if (principal <= 0 || termMonths <= 0) return null;
    const monthlyRate = FINANCE_APR / 12;
    const pv = Math.pow(1 + monthlyRate, termMonths);
    const monthlyPayment = Math.round((principal * monthlyRate * pv) / (pv - 1));
    const weeklyPayment = Math.round((monthlyPayment * 12) / 52);
    return { depositAmount, termMonths, monthlyPayment, weeklyPayment, principal };
  };

  const financeInfo = calculateSavedFinance(viewingPricing.total);

  // Live calculation for the editor
  const editorDepositPence = editorDepositAmount !== "" ? Math.round(parseFloat(editorDepositAmount) * 100) : 0;
  const editorTermMonths = editorTermYears * 12;
  const editorPrincipal = viewingPricing.total - editorDepositPence;
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
      {/* Sticky header bar for QuoteDetail */}
      <div className="border-b border-border/60 bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                data-testid="button-back-to-quotes"
                onClick={() => handleNavigation(fromParam === "leads" ? "/admin/leads" : "/admin/quotes")}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:block">{fromParam === "leads" ? "Leads" : "Quotes"}</span>
              </button>
              <span className="text-muted-foreground/40 text-sm">/</span>
              <h1 className="text-sm font-semibold text-foreground truncate" data-testid="text-quote-title">
                Quote #{quote.id.slice(0, 8).toUpperCase()}
              </h1>
            </div>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending}
              size="sm"
              className="bg-accent text-accent-foreground shrink-0"
              data-testid="button-save"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {updateMutation.isPending ? "Saving…" : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">

        {/* Undo option choice confirmation dialog */}
        <AlertDialog open={showUndoChoiceDialog} onOpenChange={setShowUndoChoiceDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Undo option choice?</AlertDialogTitle>
              <AlertDialogDescription>
                This will clear the current selection and return the quote to a pending decision state. Both options will be shown again with no choice highlighted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-undo-choice-cancel">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowUndoChoiceDialog(false);
                  undoChoiceMutation.mutate();
                }}
                data-testid="button-undo-choice-confirm"
              >
                Undo choice
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Resend to customer prompt — appears after every manual save */}
        <Dialog open={showResendDialog} onOpenChange={setShowResendDialog}>
          <DialogContent className="sm:max-w-md" data-testid="dialog-resend-quote">
            <DialogHeader>
              <DialogTitle>Changes saved — resend to customer?</DialogTitle>
              <DialogDescription>
                Would you like to send the updated configuration summary to the customer?
              </DialogDescription>
            </DialogHeader>
            <div className="flex items-center gap-3 py-2">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm font-medium break-all" data-testid="text-resend-email">{quote?.email}</span>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => setShowResendDialog(false)}
                data-testid="button-resend-no"
              >
                No thanks
              </Button>
              <Button
                onClick={() => sendConfirmationMutation.mutate()}
                disabled={sendConfirmationMutation.isPending}
                className="bg-accent hover:bg-accent/90"
                data-testid="button-resend-yes"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendConfirmationMutation.isPending ? "Sending..." : "Send Email"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
                    setVanRegistration(quote.vanRegistration ?? quote.customVanDescription ?? "");
                    setVanMileage(quote.vanMileage !== null && quote.vanMileage !== undefined ? String(quote.vanMileage) : "");
                    setCustomerConfirmed(quote.customerConfirmed ?? false);
                    {
                      const rawD = Array.isArray(quote.completedBuildStages) ? quote.completedBuildStages as Array<string | { id: string; initials: string }> : [];
                      setCompletedBuildStages(rawD.map(s => typeof s === "string" ? s : s.id));
                      const iMap: Record<string, string> = {};
                      rawD.forEach(s => { if (typeof s !== "string" && s.initials) iMap[s.id] = s.initials; });
                      setStageInitials(iMap);
                    }
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
          <div className="overflow-x-auto mb-6 border-b border-border/50">
            <TabsList className="grid grid-cols-5 min-w-[480px] h-10 rounded-none bg-transparent p-0 border-0 gap-0">
              <TabsTrigger value="overview" data-testid="tab-overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(86_53%_51%)] data-[state=active]:text-[hsl(86_53%_60%)] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors text-sm font-medium h-10">Overview</TabsTrigger>
              <TabsTrigger value="configuration" data-testid="tab-configuration" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(86_53%_51%)] data-[state=active]:text-[hsl(86_53%_60%)] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors text-sm font-medium h-10">Config</TabsTrigger>
              <TabsTrigger value="finance" data-testid="tab-finance" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(86_53%_51%)] data-[state=active]:text-[hsl(86_53%_60%)] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors text-sm font-medium h-10">Finance</TabsTrigger>
              <TabsTrigger value="build" data-testid="tab-build" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(86_53%_51%)] data-[state=active]:text-[hsl(86_53%_60%)] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors text-sm font-medium h-10">Build</TabsTrigger>
              <TabsTrigger value="notes" data-testid="tab-notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-[hsl(86_53%_51%)] data-[state=active]:text-[hsl(86_53%_60%)] data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground hover:text-foreground transition-colors text-sm font-medium h-10">Notes</TabsTrigger>
            </TabsList>
          </div>

          {/* Comparison slot toggle — visible on all tabs when this is a comparison quote */}
          {isComparison && (
            <div className="flex flex-wrap items-center gap-2 mb-4 p-3 rounded-md border bg-muted/30" data-testid="compare-slot-toggle">
              <GitCompare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm text-muted-foreground flex-shrink-0">Viewing:</span>
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant={viewingSlot === 'A' ? 'default' : 'outline'}
                  className={viewingSlot === 'A' ? 'bg-accent text-accent-foreground' : ''}
                  onClick={() => setViewingSlot('A')}
                  data-testid="button-view-slot-a"
                >
                  Option A {quote.chosenOption === 'A' && <CheckCircle2 className="w-3 h-3 ml-1.5" />}
                </Button>
                <Button
                  size="sm"
                  variant={viewingSlot === 'B' ? 'default' : 'outline'}
                  className={viewingSlot === 'B' ? 'bg-accent text-accent-foreground' : ''}
                  onClick={() => setViewingSlot('B')}
                  data-testid="button-view-slot-b"
                >
                  Option B {quote.chosenOption === 'B' && <CheckCircle2 className="w-3 h-3 ml-1.5" />}
                </Button>
              </div>
              <span className="text-xs text-muted-foreground">
                {quote.chosenOption ? `Option ${quote.chosenOption} has been chosen — toggle to compare pricing.` : 'Toggle to view pricing, finance, and configuration for each van option.'}
              </span>
            </div>
          )}

          <div className={`grid gap-6 ${activeTab === "finance" || activeTab === "overview" ? "lg:grid-cols-3" : ""}`}>
          {/* Left Column / Main content */}
          <div className={`space-y-6 ${activeTab === "finance" || activeTab === "overview" ? "lg:col-span-2" : ""}`}>
            {/* Combined Overview Card — Customer Header + Journey Timeline + Actions */}
            {activeTab === "overview" && <Card>
              {/* ── Customer Header ── */}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                      {editingCustomer ? "Edit Customer Details" : "Customer Details"}
                    </p>
                    {!editingCustomer && (
                      <>
                        <p className="text-2xl font-bold text-foreground leading-tight" data-testid="text-customer-name">
                          {quote.userName}
                        </p>
                        {quote.phone && (
                          <p className="text-xl font-semibold text-foreground mt-1" data-testid="text-customer-phone">
                            {quote.phone}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-2">
                          {quote.email && <span className="text-sm text-muted-foreground" data-testid="text-customer-email">{quote.email}</span>}
                          {quote.company && <span className="text-sm text-muted-foreground" data-testid="text-customer-company">{quote.company}</span>}
                          {quote.createdAt && (
                            <span className="text-sm text-muted-foreground">
                              {new Date(quote.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                          )}
                          {(quote as any).staffName && (
                            <span className="text-sm text-muted-foreground" data-testid="text-quote-staff-name">
                              Quoted by {(quote as any).staffName}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
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

              {/* Edit Form */}
              {editingCustomer && (
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    <div className="grid md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Name</label>
                        <Input value={editCustomerName} onChange={(e) => setEditCustomerName(e.target.value)} data-testid="input-edit-customer-name" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <Input type="email" value={editCustomerEmail} onChange={(e) => setEditCustomerEmail(e.target.value)} data-testid="input-edit-customer-email" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                        <Input type="tel" value={editCustomerPhone} onChange={(e) => setEditCustomerPhone(e.target.value)} data-testid="input-edit-customer-phone" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-muted-foreground">Business Name</label>
                        <Input value={editCustomerCompany} onChange={(e) => setEditCustomerCompany(e.target.value)} placeholder="e.g. Smith Tyres Ltd" data-testid="input-edit-customer-company" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        onClick={() => {
                          updateMutation.mutate({ userName: editCustomerName, email: editCustomerEmail, phone: editCustomerPhone, company: editCustomerCompany || null } as any);
                          setEditingCustomer(false);
                        }}
                        disabled={updateMutation.isPending}
                        data-testid="button-save-customer"
                      >
                        Save
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingCustomer(false)} data-testid="button-cancel-edit-customer">
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              )}

              {!editingCustomer && (<>
                <Separator />

                {/* ── Journey Timeline ── */}
                <CardContent className="pt-4 pb-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Customer Journey</p>
                  {(() => {
                    const isCancelled = status === "cancelled";
                    const paymentStatuses = ["awaiting_deposit", "awaiting_finance", "deposit_taken", "finance_approved"];
                    const paymentSubLabel = paymentStatuses.includes(status) ? STATUS_LABELS[status] : null;
                    const steps = [
                      { id: "enquiry", label: "Enquiry Received", isDone: true, detail: quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null },
                      { id: "contacted", label: "Customer Contacted", isDone: status !== "new", detail: null },
                      { id: "spec_sent", label: "Spec Sent to Customer", isDone: !!(quote as any).specSentAt, detail: (quote as any).specSentAt ? new Date((quote as any).specSentAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null },
                      { id: "spec_confirmed", label: "Spec Confirmed", isDone: (quote as any).specApprovalStatus === "approved", detail: null },
                      { id: "payment", label: "Payment / Finance", isDone: ["deposit_taken", "finance_approved", "in_build", "completed"].includes(status), detail: paymentSubLabel },
                      { id: "in_build", label: "In Build", isDone: ["in_build", "completed"].includes(status), detail: null },
                      { id: "complete", label: "Conversion Complete", isDone: status === "completed", detail: null },
                    ];
                    const firstIncompleteIdx = isCancelled ? -1 : steps.findIndex(s => !s.isDone);
                    const currentIdx = firstIncompleteIdx === -1 ? steps.length : firstIncompleteIdx;

                    if (isCancelled) {
                      return (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-destructive/10">
                            <XCircle className="w-3.5 h-3.5 text-destructive" />
                          </div>
                          <span className="text-sm font-medium text-destructive">Quote Cancelled</span>
                        </div>
                      );
                    }

                    return (
                      <div>
                        {steps.map((step, i) => {
                          const isDone = step.isDone;
                          const isCurrent = i === currentIdx;
                          const isLast = i === steps.length - 1;
                          const specRejected = step.id === "spec_confirmed" && (quote as any).specApprovalStatus === "rejected";
                          const specAwaiting = step.id === "spec_confirmed" && !!(quote as any).specSentAt && !(quote as any).specApprovalStatus;
                          return (
                            <div key={step.id} className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isDone ? "bg-accent text-accent-foreground" :
                                  isCurrent ? "ring-2 ring-accent bg-accent/10 text-accent" :
                                  "bg-muted text-muted-foreground"
                                }`}>
                                  {isDone ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                                </div>
                                {!isLast && <div className={`w-0.5 flex-1 mt-0.5 mb-0.5 min-h-[1rem] ${isDone ? "bg-accent/40" : "bg-muted"}`} />}
                              </div>
                              <div className="pb-2.5 flex-1">
                                <div className="flex items-center gap-2 flex-wrap min-h-[1.5rem]">
                                  <span className={`text-sm font-medium ${isDone ? "text-foreground" : isCurrent ? "text-accent" : "text-muted-foreground"}`}>
                                    {step.label}
                                  </span>
                                  {step.detail && <span className="text-xs text-muted-foreground">({step.detail})</span>}
                                  {specAwaiting && (
                                    <Badge variant="secondary" className="text-xs no-default-active-elevate">Awaiting response</Badge>
                                  )}
                                  {specRejected && (
                                    <Badge variant="outline" className="text-xs border-orange-500 text-orange-500 no-default-active-elevate">Issues flagged</Badge>
                                  )}
                                </div>
                                {specRejected && (quote as any).specApprovalComments && (
                                  <p className="text-xs text-muted-foreground mt-0.5 italic">"{(quote as any).specApprovalComments}"</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </CardContent>

                {/* ── Primary Action Area ── */}
                {canEdit && status !== "completed" && status !== "cancelled" && (<>
                  <Separator />
                  <CardContent className="pt-4 space-y-3">
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Next Step</p>
                    <div className="flex flex-col gap-2">
                      {status === "new" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setFuDate(new Date().toISOString().split("T")[0]);
                            setFuNotes("");
                            setFuDialogOpen(true);
                          }}
                          disabled={quickStatusMutation.isPending}
                          data-testid="button-mark-contacted"
                        >
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
                          <Button size="sm" variant="outline" onClick={() => quickStatusMutation.mutate("finance_declined")} disabled={quickStatusMutation.isPending} data-testid="button-finance-declined">
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

                    {/* Spec Email — shown after initial contact while spec not yet confirmed */}
                    {status !== "new" && (quote as any).specApprovalStatus !== "approved" && (
                      <div className="space-y-1.5">
                        {/* Send button + approval badge inline */}
                        <div className="flex flex-wrap gap-2 items-center" data-testid="section-spec-approval">
                          <Button
                            onClick={() => sendConfirmationMutation.mutate()}
                            disabled={sendConfirmationMutation.isPending}
                            variant={(quote as any).specSentAt ? "outline" : "default"}
                            size="sm"
                            className="flex-1 min-w-0"
                            data-testid="button-send-confirmation"
                          >
                            <Send className="w-3.5 h-3.5 mr-1.5" />
                            {sendConfirmationMutation.isPending ? "Sending..." : (quote as any).specSentAt ? "Resend Spec Email" : "Send Spec Summary Email"}
                          </Button>
                          {(quote as any).specSentAt && !(quote as any).specApprovalStatus && (
                            <Badge variant="secondary" className="no-default-active-elevate gap-1.5" data-testid="text-approval-pending">
                              <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                              Awaiting response
                            </Badge>
                          )}
                          {(quote as any).specApprovalStatus === "rejected" && (
                            <Badge variant="outline" className="border-orange-500 text-orange-500 no-default-active-elevate gap-1" data-testid="section-approval-rejected">
                              <XCircle className="w-3 h-3" />
                              Issues flagged
                            </Badge>
                          )}
                        </div>
                        {/* Last sent timestamp */}
                        {(quote as any).specSentAt && (
                          <p className="text-xs text-muted-foreground" data-testid="text-spec-sent-at">
                            Last sent: {new Date((quote as any).specSentAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                          </p>
                        )}
                        {/* Customer rejection comments */}
                        {(quote as any).specApprovalStatus === "rejected" && (quote as any).specApprovalComments && (
                          <div className="bg-orange-500/10 rounded p-2.5 text-xs whitespace-pre-wrap" data-testid="text-approval-comments">
                            <span className="font-medium text-foreground">Their comments: </span>
                            <span className="text-muted-foreground">{(quote as any).specApprovalComments}</span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Sends the van, pack, upgrades, and price to {quote.email}. Customer can approve or flag issues via a link.
                        </p>
                      </div>
                    )}

                    {/* Spec confirmed — option to resend */}
                    {status !== "new" && (quote as any).specApprovalStatus === "approved" && (
                      <div className="flex flex-wrap gap-2 items-center">
                        <Button
                          onClick={() => sendConfirmationMutation.mutate()}
                          disabled={sendConfirmationMutation.isPending}
                          variant="outline"
                          size="sm"
                          data-testid="button-send-confirmation"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Resend Spec Email
                        </Button>
                        <Badge variant="default" className="bg-accent text-accent-foreground no-default-active-elevate gap-1" data-testid="text-approval-confirmed">
                          <CheckCircle className="w-3 h-3" />
                          Spec confirmed
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </>)}


                {/* ── Manual Status Override ── */}
                <Separator />
                <CardContent className="pt-3 pb-4">
                  <Label htmlFor="quote-status" className="text-xs text-muted-foreground">Manual status override</Label>
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
                        <SelectItem key={s} value={s}>{STATUS_LABELS[s] ?? s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">Save changes to apply.</p>
                </CardContent>
              </>)}
            </Card>}

            {/* Comparison Options — Configuration tab (shown only when comparisonConfig present) */}
            {activeTab === "configuration" && quote?.comparisonConfig && (
              <Card data-testid="card-comparison-options">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GitCompare className="w-5 h-5" />
                    Comparison Quote
                    {quote.chosenOption && (
                      <Badge variant="default" className="bg-accent text-accent-foreground ml-2 no-default-active-elevate">
                        Option {quote.chosenOption} chosen
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Two configurations were submitted. Review both options and lock in the customer's choice.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option A */}
                    <div className={`relative rounded-md border p-4 space-y-2 transition-opacity ${quote.chosenOption === 'A' ? 'border-accent bg-accent/5' : quote.chosenOption === 'B' ? 'opacity-40' : ''}`} data-testid="card-option-a">
                      {quote.chosenOption === 'B' && (
                        <div className="absolute inset-0 rounded-md flex items-center justify-center bg-background/10 z-10">
                          <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded">Not chosen</span>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-sm">Option A (Primary)</p>
                        {quote.chosenOption === 'A' && (
                          <Badge variant="default" className="bg-accent text-accent-foreground text-xs no-default-active-elevate">
                            <CheckCircle2 className="w-3 h-3 mr-1" />Chosen
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        {(() => {
                          const slotAVan = vans.find(v => v.id === quote.comparisonConfig!.slotA?.vanId);
                          return slotAVan ? (
                            <p><span className="text-foreground font-medium">Van:</span> {slotAVan.year} {slotAVan.make} {slotAVan.model}</p>
                          ) : quote.comparisonConfig!.slotA?.vanRegistration ? (
                            <p><span className="text-foreground font-medium">Van Reg:</span> {quote.comparisonConfig!.slotA.vanRegistration}</p>
                          ) : (
                            <p className="italic">No van specified</p>
                          );
                        })()}
                        {(() => {
                          const slotAKit = kits.find(k => k.id === quote.comparisonConfig!.slotA?.kitId);
                          return slotAKit ? (
                            <p><span className="text-foreground font-medium">Pack:</span> {slotAKit.name}</p>
                          ) : null;
                        })()}
                        {selectedUpgradeIds.length > 0 && (
                          <p><span className="text-foreground font-medium">Upgrades:</span> {selectedUpgradeIds.length} selected</p>
                        )}
                        {pricing.total > 0 && (
                          <p className="font-medium text-foreground">
                            Est. Total: £{(pricing.total / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                          </p>
                        )}
                        {/* Finance illustration for Option A */}
                        {(() => {
                          const fi = quote.financeInputs as { deposit?: number; term?: number } | null | undefined;
                          const slotTotal = pricing.total;
                          if (!fi?.term || !slotTotal || slotTotal <= 0) return null;
                          const depositPence = fi.deposit ?? 0;
                          const principal = (slotTotal - depositPence) / 100;
                          if (principal <= 0) return null;
                          const r = 0.109 / 12;
                          const n = fi.term;
                          const monthly = Math.round(principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) * 100);
                          const weekly = Math.round(monthly * 12 / 52);
                          return (
                            <div className="border-t pt-1.5 mt-1.5 space-y-0.5">
                              <p className="text-accent font-semibold">£{(monthly/100).toLocaleString('en-GB',{minimumFractionDigits:2})}/month</p>
                              <p className="text-xs">£{(weekly/100).toLocaleString('en-GB',{minimumFractionDigits:2})}/week approx.</p>
                              <p className="text-xs opacity-70">{fi.term} months · 10.9% APR · £{(depositPence/100).toLocaleString('en-GB',{minimumFractionDigits:2})} dep.</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Option B */}
                    <div className={`relative rounded-md border p-4 space-y-2 transition-opacity ${quote.chosenOption === 'B' ? 'border-accent bg-accent/5' : quote.chosenOption === 'A' ? 'opacity-40' : ''}`} data-testid="card-option-b">
                      {quote.chosenOption === 'A' && (
                        <div className="absolute inset-0 rounded-md flex items-center justify-center bg-background/10 z-10">
                          <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded">Not chosen</span>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-semibold text-sm">Option B (Alternative)</p>
                        {quote.chosenOption === 'B' && (
                          <Badge variant="default" className="bg-accent text-accent-foreground text-xs no-default-active-elevate">
                            <CheckCircle2 className="w-3 h-3 mr-1" />Chosen
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm space-y-1 text-muted-foreground">
                        {(() => {
                          const slotBVan = vans.find(v => v.id === quote.comparisonConfig!.slotB?.vanId);
                          return slotBVan ? (
                            <p><span className="text-foreground font-medium">Van:</span> {slotBVan.year} {slotBVan.make} {slotBVan.model}</p>
                          ) : quote.comparisonConfig!.slotB?.vanRegistration ? (
                            <p><span className="text-foreground font-medium">Van Reg:</span> {quote.comparisonConfig!.slotB.vanRegistration}</p>
                          ) : (
                            <p className="italic">No van specified</p>
                          );
                        })()}
                        {(() => {
                          const slotBKit = kits.find(k => k.id === quote.comparisonConfig!.slotB?.kitId);
                          return slotBKit ? (
                            <p><span className="text-foreground font-medium">Pack:</span> {slotBKit.name}</p>
                          ) : null;
                        })()}
                        {selectedUpgradeIds.length > 0 && (
                          <p><span className="text-foreground font-medium">Upgrades:</span> {selectedUpgradeIds.length} selected</p>
                        )}
                        {slotBLivePricing && slotBLivePricing.total > 0 && (
                          <p className="font-medium text-foreground">
                            Est. Total: £{(slotBLivePricing.total / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                          </p>
                        )}
                        {/* Finance illustration for Option B */}
                        {(() => {
                          const fi = quote.financeInputs as { deposit?: number; term?: number } | null | undefined;
                          const slotTotal = slotBLivePricing?.total ?? quote.comparisonConfig!.slotB?.estTotal;
                          if (!fi?.term || !slotTotal || slotTotal <= 0) return null;
                          const depositPence = fi.deposit ?? 0;
                          const principal = (slotTotal - depositPence) / 100;
                          if (principal <= 0) return null;
                          const r = 0.109 / 12;
                          const n = fi.term;
                          const monthly = Math.round(principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) * 100);
                          const weekly = Math.round(monthly * 12 / 52);
                          return (
                            <div className="border-t pt-1.5 mt-1.5 space-y-0.5">
                              <p className="text-accent font-semibold">£{(monthly/100).toLocaleString('en-GB',{minimumFractionDigits:2})}/month</p>
                              <p className="text-xs">£{(weekly/100).toLocaleString('en-GB',{minimumFractionDigits:2})}/week approx.</p>
                              <p className="text-xs opacity-70">{fi.term} months · 10.9% APR · £{(depositPence/100).toLocaleString('en-GB',{minimumFractionDigits:2})} dep.</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {/* Option choice buttons */}
                  {!quote.chosenOption ? (
                    <div className="flex flex-wrap gap-3 pt-2">
                      <p className="text-sm text-muted-foreground w-full">Lock in the customer's final choice:</p>
                      <Button
                        variant="outline"
                        onClick={() => chooseOptionMutation.mutate('A')}
                        disabled={chooseOptionMutation.isPending}
                        data-testid="button-choose-option-a"
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        Customer chose Option A
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => chooseOptionMutation.mutate('B')}
                        disabled={chooseOptionMutation.isPending}
                        data-testid="button-choose-option-b"
                      >
                        <Check className="w-4 h-4 mr-1.5" />
                        Customer chose Option B
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 pt-2">
                      <CheckCircle className="w-4 h-4 text-accent flex-shrink-0" />
                      <p className="text-sm text-muted-foreground flex-1 min-w-0">
                        Option {quote.chosenOption} has been locked in as the customer's final choice.
                      </p>
                      {/* Only allow changing/undoing choice before build starts */}
                      {!quote.buildStage ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => chooseOptionMutation.mutate(quote.chosenOption === 'A' ? 'B' : 'A')}
                            disabled={chooseOptionMutation.isPending || undoChoiceMutation.isPending}
                            className="text-xs"
                            data-testid="button-change-choice"
                          >
                            Change to Option {quote.chosenOption === 'A' ? 'B' : 'A'}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowUndoChoiceDialog(true)}
                            disabled={chooseOptionMutation.isPending || undoChoiceMutation.isPending}
                            className="text-xs text-muted-foreground"
                            data-testid="button-undo-choice"
                          >
                            Undo choice
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic" data-testid="text-choice-locked">
                          Cannot change — build in progress
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Configuration Editor — Configuration tab */}
            {activeTab === "configuration" && <Card>
              <Collapsible open={isConfigEditorOpen} onOpenChange={setIsConfigEditorOpen}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex flex-wrap items-center gap-2">
                        <Settings className="w-5 h-5" />
                        Edit Configuration
                        {isComparison && (
                          <Badge variant="outline" className="text-xs ml-1 no-default-active-elevate">
                            Option {viewingSlot}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {isComparison && viewingSlot === 'B'
                          ? 'Viewing Option B pricing — kit, upgrades and edit controls apply to Option A (primary).'
                          : 'Modify the van, kit, and equipment selections'
                        }
                      </CardDescription>
                    </div>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" data-testid="button-toggle-config-editor">
                        <ChevronDown className={`w-4 h-4 transition-transform ${isConfigEditorOpen ? 'rotate-180' : ''}`} />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  {/* Option B van info banner */}
                  {isComparison && viewingSlot === 'B' && (() => {
                    const bVan = vans.find(v => v.id === quote.comparisonConfig?.slotB?.vanId);
                    const bVanLabel = bVan
                      ? `${bVan.year} ${bVan.make} ${bVan.model} — £${(bVan.price / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                      : quote.comparisonConfig?.slotB?.vanRegistration
                        ? `Own van (${quote.comparisonConfig.slotB.vanRegistration})`
                        : null;
                    return bVanLabel ? (
                      <div className="mt-3 flex items-center gap-2 p-2.5 rounded-md bg-muted/50 border text-sm">
                        <Truck className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-muted-foreground">Option B van:</span>
                        <span className="font-medium">{bVanLabel}</span>
                      </div>
                    ) : null;
                  })()}
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

                  {/* Reg Number — shown for all van types */}
                  {selectedVanId && selectedVanId !== "none" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="van-reg-inline" className="text-sm">Reg Number</Label>
                      <Input
                        id="van-reg-inline"
                        placeholder="e.g. AB12 CDE"
                        value={vanRegistration}
                        onChange={(e) => setVanRegistration(e.target.value.toUpperCase())}
                        className="font-mono uppercase"
                        data-testid="input-config-van-registration"
                      />
                    </div>
                  )}

                  {/* Custom van fields — shown only when custom is selected */}
                  {selectedVanId === "custom" && (
                    <div className="rounded-md border p-4 space-y-3 bg-muted/30">
                      <p className="text-xs text-muted-foreground font-medium">Enter the customer's van cost below. It will be included in the quote total.</p>
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
                  <div className="mt-2 space-y-4 border rounded-md p-4">
                    {upgradeCategories.map((category) => {
                      // Hide the "commercial" category entirely for car/personal customers
                      if (category === "commercial" && serviceType === "car") return null;

                      const categoryUpgrades = upgrades.filter(u => {
                        if (!u.published || u.category !== category) return false;
                        // Hide commercial-only items from car/personal customers
                        if (serviceType === "car" && u.forCommercial) return false;
                        // Hide car-only items from commercial/hybrid customers
                        if ((serviceType === "commercial" || serviceType === "hybrid") && u.carOnly) return false;
                        // Hide hybrid-excluded items from hybrid customers (but still show to commercial)
                        if (serviceType === "hybrid" && (u as any).hideForHybrid) return false;
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
                                    const variantIds = variants.map(v => v.id);
                                    if (value === "none") {
                                      setSelectedUpgradeIds(prev => prev.filter(id => !variantIds.includes(id)));
                                      setSelectedUpgrades(prev => {
                                        const next = { ...prev };
                                        variantIds.forEach(id => delete next[id]);
                                        return next;
                                      });
                                    } else {
                                      setSelectedUpgradeIds(prev => [
                                        ...prev.filter(id => !variantIds.includes(id)),
                                        value,
                                      ]);
                                      setSelectedUpgrades(prev => {
                                        const next = { ...prev };
                                        variantIds.forEach(id => delete next[id]);
                                        return next;
                                      });
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

                {/* Bespoke Extras */}
                <div className="space-y-2">
                  <Label>Bespoke Extras</Label>
                  <p className="text-xs text-muted-foreground">Custom items not in the standard configurator</p>
                  {customExtras.length > 0 && (
                    <div className="space-y-1.5">
                      {customExtras.map((extra) => (
                        <div key={extra.id} className="flex items-center gap-2 text-sm p-2 rounded bg-muted/40">
                          <span className="flex-1 font-medium">{extra.description}</span>
                          <span className="text-muted-foreground shrink-0">£{(extra.pricePence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setCustomExtras(prev => prev.filter(e => e.id !== extra.id))}
                            data-testid={`button-remove-extra-${extra.id}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[150px]">
                      <Label className="text-xs text-muted-foreground mb-1 block">Description</Label>
                      <Input
                        value={newExtraDescription}
                        onChange={e => setNewExtraDescription(e.target.value)}
                        placeholder="e.g. Custom roof bar"
                        className="text-sm"
                        data-testid="input-extra-description"
                      />
                    </div>
                    <div className="w-28">
                      <Label className="text-xs text-muted-foreground mb-1 block">Price (£ ex. VAT)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newExtraPrice}
                        onChange={e => setNewExtraPrice(e.target.value)}
                        placeholder="0.00"
                        className="text-sm"
                        data-testid="input-extra-price-qd"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const desc = newExtraDescription.trim();
                        const price = parseFloat(newExtraPrice);
                        if (!desc || isNaN(price) || price < 0) return;
                        setCustomExtras(prev => [...prev, {
                          id: crypto.randomUUID(),
                          description: desc,
                          pricePence: Math.round(price * 100),
                        }]);
                        setNewExtraDescription('');
                        setNewExtraPrice('');
                      }}
                      disabled={!newExtraDescription.trim() || !newExtraPrice || parseFloat(newExtraPrice) < 0}
                      data-testid="button-add-extra-qd"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />Add
                    </Button>
                  </div>
                </div>

                {/* Discount */}
                <div className="space-y-2">
                  <Label>Discount</Label>
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={discountType || "none"}
                      onValueChange={(v: any) => setDiscountType(v === "none" ? "" : v)}
                    >
                      <SelectTrigger className="w-full sm:w-44" data-testid="select-config-discount-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No discount</SelectItem>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed">Fixed amount (£)</SelectItem>
                      </SelectContent>
                    </Select>
                    {discountType && (
                      <div className="relative flex-1">
                        {discountType === "percentage"
                          ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">%</span>
                          : <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm select-none">£</span>
                        }
                        <Input
                          type="number"
                          min="0"
                          max={discountType === "percentage" ? "100" : undefined}
                          step={discountType === "percentage" ? "1" : "0.01"}
                          value={discountValue}
                          onChange={(e) => setDiscountValue(e.target.value)}
                          className={discountType === "percentage" ? "pr-8" : "pl-7"}
                          placeholder={discountType === "percentage" ? "e.g. 10" : "e.g. 500"}
                          data-testid="input-config-discount-value"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Preview */}
                <div className="pt-4 border-t">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="text-sm font-medium">
                      {isComparison ? `Option ${viewingSlot} Pricing:` : 'Updated Pricing:'}
                    </div>
                    {isComparison && viewingSlot === 'B' && (
                      <span className="text-xs text-muted-foreground">Van: {(() => {
                        const bVan = vans.find(v => v.id === quote.comparisonConfig?.slotB?.vanId);
                        return bVan ? `${bVan.year} ${bVan.make} ${bVan.model}` : (quote.comparisonConfig?.slotB?.vanRegistration ?? 'own van');
                      })()}</span>
                    )}
                  </div>
                  {(() => {
                    const adj = viewingPricing;
                    const subtotal = adj.subtotal;
                    const vat = adj.vat;
                    const preTotalPence = adj.total + adj.discount;
                    const hasDiscount = adj.discount > 0;
                    return (
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span className="font-medium">£{(subtotal / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">VAT (20%):</span>
                          <span className="font-medium">£{(vat / 100).toLocaleString()}</span>
                        </div>
                        {hasDiscount && (
                          <>
                            <div className="flex justify-between text-muted-foreground">
                              <span>Before discount:</span>
                              <span className="line-through">£{(preTotalPence / 100).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between text-destructive font-medium">
                              <span>Discount:</span>
                              <span>-£{(adj.discount / 100).toLocaleString()}</span>
                            </div>
                          </>
                        )}
                        <div className="flex justify-between pt-1 border-t">
                          <span className="font-semibold">Total:</span>
                          <span className="font-semibold">£{(adj.total / 100).toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}
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
                          const prevSection = idx > 0 ? activeStages[idx - 1].section : undefined;
                          const showSectionHeader = stage.section && stage.section !== prevSection;
                          return (
                            <div key={stage.id}>
                            {showSectionHeader && (
                              <div className="pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground" data-testid={`section-header-${stage.section!.toLowerCase().replace(/\s+/g, "-")}`}>
                                {stage.section}
                              </div>
                            )}
                            <div
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
                                <Badge
                                  variant="secondary"
                                  className="text-xs font-mono shrink-0"
                                  data-testid={`badge-stage-done-${stage.id}`}
                                >
                                  {stageInitials[stage.id] ? stageInitials[stage.id] : "Done"}
                                </Badge>
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
                        <div className="flex flex-wrap items-center justify-between gap-1 text-sm mb-2">
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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
                  {/* Comparison mode gate */}
                  {isComparison && !quote.chosenOption && (
                    <div className="flex items-start gap-3 p-3 rounded-md border border-amber-500/40 bg-amber-500/5" data-testid="banner-awaiting-choice">
                      <XCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-amber-600 dark:text-amber-400">Awaiting customer choice</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          The customer has not yet selected Option A or Option B. Wait for them to choose via the email link, or manually lock in their choice on the Configuration tab before sending to finance.
                        </p>
                      </div>
                    </div>
                  )}
                  {isComparison && quote.chosenOption && (() => {
                    const chosenVan = quote.chosenOption === 'B'
                      ? vans.find(v => v.id === quote.comparisonConfig?.slotB?.vanId)
                      : vans.find(v => v.id === quote.comparisonConfig?.slotA?.vanId);
                    const chosenVanLabel = chosenVan
                      ? `${chosenVan.year} ${chosenVan.make} ${chosenVan.model}`
                      : quote.chosenOption === 'B'
                        ? (quote.comparisonConfig?.slotB?.vanRegistration ?? 'own van')
                        : (quote.comparisonConfig?.slotA?.vanRegistration ?? 'own van');
                    return (
                      <div className="flex items-start gap-3 p-3 rounded-md border border-accent/40 bg-accent/5" data-testid="banner-chosen-option">
                        <CheckCircle2 className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">Sending spec for Option {quote.chosenOption}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Van: {chosenVanLabel} — this is the customer's confirmed choice.</p>
                        </div>
                      </div>
                    );
                  })()}
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
                    <Button
                      className="w-full bg-[#8bc440e6] text-[#191919] border-green-600"
                      onClick={() => sendFinanceMutation.mutate()}
                      disabled={!customerConfirmed || sendFinanceMutation.isPending || (isComparison && !quote.chosenOption)}
                      data-testid="button-send-finance"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {sendFinanceMutation.isPending
                        ? "Sending..."
                        : isComparison && quote.chosenOption
                          ? `Send Option ${quote.chosenOption} to Finance`
                          : "Send to Finance Company"}
                    </Button>
                    <div className="space-y-1">
                      <Input
                        type="email"
                        placeholder="Email to send preview to"
                        value={previewEmail}
                        onChange={e => setPreviewEmail(e.target.value)}
                        className="text-xs"
                        data-testid="input-preview-email"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => sendFinancePreviewMutation.mutate()}
                        disabled={sendFinancePreviewMutation.isPending || !previewEmail.trim() || (isComparison && !quote.chosenOption)}
                        data-testid="button-send-finance-preview"
                      >
                        <Send className="w-3 h-3 mr-2" />
                        {sendFinancePreviewMutation.isPending ? "Sending..." : "Send preview to me"}
                      </Button>
                    </div>
                    {!customerConfirmed && <p className="text-xs text-muted-foreground text-center">Tick "Customer confirms the configurator" to enable</p>}
                    {isComparison && !quote.chosenOption && <p className="text-xs text-muted-foreground text-center">Customer must choose an option before sending to finance</p>}
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
                        const isCustomerEntry = note.author === 'Customer';
                        const isApprovedEntry = isCustomerEntry && note.text.toLowerCase().includes('confirmed');
                        const isEditing = !isCustomerEntry && editingNote?.noteType === 'admin' && editingNote?.timestamp === note.timestamp;
                        return (
                          <div
                            key={index}
                            className={`p-3 rounded-lg border ${isCustomerEntry
                              ? isApprovedEntry
                                ? 'bg-accent/5 border-accent/30'
                                : 'bg-orange-500/5 border-orange-500/30'
                              : 'bg-muted/50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5">
                                {isCustomerEntry && (
                                  isApprovedEntry
                                    ? <CheckCircle className="w-3.5 h-3.5 text-accent flex-shrink-0" />
                                    : <XCircle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                                )}
                                <span className={`text-xs font-medium ${isCustomerEntry ? (isApprovedEntry ? 'text-accent' : 'text-orange-500') : 'text-muted-foreground'}`}>
                                  {note.author || 'Admin'}
                                </span>
                              </div>
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
                                {!isCustomerEntry && !isEditing && (
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

            {/* ── Max AI Chat Transcript ── shown in overview when quote came via AI */}
            {activeTab === "overview" && (quote as any).aiConversation && (() => {
              const conv = (quote as any).aiConversation;
              const msgs: Array<{role: string; content: string}> = Array.isArray(conv.messages)
                ? conv.messages
                : (typeof conv.messages === "string" ? JSON.parse(conv.messages) : []);
              return (
                <Card data-testid="card-ai-transcript">
                  <Collapsible defaultOpen={false}>
                    <CollapsibleTrigger asChild>
                      <CardHeader className="cursor-pointer pb-3 hover-elevate rounded-t-md">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#8bc440]/30 shrink-0">
                              <img src={maxAvatarSrc} alt="Max" className="w-full h-full object-cover object-top" />
                            </div>
                            <div>
                              <CardTitle className="text-base">Max AI Chat Transcript</CardTitle>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {msgs.length} message{msgs.length !== 1 ? "s" : ""} · {conv.status?.replace("_", " ")}
                                {conv.includes_48v && " · 48V pitched"}
                              </p>
                            </div>
                          </div>
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        </div>
                      </CardHeader>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <CardContent className="pt-0 pb-4">
                        <div className="max-h-96 overflow-y-auto space-y-2.5 pr-1">
                          {msgs.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-6">No messages recorded.</p>
                          ) : msgs.map((m, i) => (
                            <div key={i} className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                              {m.role === "assistant" && (
                                <div className="w-5 h-5 rounded-full overflow-hidden shrink-0 mb-0.5">
                                  <img src={maxAvatarSrc} alt="Max" className="w-full h-full object-cover object-top" />
                                </div>
                              )}
                              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                                m.role === "user"
                                  ? "bg-[#8bc440]/20 text-foreground rounded-br-sm"
                                  : "bg-muted text-foreground rounded-bl-sm"
                              }`}>
                                {m.content}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })()}

          </div>

          {/* Right Column - shown only in overview and finance tabs */}
          {(activeTab === "overview" || activeTab === "finance") && <div className="lg:col-span-1 space-y-6">
            {/* Overview-only sections */}
            {activeTab === "overview" && <>

            {/* Max AI Chat link — shown when this quote originated from a Max chat */}
            {(quote as any)?.aiConversation && (() => {
              const ai = (quote as any).aiConversation;
              const msgs: Array<{role: string; content: string}> = Array.isArray(ai.messages) ? ai.messages : [];
              const displayName = ai.contact_name || ai.contactName || quote?.userName || "Customer";
              return (
                <Card data-testid="card-ai-conversation">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="w-4 h-4 text-[#8bc440]" />
                      Max AI Chat
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full overflow-hidden ring-1 ring-[#8bc440]/30 shrink-0">
                        <img src={maxAvatarSrc} alt="Max" className="w-full h-full object-cover object-top" />
                      </div>
                      <div>
                        <p className="text-xs font-medium">{displayName}</p>
                        <p className="text-xs text-muted-foreground">
                          {ai.created_at ? new Date(ai.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ai.van_size && <Badge variant="secondary" className="text-xs">{ai.van_size}</Badge>}
                      {ai.van_type && <Badge variant="secondary" className="text-xs capitalize">{ai.van_type}</Badge>}
                      {ai.finance_preference && <Badge variant="secondary" className="text-xs capitalize">{ai.finance_preference}</Badge>}
                      {(ai.includes_48v ?? ai.includes48v) && <Badge variant="secondary" className="text-xs bg-[#8bc440]/15 text-[#8bc440]">48V</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{msgs.length} message{msgs.length !== 1 ? "s" : ""} in conversation</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowAiTranscript(true)}
                      data-testid="button-view-ai-transcript"
                    >
                      <Eye className="w-3.5 h-3.5 mr-1.5" />
                      View Transcript
                    </Button>
                  </CardContent>
                </Card>
              );
            })()}

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

            {/* Send to Admin */}
            <Card>
              <CardContent className="pt-4 pb-4 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Admin</p>
                <Button
                  size="sm"
                  className="w-full bg-[#8bc440e6] text-[#191919] border-green-600"
                  onClick={() => sendToDepotMutation.mutate()}
                  disabled={sendToDepotMutation.isPending}
                  data-testid="button-send-to-depot"
                >
                  <Send className="w-3.5 h-3.5 mr-1.5" />
                  {sendToDepotMutation.isPending ? "Sending..." : "Send to Admin"}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Emails the full build spec and pricing to sharon@geg.co to raise an invoice.
                </p>
              </CardContent>
            </Card>

            {/* Push to Sage */}
            {canEdit && (
              <Card>
                <CardContent className="pt-4 pb-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Sage Accounting</p>
                  {(quote as any).sageInvoiceId ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-[#8bc440]" />
                        <p className="text-sm font-medium">Pushed to Sage</p>
                      </div>
                      {(quote as any).sagePushedAt && (
                        <p className="text-xs text-muted-foreground">
                          {new Date((quote as any).sagePushedAt).toLocaleDateString("en-GB", {
                            day: "2-digit", month: "short", year: "numeric",
                            hour: "2-digit", minute: "2-digit",
                          })}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground font-mono">
                        Ref: MTVC-{quote.id.slice(0, 8).toUpperCase()}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        onClick={() => pushToSageMutation.mutate()}
                        disabled={pushToSageMutation.isPending}
                        data-testid="button-push-sage-again"
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                        {pushToSageMutation.isPending ? "Pushing..." : "Push Again"}
                      </Button>
                    </div>
                  ) : (
                    <>
                      <Button
                        size="sm"
                        className="w-full bg-[#1c5f3a] text-white"
                        onClick={() => pushToSageMutation.mutate()}
                        disabled={pushToSageMutation.isPending || !sageConnected}
                        data-testid="button-push-sage"
                      >
                        <Building2 className="w-3.5 h-3.5 mr-1.5" />
                        {pushToSageMutation.isPending ? "Pushing..." : "Push to Sage"}
                      </Button>
                      {!sageConnected && (
                        <p className="text-xs text-muted-foreground">
                          Sage not connected.{" "}
                          <a href="/api/sage/auth" className="underline hover:text-foreground transition-colors">
                            Connect now
                          </a>
                        </p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            </>}

            {/* Price Summary — visible in both overview and finance tabs */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <CardTitle>Price Summary</CardTitle>
                  {isComparison && (
                    <Badge variant="outline" className="text-xs no-default-active-elevate">
                      Option {viewingSlot}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {viewingPricing.discount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Original Price (inc. VAT)</span>
                    <span className="font-medium">
                      £{((viewingPricing.total + viewingPricing.discount) / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {viewingPricing.discount > 0 && (
                  <div className="flex justify-between text-sm text-accent">
                    <span className="font-medium">
                      Discount {discountType === "percentage" ? `(${discountValue}%)` : ""}
                    </span>
                    <span className="font-medium">
                      -£{(viewingPricing.discount / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal (ex. VAT)</span>
                  <span className="font-medium">
                    £{(viewingPricing.subtotal / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT (20%)</span>
                  <span className="font-medium">
                    £{(viewingPricing.vat / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total (inc. VAT)</span>
                  <span className="text-2xl font-bold text-accent">
                    £{(viewingPricing.total / 100).toLocaleString('en-GB', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                
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

      {/* AI Transcript Dialog */}
      {(quote as any)?.aiConversation && (() => {
        const ai = (quote as any).aiConversation;
        const msgs: Array<{role: string; content: string}> = Array.isArray(ai.messages) ? ai.messages : [];
        const displayName = ai.contact_name || ai.contactName || quote?.userName || "Customer";
        return (
          <Dialog open={showAiTranscript} onOpenChange={setShowAiTranscript}>
            <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0" data-testid="dialog-ai-transcript">
              <DialogHeader className="px-5 py-4 border-b shrink-0">
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#8bc440]/30 shrink-0">
                    <img src={maxAvatarSrc} alt="Max" className="w-full h-full object-cover object-top" />
                  </div>
                  Max — Chat with {displayName}
                </DialogTitle>
              </DialogHeader>
              <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
                {msgs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">No messages in this conversation.</p>
                ) : msgs.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] rounded-md px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-[#8bc440]/15 text-foreground"
                        : "bg-muted text-foreground"
                    }`}>
                      <p className="text-xs font-medium mb-1 opacity-60">
                        {msg.role === "user" ? displayName : "Max"}
                      </p>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Follow-up scheduling dialog — shown when "Mark as Contacted" is clicked */}
      <Dialog open={fuDialogOpen} onOpenChange={setFuDialogOpen}>
        <DialogContent className="max-w-sm" data-testid="modal-schedule-followup-detail">
          <DialogHeader>
            <DialogTitle>When do you want to follow up?</DialogTitle>
            <DialogDescription>
              {quote?.userName
                ? <>Choose a follow-up date for <strong>{quote.userName}</strong>. The status will be set to Contacted and a reminder added to your calendar.</>
                : <>Choose a follow-up date. A reminder will be added to your calendar.</>
              }
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-1">
            <div>
              <Label htmlFor="fu-date-detail">Follow-up date</Label>
              <Input
                id="fu-date-detail"
                type="date"
                value={fuDate}
                onChange={(e) => setFuDate(e.target.value)}
                data-testid="input-followup-date-detail"
              />
            </div>
            <div>
              <Label htmlFor="fu-notes-detail">Notes (optional)</Label>
              <Textarea
                id="fu-notes-detail"
                value={fuNotes}
                onChange={(e) => setFuNotes(e.target.value)}
                placeholder="What to discuss or follow up on..."
                rows={2}
                data-testid="textarea-followup-notes-detail"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFuDialogOpen(false);
                quickStatusMutation.mutate("contacted");
              }}
              data-testid="button-skip-followup-detail"
            >
              Skip, just mark contacted
            </Button>
            <Button
              onClick={() => {
                quickStatusMutation.mutate("contacted");
                scheduleFollowUpMutation.mutate({
                  customerName: quote?.userName || quote?.email || "Unknown",
                  customerPhone: quote?.phone || null,
                  customerEmail: quote?.email || null,
                  scheduledDate: fuDate,
                  notes: fuNotes || null,
                  quoteId: id,
                  assignedToUserId: user?.id || null,
                  assignedToName: user ? `${(user as any).firstName || ""} ${(user as any).lastName || ""}`.trim() || user.username : null,
                  assignedToEmail: (user as any)?.email || null,
                  createdBy: user?.username || "admin",
                });
              }}
              disabled={!fuDate || quickStatusMutation.isPending || scheduleFollowUpMutation.isPending}
              data-testid="button-confirm-followup-detail"
            >
              <Building2 className="w-4 h-4 mr-2" />
              Add to calendar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
