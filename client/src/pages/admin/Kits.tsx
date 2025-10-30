import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Package, ChevronUp, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Kit } from "@shared/schema";

// Form validation schema
const kitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  includes: z.array(z.string()).min(1, "At least one included item is required"),
  powerKw: z.string().min(1, "Power (kW) is required"),
  price: z.number().min(0, "Price must be positive"),
  published: z.boolean().default(true),
});

type KitFormData = z.infer<typeof kitSchema>;

export default function AdminKits() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [includesInput, setIncludesInput] = useState("");
  const { toast } = useToast();

  // Fetch kits with admin access (includes unpublished)
  const { data: kits = [], isLoading } = useQuery<Kit[]>({
    queryKey: ["/api/admin/kits"],
  });

  const form = useForm<KitFormData>({
    resolver: zodResolver(kitSchema),
    defaultValues: {
      name: "",
      description: "",
      includes: [],
      powerKw: "",
      price: 0,
      published: true,
    },
  });

  // Create kit mutation
  const createMutation = useMutation({
    mutationFn: (data: KitFormData) => {
      const kitData = {
        ...data,
        includes: data.includes,
        price: Math.round(data.price * 100), // Convert to pence
      };
      return apiRequest("POST", "/api/admin/kits", kitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kits"] });
      setIsCreateDialogOpen(false);
      form.reset();
      setIncludesInput("");
      toast({ title: "Kit created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create kit", variant: "destructive" });
    },
  });

  // Update kit mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: KitFormData }) => {
      const kitData = {
        ...data,
        includes: data.includes,
        price: Math.round(data.price * 100), // Convert to pence
      };
      return apiRequest("PUT", `/api/admin/kits/${id}`, kitData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kits"] });
      setEditingKit(null);
      form.reset();
      setIncludesInput("");
      toast({ title: "Kit updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update kit", variant: "destructive" });
    },
  });

  // Delete kit mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/admin/kits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kits"] });
      toast({ title: "Kit deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete kit", variant: "destructive" });
    },
  });

  const handleAddInclude = () => {
    if (includesInput.trim()) {
      const currentIncludes = form.getValues("includes");
      form.setValue("includes", [...currentIncludes, includesInput.trim()]);
      setIncludesInput("");
    }
  };

  const handleRemoveInclude = (index: number) => {
    const currentIncludes = form.getValues("includes");
    form.setValue("includes", currentIncludes.filter((_, i) => i !== index));
  };

  const handleMoveIncludeUp = (index: number) => {
    if (index === 0) return;
    const currentIncludes = form.getValues("includes");
    const newIncludes = [...currentIncludes];
    [newIncludes[index - 1], newIncludes[index]] = [newIncludes[index], newIncludes[index - 1]];
    form.setValue("includes", newIncludes);
  };

  const handleMoveIncludeDown = (index: number) => {
    const currentIncludes = form.getValues("includes");
    if (index === currentIncludes.length - 1) return;
    const newIncludes = [...currentIncludes];
    [newIncludes[index], newIncludes[index + 1]] = [newIncludes[index + 1], newIncludes[index]];
    form.setValue("includes", newIncludes);
  };

  const handleEditKit = (kit: Kit) => {
    setEditingKit(kit);
    form.reset({
      name: kit.name,
      description: kit.description,
      includes: kit.includes || [],
      powerKw: kit.powerKw,
      price: parseInt(kit.price.toString()) / 100, // Convert from pence
      published: kit.published,
    });
  };

  const onSubmit = (data: KitFormData) => {
    if (editingKit) {
      updateMutation.mutate({ id: editingKit.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const formatPrice = (priceInPence: number) => {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
    }).format(priceInPence / 100);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Equipment Kits</h1>
          <p className="text-muted-foreground">Manage equipment packages for the configurator</p>
        </div>
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Equipment Kits</h1>
          <p className="text-muted-foreground">Manage equipment packages for the configurator</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-kit">
              <Plus className="w-4 h-4 mr-2" />
              Add Kit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Kit</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kit Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Premium Pro Kit" {...field} data-testid="input-kit-name" />
                      </FormControl>
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
                          placeholder="Describe the kit and its benefits..."
                          className="min-h-[100px]"
                          {...field}
                          data-testid="input-kit-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="includes"
                  render={() => (
                    <FormItem>
                      <FormLabel>Included Items</FormLabel>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            value={includesInput}
                            onChange={(e) => setIncludesInput(e.target.value)}
                            placeholder="Add an included item..."
                            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddInclude())}
                            data-testid="input-kit-include"
                          />
                          <Button type="button" onClick={handleAddInclude} data-testid="button-add-include">
                            Add
                          </Button>
                        </div>
                        <div className="space-y-2">
                          {form.watch("includes").map((item, index) => (
                            <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                              <div className="flex flex-col gap-0.5">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleMoveIncludeUp(index)}
                                  disabled={index === 0}
                                  data-testid={`button-move-include-up-${index}`}
                                >
                                  <ChevronUp className="h-3 w-3" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  onClick={() => handleMoveIncludeDown(index)}
                                  disabled={index === form.watch("includes").length - 1}
                                  data-testid={`button-move-include-down-${index}`}
                                >
                                  <ChevronDown className="h-3 w-3" />
                                </Button>
                              </div>
                              <span className="flex-1 text-sm">{item}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive hover:text-destructive"
                                onClick={() => handleRemoveInclude(index)}
                                data-testid={`button-remove-include-${index}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="powerKw"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Power (kW)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 3.5" {...field} data-testid="input-kit-power" />
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
                            placeholder="0.00"
                            {...field}
                            onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            data-testid="input-kit-price"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="published"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Published</FormLabel>
                        <div className="text-sm text-muted-foreground">
                          Make this kit visible in the configurator
                        </div>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-kit-published"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    data-testid="button-cancel-kit"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    data-testid="button-save-kit"
                  >
                    {createMutation.isPending ? "Creating..." : "Create Kit"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingKit} onOpenChange={() => setEditingKit(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Kit</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kit Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Premium Pro Kit" {...field} data-testid="input-edit-kit-name" />
                    </FormControl>
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
                        placeholder="Describe the kit and its benefits..."
                        className="min-h-[100px]"
                        {...field}
                        data-testid="input-edit-kit-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includes"
                render={() => (
                  <FormItem>
                    <FormLabel>Included Items</FormLabel>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          value={includesInput}
                          onChange={(e) => setIncludesInput(e.target.value)}
                          placeholder="Add an included item..."
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddInclude())}
                          data-testid="input-edit-kit-include"
                        />
                        <Button type="button" onClick={handleAddInclude} data-testid="button-edit-add-include">
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {form.watch("includes").map((item, index) => (
                          <div key={index} className="flex items-center gap-2 bg-muted p-2 rounded-md">
                            <div className="flex flex-col gap-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => handleMoveIncludeUp(index)}
                                disabled={index === 0}
                                data-testid={`button-edit-move-include-up-${index}`}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-5 w-5"
                                onClick={() => handleMoveIncludeDown(index)}
                                disabled={index === form.watch("includes").length - 1}
                                data-testid={`button-edit-move-include-down-${index}`}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="flex-1 text-sm">{item}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleRemoveInclude(index)}
                              data-testid={`button-edit-remove-include-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="powerKw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Power (kW)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 3.5" {...field} data-testid="input-edit-kit-power" />
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
                          placeholder="0.00"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          data-testid="input-edit-kit-price"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="published"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Published</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Make this kit visible in the configurator
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-edit-kit-published"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingKit(null)}
                  data-testid="button-cancel-edit-kit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMutation.isPending}
                  data-testid="button-update-kit"
                >
                  {updateMutation.isPending ? "Updating..." : "Update Kit"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Kits Grid */}
      <div className="grid gap-4">
        {kits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No equipment kits yet</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create your first equipment kit to get started with the configurator.
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-kit">
                <Plus className="w-4 h-4 mr-2" />
                Create First Kit
              </Button>
            </CardContent>
          </Card>
        ) : (
          kits.map((kit: Kit) => (
            <Card key={kit.id} className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-lg">{kit.name}</CardTitle>
                      {!kit.published && (
                        <Badge variant="outline" data-testid={`badge-unpublished-${kit.id}`}>
                          Unpublished
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{kit.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditKit(kit)}
                      data-testid={`button-edit-kit-${kit.id}`}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteMutation.mutate(kit.id)}
                      disabled={deleteMutation.isPending}
                      data-testid={`button-delete-kit-${kit.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Power</Label>
                    <p className="text-sm text-muted-foreground" data-testid={`text-kit-power-${kit.id}`}>
                      {kit.powerKw} kW
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Price</Label>
                    <p className="text-sm font-semibold" data-testid={`text-kit-price-${kit.id}`}>
                      {formatPrice(parseInt(kit.price.toString()))}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Includes</Label>
                    <p className="text-sm text-muted-foreground" data-testid={`text-kit-includes-${kit.id}`}>
                      {kit.includes?.length || 0} items
                    </p>
                  </div>
                </div>
                {kit.includes && kit.includes.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Included Items:</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {kit.includes.map((item, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}