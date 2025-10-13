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
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Upgrade } from "@shared/schema";
import { insertUpgradeSchema, upgradeCategories } from "@shared/schema";
import { UpgradeImageUploader } from "@/components/UpgradeImageUploader";

// Form validation schema - extend shared schema for price conversion
const upgradeFormSchema = insertUpgradeSchema.omit({ price: true }).extend({
  price: z.string().min(1, "Price is required"),
  parentId: z.string().optional().nullable(),
  variantName: z.string().optional().nullable(),
});

type UpgradeFormData = z.infer<typeof upgradeFormSchema>;

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

  // Get parent equipment options (exclude current item and its children)
  const parentOptions = allUpgrades.filter(u => 
    u.id !== upgrade?.id && u.parentId === null
  );

  const form = useForm<UpgradeFormData>({
    resolver: zodResolver(upgradeFormSchema),
    defaultValues: {
      name: upgrade?.name || "",
      category: upgrade?.category || "",
      description: upgrade?.description || "",
      price: upgrade ? penceToPounds(upgrade.price) : "",
      images: upgrade?.images || [],
      parentId: upgrade?.parentId || "",
      variantName: upgrade?.variantName || "",
      published: upgrade?.published ?? true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: UpgradeFormData) => {
      const upgradeData = {
        ...data,
        price: poundsToPence(data.price),
        parentId: data.parentId && data.parentId !== "" ? data.parentId : null,
        variantName: data.variantName && data.variantName !== "" ? data.variantName : null,
      };
      return apiRequest("POST", "/api/admin/upgrades", upgradeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/upgrades"] });
      toast({
        title: "Success",
        description: "Upgrade created successfully",
      });
      onOpenChange(false);
      form.reset();
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
      const upgradeData = {
        ...data,
        price: poundsToPence(data.price),
        parentId: data.parentId && data.parentId !== "" ? data.parentId : null,
        variantName: data.variantName && data.variantName !== "" ? data.variantName : null,
      };
      return apiRequest("PUT", `/api/admin/upgrades/${upgrade!.id}`, upgradeData);
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
    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Upgrade" : "Create New Upgrade"}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              name="parentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Parent Equipment (for variations)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                    value={field.value || "none"}
                  >
                    <FormControl>
                      <SelectTrigger data-testid="select-parent-equipment">
                        <SelectValue placeholder="None - This is a standalone item" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None - Standalone Item</SelectItem>
                      {parentOptions.map((parent) => (
                        <SelectItem key={parent.id} value={parent.id}>
                          {parent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a parent if this is a variation (e.g., Pack 1, Pack 2)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="variantName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Variant Name (optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Pack 1, Standard, Premium"
                      data-testid="input-variant-name"
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Name for this variation (shown in dropdown to customers)
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

  // Group upgrades by category
  const upgradesByCategory = upgrades.reduce((acc, upgrade) => {
    if (!acc[upgrade.category]) {
      acc[upgrade.category] = [];
    }
    acc[upgrade.category].push(upgrade);
    return acc;
  }, {} as Record<string, Upgrade[]>);

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