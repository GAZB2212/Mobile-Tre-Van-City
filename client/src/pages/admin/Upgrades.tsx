import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Package, ArrowUp, ArrowDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Upgrade } from "@shared/schema";
import { insertUpgradeSchema, upgradeCategories } from "@shared/schema";
import { UpgradeImageUploader } from "@/components/UpgradeImageUploader";
import { useEffect } from "react";

// Form validation schema - extend shared schema for price conversion
const upgradeFormSchema = insertUpgradeSchema.omit({ price: true }).extend({
  price: z.string().optional(),
  parentId: z.string().optional().nullable(),
  variantName: z.string().optional().nullable(),
  hasVariants: z.boolean().optional(),
  allowQuantity: z.boolean().optional(),
});

type UpgradeFormData = z.infer<typeof upgradeFormSchema>;

// Variant type for UI management
type VariantOption = {
  id?: string;
  name: string;
  price: string;
};

// Helper function to convert pounds to pence
const poundsToPence = (pounds: string): number => {
  const num = parseFloat(pounds);
  return isNaN(num) ? 0 : Math.round(num * 100);
};

// Helper function to convert pence to pounds
const penceToPounds = (pence: number): string => {
  return (pence / 100).toFixed(2);
};

interface UpgradeDialogProps {
  upgrade?: Upgrade;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allUpgrades: Upgrade[]; // For parent equipment dropdown
}

function UpgradeDialog({ upgrade, open, onOpenChange, allUpgrades }: UpgradeDialogProps) {
  const { toast } = useToast();
  const isEditing = !!upgrade;
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [cachedPrice, setCachedPrice] = useState<string>("");

  // Get variants for this upgrade (children)
  const upgradeVariants = allUpgrades.filter(u => u.parentId === upgrade?.id);
  
  // Get parent equipment options (exclude current item and its children)
  const parentOptions = allUpgrades.filter(u => 
    u.id !== upgrade?.id && u.parentId === null
  );

  const form = useForm<UpgradeFormData>({
    resolver: zodResolver(upgradeFormSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
      price: "",
      images: [],
      parentId: "",
      variantName: "",
      published: true,
      hasVariants: false,
      allowQuantity: false,
    },
  });

  // Reset form when dialog opens
  useEffect(() => {
    if (!open) {
      // Clear cached price when dialog closes
      setCachedPrice("");
      return;
    }
    
    if (upgrade) {
      const children = allUpgrades.filter(u => u.parentId === upgrade.id);
      const hasChildren = children.length > 0;
      setHasVariants(hasChildren);
      setCachedPrice(""); // Clear cache for fresh edit
      
      // Load existing variants
      if (hasChildren) {
        setVariants(children.map(v => ({
          id: v.id,
          name: v.variantName || "",
          price: penceToPounds(v.price),
        })));
      } else {
        setVariants([]);
      }
      
      form.reset({
        name: upgrade.name,
        category: upgrade.category,
        description: upgrade.description,
        price: hasChildren ? "" : penceToPounds(upgrade.price),
        images: upgrade.images,
        parentId: upgrade.parentId || "",
        variantName: upgrade.variantName || "",
        published: upgrade.published,
        hasVariants: hasChildren,
        allowQuantity: upgrade.allowQuantity || false,
      });
    } else {
      setHasVariants(false);
      setVariants([]);
      setCachedPrice("");
      form.reset({
        name: "",
        category: "",
        description: "",
        price: "",
        images: [],
        parentId: "",
        variantName: "",
        published: true,
        hasVariants: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const createMutation = useMutation({
    mutationFn: async (data: UpgradeFormData) => {
      // If this has variants, create parent with no price
      if (hasVariants && variants.length > 0) {
        const parentData = {
          ...data,
          price: 0,
          parentId: null,
          variantName: null,
        };
        const parentResult: any = await apiRequest("POST", "/api/admin/upgrades", parentData);
        
        // Create each variant as a child
        await Promise.all(
          variants.map(variant =>
            apiRequest("POST", "/api/admin/upgrades", {
              name: data.name,
              category: data.category,
              description: data.description,
              images: data.images,
              price: poundsToPence(variant.price),
              parentId: parentResult.id,
              variantName: variant.name,
              published: data.published,
            })
          )
        );
        
        return parentResult;
      } else {
        // Regular single upgrade
        const upgradeData = {
          ...data,
          price: data.price ? poundsToPence(data.price) : 0,
          parentId: null,
          variantName: null,
        };
        return apiRequest("POST", "/api/admin/upgrades", upgradeData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrades"] });
      toast({
        title: "Success",
        description: "Upgrade created successfully",
      });
      onOpenChange(false);
      form.reset();
      setVariants([]);
      setHasVariants(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create upgrade",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: UpgradeFormData) => {
      if (hasVariants && variants.length > 0) {
        // Update parent with no price
        const parentData = {
          ...data,
          price: 0,
          parentId: null,
          variantName: null,
        };
        const parentResult = await apiRequest("PUT", `/api/admin/upgrades/${upgrade!.id}`, parentData);
        
        // Delete removed variants
        const existingVariantIds = upgradeVariants.map(v => v.id);
        const keptVariantIds = variants.filter(v => v.id).map(v => v.id);
        const toDelete = existingVariantIds.filter(id => !keptVariantIds.includes(id));
        
        await Promise.all(toDelete.map(id => 
          apiRequest("DELETE", `/api/admin/upgrades/${id}`)
        ));
        
        // Update or create variants
        await Promise.all(
          variants.map(variant => {
            const variantData = {
              name: data.name,
              category: data.category,
              description: data.description,
              images: data.images,
              price: poundsToPence(variant.price),
              parentId: upgrade!.id,
              variantName: variant.name,
              published: data.published,
            };
            
            if (variant.id) {
              // Update existing variant
              return apiRequest("PUT", `/api/admin/upgrades/${variant.id}`, variantData);
            } else {
              // Create new variant
              return apiRequest("POST", "/api/admin/upgrades", variantData);
            }
          })
        );
        
        return parentResult;
      } else {
        // Regular single upgrade - delete any existing variants if switching from variants to single
        if (upgradeVariants.length > 0) {
          await Promise.all(
            upgradeVariants.map(v => apiRequest("DELETE", `/api/admin/upgrades/${v.id}`))
          );
        }
        
        const upgradeData = {
          ...data,
          price: data.price ? poundsToPence(data.price) : 0,
          parentId: null,
          variantName: null,
        };
        return apiRequest("PUT", `/api/admin/upgrades/${upgrade!.id}`, upgradeData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrades"] });
      toast({
        title: "Success",
        description: "Upgrade updated successfully",
      });
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update upgrade",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UpgradeFormData) => {
    // Validate variants if hasVariants is enabled
    if (hasVariants) {
      if (variants.length === 0) {
        toast({
          title: "Validation Error",
          description: "Please add at least one variant option",
          variant: "destructive",
        });
        return;
      }
      
      const invalidVariants = variants.filter(v => !v.name.trim() || !v.price || parseFloat(v.price) <= 0);
      if (invalidVariants.length > 0) {
        toast({
          title: "Validation Error",
          description: "All variants must have a name and a price greater than 0",
          variant: "destructive",
        });
        return;
      }
    } else if (!upgrade?.parentId) {
      // Validate price for single upgrades (not child variants)
      if (!data.price || parseFloat(data.price) <= 0) {
        toast({
          title: "Validation Error",
          description: "Price is required and must be greater than 0",
          variant: "destructive",
        });
        return;
      }
    }
    
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Upgrade" : "Create New Upgrade"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 overflow-y-auto flex-1 pr-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter upgrade name"
                      data-testid="input-upgrade-name"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-upgrade-category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {upgradeCategories.map((category: string) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter upgrade description"
                      className="min-h-[100px]"
                      data-testid="input-upgrade-description"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Only show variant toggle if this is not already a variant */}
            {!upgrade?.parentId && (
              <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium">Has Variants</label>
                  <p className="text-sm text-muted-foreground">
                    This equipment has multiple options (e.g., LWB/MWB)
                  </p>
                </div>
                <Switch
                  checked={hasVariants}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      // When enabling variants, cache the current price and clear it
                      const currentPrice = form.getValues("price");
                      if (currentPrice) {
                        setCachedPrice(currentPrice);
                      }
                      form.setValue("price", "");
                      if (variants.length === 0) {
                        setVariants([{ name: "", price: "" }]);
                      }
                    } else {
                      // When disabling variants, restore cached price or require new entry
                      if (cachedPrice) {
                        form.setValue("price", cachedPrice);
                      } else if (upgrade && upgrade.price > 0) {
                        form.setValue("price", penceToPounds(upgrade.price));
                      } else {
                        // Require user to enter a price
                        form.setValue("price", "");
                      }
                      setVariants([]);
                    }
                    setHasVariants(checked);
                  }}
                  data-testid="switch-has-variants"
                />
              </div>
            )}

            {/* Show price only if not a variant item and doesn't have variants */}
            {!upgrade?.parentId && !hasVariants && (
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price (£)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        data-testid="input-upgrade-price"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Variant management section */}
            {hasVariants && !upgrade?.parentId && (
              <div className="space-y-3 rounded-lg border p-4">
                <h3 className="font-medium">Variants</h3>
                <p className="text-sm text-muted-foreground">
                  Add different options for this equipment (e.g., LWB, MWB). At least one variant is required.
                </p>
                
                {variants.length === 0 && (
                  <p className="text-sm text-destructive">
                    Please add at least one variant option
                  </p>
                )}
                
                {variants.map((variant, index) => {
                  const hasError = !variant.name.trim() || !variant.price || parseFloat(variant.price) <= 0;
                  
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Variant name (e.g., LWB)"
                          value={variant.name}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[index].name = e.target.value;
                            setVariants(newVariants);
                          }}
                          className={!variant.name.trim() ? "border-destructive" : ""}
                          data-testid={`input-variant-name-${index}`}
                        />
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          placeholder="Price (£)"
                          value={variant.price}
                          onChange={(e) => {
                            const newVariants = [...variants];
                            newVariants[index].price = e.target.value;
                            setVariants(newVariants);
                          }}
                          className={(!variant.price || parseFloat(variant.price) <= 0) ? "border-destructive" : ""}
                          data-testid={`input-variant-price-${index}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setVariants(variants.filter((_, i) => i !== index));
                          }}
                          data-testid={`button-remove-variant-${index}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      {hasError && (
                        <p className="text-xs text-destructive">
                          Both name and price are required
                        </p>
                      )}
                    </div>
                  );
                })}
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setVariants([...variants, { name: "", price: "" }])}
                  data-testid="button-add-variant"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Variant
                </Button>
              </div>
            )}

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Images</FormLabel>
                  <FormControl>
                    <UpgradeImageUploader
                      images={(field.value as string[]) || []}
                      onChange={(images: string[]) => field.onChange(images)}
                      maxImages={5}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Upload product images to help customers see what they're purchasing
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="published"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Published</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Make this upgrade visible to customers
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-upgrade-published"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowQuantity"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Allow Quantity Selection</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Let customers choose quantity for this upgrade
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="switch-allow-quantity"
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                data-testid="button-cancel-upgrade"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                data-testid="button-save-upgrade"
              >
                {createMutation.isPending || updateMutation.isPending
                  ? "Saving..."
                  : isEditing
                  ? "Update Upgrade"
                  : "Create Upgrade"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUpgrades() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUpgrade, setEditingUpgrade] = useState<Upgrade | undefined>();
  const { toast } = useToast();

  const { data: upgrades = [], isLoading } = useQuery<Upgrade[]>({
    queryKey: ["/api/admin/upgrades"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/admin/upgrades/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrades"] });
      toast({
        title: "Success",
        description: "Upgrade deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete upgrade",
        variant: "destructive",
      });
    },
  });

  const updateSortOrderMutation = useMutation({
    mutationFn: async ({ id, sortOrder }: { id: string; sortOrder: number }) => {
      return apiRequest("PATCH", `/api/admin/upgrades/${id}/sort-order`, { sortOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrades"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update sort order",
        variant: "destructive",
      });
    },
  });

  const handleMoveUp = (upgrade: Upgrade, categoryUpgrades: Upgrade[]) => {
    const currentIndex = categoryUpgrades.findIndex(u => u.id === upgrade.id);
    if (currentIndex > 0) {
      const prevUpgrade = categoryUpgrades[currentIndex - 1];
      // Swap sort orders
      updateSortOrderMutation.mutate({ id: upgrade.id, sortOrder: prevUpgrade.sortOrder });
      updateSortOrderMutation.mutate({ id: prevUpgrade.id, sortOrder: upgrade.sortOrder });
    }
  };

  const handleMoveDown = (upgrade: Upgrade, categoryUpgrades: Upgrade[]) => {
    const currentIndex = categoryUpgrades.findIndex(u => u.id === upgrade.id);
    if (currentIndex < categoryUpgrades.length - 1) {
      const nextUpgrade = categoryUpgrades[currentIndex + 1];
      // Swap sort orders
      updateSortOrderMutation.mutate({ id: upgrade.id, sortOrder: nextUpgrade.sortOrder });
      updateSortOrderMutation.mutate({ id: nextUpgrade.id, sortOrder: upgrade.sortOrder });
    }
  };

  const handleEdit = (upgrade: Upgrade) => {
    setEditingUpgrade(upgrade);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingUpgrade(undefined);
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this upgrade?")) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Group upgrades by category and sort by sortOrder
  const upgradesByCategory = upgrades.reduce((acc, upgrade) => {
    if (!acc[upgrade.category]) {
      acc[upgrade.category] = [];
    }
    acc[upgrade.category].push(upgrade);
    return acc;
  }, {} as Record<string, Upgrade[]>);

  // Sort each category by sortOrder
  Object.keys(upgradesByCategory).forEach(category => {
    upgradesByCategory[category].sort((a, b) => a.sortOrder - b.sortOrder);
  });

  // Get all categories (from schema) to show empty categories too
  const allCategories = [...upgradeCategories];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-upgrades-title">
            Upgrade Management
          </h1>
          <p className="text-muted-foreground">
            Manage upgrade options and add-ons for mobile tyre services
          </p>
        </div>
        <Button onClick={handleCreate} data-testid="button-create-upgrade">
          <Plus className="h-4 w-4 mr-2" />
          Add Upgrade
        </Button>
      </div>

      {upgrades.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No upgrades found</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by creating your first upgrade option
            </p>
            <Button onClick={handleCreate} data-testid="button-create-first-upgrade">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Upgrade
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" defaultValue={allCategories} className="space-y-4">
          {allCategories.map((category) => {
            const categoryUpgrades = upgradesByCategory[category] || [];
            
            return (
              <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold capitalize">
                      {category.replace('-', ' ')}
                    </h2>
                    <Badge variant="secondary">{categoryUpgrades.length}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {categoryUpgrades.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No upgrades in this category yet
                    </p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pt-4">
                      {categoryUpgrades.map((upgrade: Upgrade) => (
                        <Card key={upgrade.id} className="hover-elevate">
                          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2 gap-2">
                            <div className="space-y-1 min-w-0 flex-1">
                              <CardTitle className="text-lg" data-testid={`text-upgrade-name-${upgrade.id}`}>
                                {upgrade.name}
                              </CardTitle>
                              {upgrade.variantName && (
                                <Badge variant="outline" className="text-xs">
                                  {upgrade.variantName}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center flex-shrink-0">
                              {upgrade.published ? (
                                <Badge variant="default" data-testid={`badge-upgrade-published-${upgrade.id}`}>
                                  Published
                                </Badge>
                              ) : (
                                <Badge variant="secondary" data-testid={`badge-upgrade-draft-${upgrade.id}`}>
                                  Draft
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-upgrade-description-${upgrade.id}`}>
                                {upgrade.description}
                              </p>
                              <div className="flex items-center justify-between">
                                <span className="text-xl font-bold" data-testid={`text-upgrade-price-${upgrade.id}`}>
                                  £{penceToPounds(upgrade.price)}
                                </span>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMoveUp(upgrade, categoryUpgrades)}
                                    disabled={categoryUpgrades.findIndex(u => u.id === upgrade.id) === 0}
                                    data-testid={`button-move-up-${upgrade.id}`}
                                  >
                                    <ArrowUp className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleMoveDown(upgrade, categoryUpgrades)}
                                    disabled={categoryUpgrades.findIndex(u => u.id === upgrade.id) === categoryUpgrades.length - 1}
                                    data-testid={`button-move-down-${upgrade.id}`}
                                  >
                                    <ArrowDown className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleEdit(upgrade)}
                                    data-testid={`button-edit-upgrade-${upgrade.id}`}
                                  >
                                    <Edit className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleDelete(upgrade.id)}
                                    disabled={deleteMutation.isPending}
                                    data-testid={`button-delete-upgrade-${upgrade.id}`}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}

      <UpgradeDialog
        upgrade={editingUpgrade}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) {
            setEditingUpgrade(undefined);
          }
        }}
        allUpgrades={upgrades}
      />
    </div>
  );
}