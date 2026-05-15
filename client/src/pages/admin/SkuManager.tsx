import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminPageHeader } from "@/components/AdminPageHeader";
import { useAuth } from "@/hooks/useAuth";
import type { User } from "@shared/schema";
import type { Kit, Upgrade } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, ArrowUp, ArrowDown, AlertTriangle, CheckCircle2, ChevronRight, Wand2, Search } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type SkuComponent = { sku: string; description: string; quantity: number };

interface SkuCatalogueEntry {
  sku: string;
  description: string;
  type: "Equipment Pack" | "Upgrade" | "BOM Part";
  source: string;
}

// ── BOM Editor ───────────────────────────────────────────────────────────────
function BomEditor({
  components,
  onChange,
  generatePartSku,
}: {
  components: SkuComponent[];
  onChange: (rows: SkuComponent[]) => void;
  generatePartSku?: () => Promise<string>;
}) {
  const [generatingIdx, setGeneratingIdx] = useState<number | null>(null);

  const addRow = () => {
    onChange([...components, { sku: "", description: "", quantity: 1 }]);
  };

  const remove = (i: number) => onChange(components.filter((_, idx) => idx !== i));
  const update = (i: number, patch: Partial<SkuComponent>) => {
    const rows = [...components];
    rows[i] = { ...rows[i], ...patch };
    onChange(rows);
  };
  const moveUp = (i: number) => {
    if (i === 0) return;
    const rows = [...components];
    [rows[i - 1], rows[i]] = [rows[i], rows[i - 1]];
    onChange(rows);
  };
  const moveDown = (i: number) => {
    if (i >= components.length - 1) return;
    const rows = [...components];
    [rows[i], rows[i + 1]] = [rows[i + 1], rows[i]];
    onChange(rows);
  };

  const handleDescriptionBlur = async (i: number) => {
    const row = components[i];
    if (!row || row.sku.trim() || !row.description.trim() || !generatePartSku) return;
    setGeneratingIdx(i);
    try {
      const sku = await generatePartSku();
      update(i, { sku });
    } catch { /* ignore */ } finally {
      setGeneratingIdx(null);
    }
  };

  return (
    <div className="space-y-2">
      {components.length > 0 && (
        <div className="grid grid-cols-[1fr_2fr_72px_auto] gap-2 text-xs font-medium text-muted-foreground px-1">
          <span>Part SKU</span>
          <span>Description</span>
          <span>Qty</span>
          <span />
        </div>
      )}
      {components.map((row, idx) => (
        <div key={idx} className="grid grid-cols-[1fr_2fr_72px_auto] gap-2 items-center">
          <Input
            placeholder={generatingIdx === idx ? "Generating…" : "SKU"}
            value={row.sku}
            onChange={e => update(idx, { sku: e.target.value })}
            className="text-sm h-8 font-mono"
            disabled={generatingIdx === idx}
            data-testid={`input-skumgr-bom-sku-${idx}`}
          />
          <Input
            placeholder="Description"
            value={row.description}
            onChange={e => update(idx, { description: e.target.value })}
            onBlur={() => handleDescriptionBlur(idx)}
            className="text-sm h-8"
            data-testid={`input-skumgr-bom-desc-${idx}`}
          />
          <Input
            type="number"
            min={1}
            value={row.quantity}
            onChange={e => update(idx, { quantity: parseInt(e.target.value) || 1 })}
            className="text-sm h-8"
            data-testid={`input-skumgr-bom-qty-${idx}`}
          />
          <div className="flex gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={idx === 0} onClick={() => moveUp(idx)} data-testid={`button-skumgr-bom-up-${idx}`}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Move part up</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" disabled={idx === components.length - 1} onClick={() => moveDown(idx)} data-testid={`button-skumgr-bom-down-${idx}`}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Move part down</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => remove(idx)} data-testid={`button-skumgr-bom-remove-${idx}`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Remove part</TooltipContent>
            </Tooltip>
          </div>
        </div>
      ))}
      <Button type="button" size="sm" variant="outline" onClick={addRow} data-testid="button-skumgr-add-bom-row">
        <Plus className="w-3.5 h-3.5 mr-1" />
        Add Part
      </Button>
    </div>
  );
}

// ── BOM Dialog ───────────────────────────────────────────────────────────────
function BomDialog({
  open,
  onOpenChange,
  title,
  initialComponents,
  onSave,
  isSaving,
  generatePartSku,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  initialComponents: SkuComponent[];
  onSave: (rows: SkuComponent[]) => void;
  isSaving: boolean;
  generatePartSku?: () => Promise<string>;
}) {
  const [rows, setRows] = useState<SkuComponent[]>(initialComponents);

  const handleOpenChange = (v: boolean) => {
    if (v) setRows(initialComponents);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bill of Materials — {title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Component parts sent to the AutoTradeOS warehouse when this item is pushed.
          Leave empty if this item ships as a single unit identified by its own SKU.
        </p>
        <BomEditor components={rows} onChange={setRows} generatePartSku={generatePartSku} />
        <div className="flex gap-2 justify-end pt-2 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-skumgr-cancel-bom">
            Cancel
          </Button>
          <Button onClick={() => onSave(rows)} disabled={isSaving} data-testid="button-skumgr-save-bom">
            {isSaving ? "Saving…" : "Save BOM"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Inline SKU input — saves on blur / Enter ──────────────────────────────────
function InlineSkuInput({
  value,
  onSave,
  isSaving,
}: {
  value: string | null | undefined;
  onSave: (sku: string) => void;
  isSaving?: boolean;
}) {
  const [draft, setDraft] = useState(value ?? "");

  const commit = () => {
    if (draft !== (value ?? "")) onSave(draft);
  };

  return (
    <Input
      value={draft}
      placeholder="e.g. MTVC-U001"
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      className={`h-8 text-sm w-36 font-mono ${isSaving ? "opacity-60" : ""}`}
      disabled={isSaving}
      data-testid="input-skumgr-sku"
    />
  );
}

// ── SKU status badge ──────────────────────────────────────────────────────────
function SkuBadge({ sku }: { sku?: string | null }) {
  if (sku) {
    return (
      <Badge variant="outline" className="gap-1 text-green-700 border-green-400 dark:border-green-600 dark:text-green-400 font-mono text-xs">
        <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
        {sku}
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="gap-1 text-amber-600 border-amber-400 dark:border-amber-600 dark:text-amber-400">
      <AlertTriangle className="w-3 h-3 flex-shrink-0" />
      No SKU
    </Badge>
  );
}

// ── Row layout shared by kit rows and upgrade rows ────────────────────────────
function ItemRow({
  name,
  subtitle,
  sku,
  bomCount,
  canEdit,
  onSkuSave,
  onBomClick,
  isSavingSku,
  indented,
}: {
  name: string;
  subtitle?: string;
  sku?: string | null;
  bomCount: number;
  canEdit: boolean;
  onSkuSave: (v: string) => void;
  onBomClick: () => void;
  isSavingSku?: boolean;
  indented?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 flex-wrap gap-y-2 ${indented ? "pl-10 border-t" : ""}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{name}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        {bomCount > 0 && !subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">
            {bomCount} BOM component{bomCount !== 1 ? "s" : ""}
          </p>
        )}
      </div>
      <SkuBadge sku={sku} />
      {canEdit && (
        <>
          <InlineSkuInput value={sku} onSave={onSkuSave} isSaving={isSavingSku} />
          <Button
            size="sm"
            variant="outline"
            onClick={onBomClick}
            data-testid={`button-skumgr-edit-bom`}
          >
            {bomCount > 0 ? `Edit BOM (${bomCount})` : "Add BOM"}
          </Button>
        </>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminSkuManager() {
  const { user } = useAuth() as { user: User | undefined };
  const { toast } = useToast();

  const { data: kits = [], isLoading: kitsLoading } = useQuery<Kit[]>({
    queryKey: ["/api/admin/kits"],
  });
  const { data: allUpgrades = [], isLoading: upgradesLoading } = useQuery<Upgrade[]>({
    queryKey: ["/api/admin/upgrades"],
  });

  const [bomDialog, setBomDialog] = useState<{
    type: "kit" | "upgrade";
    id: string;
    name: string;
    components: SkuComponent[];
  } | null>(null);

  const [catalogueSearch, setCatalogueSearch] = useState("");

  // ── Upgrade grouping ──────────────────────────────────────────────────────
  const parentGroups = allUpgrades.filter(u => (u as any).hasVariants);
  const variantChildren = allUpgrades.filter(u => !!(u as any).parentId);
  const simples = allUpgrades.filter(u => !(u as any).hasVariants && !(u as any).parentId);

  const bomCount = (item: any): number =>
    Array.isArray((item as any).skuComponents) ? (item as any).skuComponents.length : 0;

  // ── SKU Catalogue ─────────────────────────────────────────────────────────
  const catalogue = useMemo<SkuCatalogueEntry[]>(() => {
    const entries: SkuCatalogueEntry[] = [];

    // Kit SKUs
    for (const kit of kits) {
      if ((kit as any).sku) {
        entries.push({ sku: (kit as any).sku, description: kit.name, type: "Equipment Pack", source: kit.name });
      }
      // BOM parts from kits
      const parts: SkuComponent[] = (kit as any).skuComponents ?? [];
      for (const p of parts) {
        if (p.sku) entries.push({ sku: p.sku, description: p.description || p.sku, type: "BOM Part", source: kit.name });
      }
    }

    // Upgrade SKUs (non-parent groups)
    for (const u of allUpgrades) {
      if ((u as any).hasVariants) continue; // parent groups have no SKU
      if ((u as any).sku) {
        entries.push({ sku: (u as any).sku, description: u.name, type: "Upgrade", source: u.name });
      }
      // BOM parts from upgrades
      const parts: SkuComponent[] = (u as any).skuComponents ?? [];
      for (const p of parts) {
        if (p.sku) entries.push({ sku: p.sku, description: p.description || p.sku, type: "BOM Part", source: u.name });
      }
    }

    return entries;
  }, [kits, allUpgrades]);

  const filteredCatalogue = useMemo(() => {
    const q = catalogueSearch.toLowerCase().trim();
    if (!q) return catalogue;
    return catalogue.filter(e =>
      e.sku.toLowerCase().includes(q) ||
      e.description.toLowerCase().includes(q) ||
      e.source.toLowerCase().includes(q) ||
      e.type.toLowerCase().includes(q)
    );
  }, [catalogue, catalogueSearch]);

  // Count items missing SKUs
  const missingSku = useMemo(() => {
    const kitsMissing = kits.filter(k => !(k as any).sku).length;
    const upgradesMissing = allUpgrades.filter(u => {
      if ((u as any).hasVariants) return false; // parent groups don't need SKU
      return !(u as any).sku;
    }).length;
    return kitsMissing + upgradesMissing;
  }, [kits, allUpgrades]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const updateKitSku = useMutation({
    mutationFn: ({ id, sku }: { id: string; sku: string }) =>
      apiRequest("PATCH", `/api/admin/kits/${id}`, { sku: sku || null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/kits"] }),
    onError: () => toast({ title: "Failed to save SKU", variant: "destructive" }),
  });

  const updateKitBom = useMutation({
    mutationFn: ({ id, skuComponents }: { id: string; skuComponents: SkuComponent[] | null }) =>
      apiRequest("PATCH", `/api/admin/kits/${id}`, { skuComponents }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kits"] });
      setBomDialog(null);
      toast({ title: "BOM saved" });
    },
    onError: () => toast({ title: "Failed to save BOM", variant: "destructive" }),
  });

  const updateUpgradeSku = useMutation({
    mutationFn: ({ id, sku }: { id: string; sku: string }) =>
      apiRequest("PATCH", `/api/admin/upgrades/${id}`, { sku: sku || null }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrades"] }),
    onError: () => toast({ title: "Failed to save SKU", variant: "destructive" }),
  });

  const updateUpgradeBom = useMutation({
    mutationFn: ({ id, skuComponents }: { id: string; skuComponents: SkuComponent[] | null }) =>
      apiRequest("PATCH", `/api/admin/upgrades/${id}`, { skuComponents }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrades"] });
      setBomDialog(null);
      toast({ title: "BOM saved" });
    },
    onError: () => toast({ title: "Failed to save BOM", variant: "destructive" }),
  });

  const backfillMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/admin/sku/backfill", {}),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kits"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrades"] });
      const assigned = data?.assigned ?? 0;
      toast({ title: assigned > 0 ? `SKUs assigned to ${assigned} item${assigned !== 1 ? "s" : ""}` : "All items already have SKUs" });
    },
    onError: () => toast({ title: "Failed to generate SKUs", variant: "destructive" }),
  });

  const generatePartSku = async (): Promise<string> => {
    const res = await apiRequest("POST", "/api/admin/sku/generate", { type: "part" });
    const data: any = await res.json();
    return data?.sku ?? "";
  };

  const canEdit = user?.adminRole === "full";

  const openBom = (type: "kit" | "upgrade", item: any) =>
    setBomDialog({ type, id: item.id, name: item.name, components: (item.skuComponents as SkuComponent[] | null) ?? [] });

  const saveBom = (rows: SkuComponent[]) => {
    if (!bomDialog) return;
    const payload = rows.length > 0 ? rows : null;
    if (bomDialog.type === "kit") {
      updateKitBom.mutate({ id: bomDialog.id, skuComponents: payload });
    } else {
      updateUpgradeBom.mutate({ id: bomDialog.id, skuComponents: payload });
    }
  };

  if (kitsLoading || upgradesLoading) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  const typeBadgeClass = (type: SkuCatalogueEntry["type"]) => {
    if (type === "Equipment Pack") return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300";
    if (type === "Upgrade") return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300";
    return "bg-muted text-muted-foreground";
  };

  return (
    <>
      <AdminPageHeader
        title="SKU Manager"
        subtitle="Assign AutoTradeOS stock-keeping units and bills of materials to packs and upgrades"
        actions={
          canEdit ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => backfillMutation.mutate()}
                  disabled={backfillMutation.isPending}
                  data-testid="button-sku-backfill"
                >
                  <Wand2 className="h-3.5 w-3.5 mr-1.5" />
                  {backfillMutation.isPending ? "Generating…" : `Generate Missing SKUs${missingSku > 0 ? ` (${missingSku})` : ""}`}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Auto-assign MTVC SKU codes to all items currently missing one</TooltipContent>
            </Tooltip>
          ) : undefined
        }
      />

      <div className="p-4 md:p-6 max-w-5xl">
        <Tabs defaultValue="manager">
          <TabsList className="mb-6">
            <TabsTrigger value="manager" data-testid="tab-sku-manager">SKU Manager</TabsTrigger>
            <TabsTrigger value="catalogue" data-testid="tab-sku-catalogue">
              SKU Catalogue
              <Badge variant="secondary" className="ml-2 text-xs">{catalogue.length}</Badge>
            </TabsTrigger>
          </TabsList>

          {/* ── SKU Manager Tab ─────────────────────────────────────────── */}
          <TabsContent value="manager" className="space-y-8">

            {/* Equipment Packs */}
            <section>
              <h2 className="text-base font-semibold mb-3">Equipment Packs</h2>
              <div className="rounded-lg border divide-y">
                {kits.length === 0 && (
                  <p className="text-sm text-muted-foreground p-4">No packs found.</p>
                )}
                {kits.map(kit => (
                  <ItemRow
                    key={kit.id}
                    name={kit.name}
                    subtitle={bomCount(kit) > 0 ? `${bomCount(kit)} BOM component${bomCount(kit) !== 1 ? "s" : ""}` : undefined}
                    sku={(kit as any).sku}
                    bomCount={bomCount(kit)}
                    canEdit={canEdit}
                    onSkuSave={sku => updateKitSku.mutate({ id: kit.id, sku })}
                    onBomClick={() => openBom("kit", kit)}
                    isSavingSku={updateKitSku.isPending}
                  />
                ))}
              </div>
            </section>

            {/* Upgrades & Options */}
            <section>
              <h2 className="text-base font-semibold mb-3">Upgrades &amp; Options</h2>
              <div className="rounded-lg border divide-y">

                {/* Simple upgrades (no parent, no variants) */}
                {simples.map(u => (
                  <ItemRow
                    key={u.id}
                    name={u.name}
                    subtitle={bomCount(u) > 0 ? `${bomCount(u)} BOM component${bomCount(u) !== 1 ? "s" : ""}` : undefined}
                    sku={(u as any).sku}
                    bomCount={bomCount(u)}
                    canEdit={canEdit}
                    onSkuSave={sku => updateUpgradeSku.mutate({ id: u.id, sku })}
                    onBomClick={() => openBom("upgrade", u)}
                    isSavingSku={updateUpgradeSku.isPending}
                  />
                ))}

                {/* Parent groups with their variant children */}
                {parentGroups.map(parent => {
                  const children = variantChildren.filter(v => (v as any).parentId === parent.id);
                  return (
                    <div key={parent.id}>
                      <div className="flex items-center gap-3 px-4 py-2.5 bg-muted/40">
                        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <p className="text-sm font-medium text-muted-foreground flex-1 truncate">
                          {parent.name}
                        </p>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          Group — see variants
                        </Badge>
                      </div>

                      {children.map(v => (
                        <ItemRow
                          key={v.id}
                          name={v.name}
                          subtitle={bomCount(v) > 0 ? `${bomCount(v)} BOM component${bomCount(v) !== 1 ? "s" : ""}` : undefined}
                          sku={(v as any).sku}
                          bomCount={bomCount(v)}
                          canEdit={canEdit}
                          onSkuSave={sku => updateUpgradeSku.mutate({ id: v.id, sku })}
                          onBomClick={() => openBom("upgrade", v)}
                          isSavingSku={updateUpgradeSku.isPending}
                          indented
                        />
                      ))}

                      {children.length === 0 && (
                        <p className="text-xs text-muted-foreground pl-10 pr-4 py-2.5 border-t italic">
                          No variants defined.
                        </p>
                      )}
                    </div>
                  );
                })}

                {simples.length === 0 && parentGroups.length === 0 && (
                  <p className="text-sm text-muted-foreground p-4">No upgrades found.</p>
                )}
              </div>
            </section>
          </TabsContent>

          {/* ── SKU Catalogue Tab ───────────────────────────────────────── */}
          <TabsContent value="catalogue">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    placeholder="Search SKUs, descriptions, or items…"
                    value={catalogueSearch}
                    onChange={e => setCatalogueSearch(e.target.value)}
                    className="pl-8"
                    data-testid="input-sku-catalogue-search"
                  />
                </div>
                <span className="text-sm text-muted-foreground">
                  {filteredCatalogue.length} of {catalogue.length} SKUs
                </span>
              </div>

              {catalogue.length === 0 ? (
                <div className="rounded-lg border p-8 text-center text-muted-foreground">
                  <p className="font-medium mb-1">No SKUs assigned yet</p>
                  <p className="text-sm">Use "Generate Missing SKUs" to auto-assign codes to all your products.</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <table className="w-full text-sm" data-testid="table-sku-catalogue">
                    <thead>
                      <tr className="border-b bg-muted/40">
                        <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground w-36">SKU</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground">Description</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground w-32">Type</th>
                        <th className="text-left px-4 py-2.5 font-semibold text-xs uppercase tracking-wide text-muted-foreground hidden md:table-cell">Source Item</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredCatalogue.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                            No SKUs match your search.
                          </td>
                        </tr>
                      ) : (
                        filteredCatalogue.map((entry, i) => (
                          <tr key={i} className="hover-elevate" data-testid={`row-sku-${i}`}>
                            <td className="px-4 py-2.5 font-mono text-xs font-semibold tracking-wide">
                              {entry.sku}
                            </td>
                            <td className="px-4 py-2.5 text-sm">
                              {entry.description}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${typeBadgeClass(entry.type)}`}>
                                {entry.type}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-xs text-muted-foreground hidden md:table-cell truncate max-w-48">
                              {entry.source}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* BOM dialog */}
      {bomDialog && (
        <BomDialog
          open
          onOpenChange={v => { if (!v) setBomDialog(null); }}
          title={bomDialog.name}
          initialComponents={bomDialog.components}
          onSave={saveBom}
          isSaving={updateKitBom.isPending || updateUpgradeBom.isPending}
          generatePartSku={canEdit ? generatePartSku : undefined}
        />
      )}
    </>
  );
}
