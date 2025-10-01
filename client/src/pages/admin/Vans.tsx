import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Plus, Edit, Trash2, Car, Search } from "lucide-react";
import { Link } from "wouter";
import { VanImageGallery } from "@/components/VanImageGallery";
import type { Van, InsertVan } from "@shared/schema";

export default function AdminVans() {
  const { toast } = useToast();
  const [editingVan, setEditingVan] = useState<Van | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editDialogTab, setEditDialogTab] = useState<string>("details");

  // Fetch vans
  const { data: vans = [], isLoading } = useQuery<Van[]>({
    queryKey: ['/api/vans'],
  });

  // Create van mutation
  const createVanMutation = useMutation({
    mutationFn: async (vanData: InsertVan) => {
      const response = await apiRequest('POST', '/api/admin/vans', vanData);
      return response.json();
    },
    onSuccess: async (createdVan: Van) => {
      console.log('Van created successfully:', createdVan);
      await queryClient.invalidateQueries({ queryKey: ['/api/vans'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Success",
        description: "Van created successfully. Opening image uploader...",
      });
      
      // Small delay to ensure dialog transition is smooth
      setTimeout(() => {
        console.log('Opening edit dialog with Images tab');
        setEditingVan(createdVan);
        setEditDialogTab("images");
        setIsEditDialogOpen(true);
      }, 100);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create van.",
        variant: "destructive",
      });
    },
  });

  // Update van mutation
  const updateVanMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertVan> }) => {
      await apiRequest('PUT', `/api/admin/vans/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vans'] });
      setIsEditDialogOpen(false);
      setEditingVan(null);
      toast({
        title: "Success",
        description: "Van updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update van.",
        variant: "destructive",
      });
    },
  });

  // Delete van mutation
  const deleteVanMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/vans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vans'] });
      toast({
        title: "Success",
        description: "Van deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete van.",
        variant: "destructive",
      });
    },
  });

  const handleCreateVan = (formData: FormData) => {
    const vanData: InsertVan = {
      slug: formData.get('slug') as string,
      title: formData.get('title') as string,
      make: formData.get('make') as string,
      model: formData.get('model') as string,
      year: parseInt(formData.get('year') as string),
      mileage: parseInt(formData.get('mileage') as string),
      price: parseInt(formData.get('price') as string) * 100, // Convert to pence
      vatIncluded: formData.get('vatIncluded') === 'true',
      specs: {
        transmission: formData.get('transmission') as string,
        size: formData.get('size') as string,
        fuel: formData.get('fuel') as string,
        doors: parseInt(formData.get('doors') as string) || undefined,
        engine: formData.get('engine') as string || undefined,
      },
      images: [],
      heroImage: formData.get('heroImage') as string || undefined,
      published: formData.get('published') === 'true',
    };

    createVanMutation.mutate(vanData);
  };

  const handleUpdateVan = (formData: FormData) => {
    if (!editingVan) return;

    const vanData: Partial<InsertVan> = {
      slug: formData.get('slug') as string,
      title: formData.get('title') as string,
      make: formData.get('make') as string,
      model: formData.get('model') as string,
      year: parseInt(formData.get('year') as string),
      mileage: parseInt(formData.get('mileage') as string),
      price: parseInt(formData.get('price') as string) * 100, // Convert to pence
      vatIncluded: formData.get('vatIncluded') === 'true',
      specs: {
        transmission: formData.get('transmission') as string,
        size: formData.get('size') as string,
        fuel: formData.get('fuel') as string,
        doors: parseInt(formData.get('doors') as string) || undefined,
        engine: formData.get('engine') as string || undefined,
      },
      heroImage: formData.get('heroImage') as string || undefined,
      published: formData.get('published') === 'true',
    };

    updateVanMutation.mutate({ id: editingVan.id, data: vanData });
  };

  const VanForm = ({ van, onSubmit, isLoading }: { van?: Van; onSubmit: (formData: FormData) => void; isLoading: boolean }) => {
    const [registration, setRegistration] = useState('');
    const [formValues, setFormValues] = useState({
      title: van?.title || '',
      slug: van?.slug || '',
      make: van?.make || '',
      model: van?.model || '',
      year: van?.year || '',
      mileage: van?.mileage || '',
      price: van ? van.price / 100 : '',
      transmission: van?.specs.transmission || 'Manual',
      size: van?.specs.size || 'MWB',
      fuel: van?.specs.fuel || 'Diesel',
      doors: van?.specs.doors || '',
      engine: van?.specs.engine || '',
    });

    const lookupMutation = useMutation({
      mutationFn: async (reg: string) => {
        const response = await apiRequest('POST', '/api/admin/vehicle-lookup', { registration: reg });
        return response.json();
      },
      onSuccess: (data) => {
        const slug = `${data.make}-${data.model}-${data.year}`.toLowerCase().replace(/\s+/g, '-');
        setFormValues({
          title: data.title,
          slug: slug,
          make: data.make,
          model: data.model,
          year: data.year,
          mileage: data.mileage,
          price: '', // Leave blank for admin to fill
          transmission: data.specs.transmission,
          size: data.specs.size,
          fuel: data.specs.fuel,
          doors: data.specs.doors || '',
          engine: data.specs.engine || '',
        });
        toast({
          title: "Vehicle found",
          description: `Details loaded for ${data.make} ${data.model}`,
        });
      },
      onError: (error: any) => {
        toast({
          title: "Lookup failed",
          description: error.message || "Could not find vehicle with that registration",
          variant: "destructive",
        });
      },
    });

    const handleLookup = () => {
      if (registration.trim()) {
        lookupMutation.mutate(registration);
      }
    };

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          onSubmit(formData);
        }}
      >
        <div className="grid gap-4">
          {!van && (
            <Card className="bg-accent/5">
              <CardContent className="pt-6">
                <Label htmlFor="registration">Vehicle Registration Lookup</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="registration"
                    value={registration}
                    onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                    placeholder="Enter reg e.g. AB12 CDE"
                    className="font-mono"
                    data-testid="input-registration"
                  />
                  <Button
                    type="button"
                    onClick={handleLookup}
                    disabled={!registration.trim() || lookupMutation.isPending}
                    data-testid="button-lookup"
                  >
                    {lookupMutation.isPending ? (
                      "Looking up..."
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        Lookup
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Enter a UK vehicle registration to auto-fill vehicle details
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formValues.title}
                onChange={(e) => setFormValues({...formValues, title: e.target.value})}
                placeholder="Mobile Tyre Van - Ready to Go"
                required
                data-testid="input-van-title"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                name="slug"
                value={formValues.slug}
                onChange={(e) => setFormValues({...formValues, slug: e.target.value})}
                placeholder="ford-transit-custom-2022"
                required
                data-testid="input-van-slug"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="make">Make</Label>
              <Input
                id="make"
                name="make"
                value={formValues.make}
                onChange={(e) => setFormValues({...formValues, make: e.target.value})}
                placeholder="Ford"
                required
                data-testid="input-van-make"
              />
            </div>
            <div>
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                name="model"
                value={formValues.model}
                onChange={(e) => setFormValues({...formValues, model: e.target.value})}
                placeholder="Transit Custom"
                required
                data-testid="input-van-model"
              />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                name="year"
                type="number"
                value={formValues.year}
                onChange={(e) => setFormValues({...formValues, year: e.target.value})}
                placeholder="2022"
                required
                data-testid="input-van-year"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mileage">Mileage</Label>
              <Input
                id="mileage"
                name="mileage"
                type="number"
                value={formValues.mileage}
                onChange={(e) => setFormValues({...formValues, mileage: e.target.value})}
                placeholder="15000"
                required
                data-testid="input-van-mileage"
              />
            </div>
            <div>
              <Label htmlFor="price">Price (£)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formValues.price}
                onChange={(e) => setFormValues({...formValues, price: e.target.value})}
                placeholder="45000"
                required
                data-testid="input-van-price"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="transmission">Transmission</Label>
              <Select name="transmission" value={formValues.transmission} onValueChange={(val) => setFormValues({...formValues, transmission: val})}>
                <SelectTrigger data-testid="select-van-transmission">
                  <SelectValue placeholder="Select transmission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Manual">Manual</SelectItem>
                  <SelectItem value="Automatic">Automatic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="size">Size</Label>
              <Select name="size" value={formValues.size} onValueChange={(val) => setFormValues({...formValues, size: val})}>
                <SelectTrigger data-testid="select-van-size">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SWB">SWB (Short Wheel Base)</SelectItem>
                  <SelectItem value="MWB">MWB (Medium Wheel Base)</SelectItem>
                  <SelectItem value="LWB">LWB (Long Wheel Base)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fuel">Fuel</Label>
              <Select name="fuel" value={formValues.fuel} onValueChange={(val) => setFormValues({...formValues, fuel: val})}>
                <SelectTrigger data-testid="select-van-fuel">
                  <SelectValue placeholder="Select fuel type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Diesel">Diesel</SelectItem>
                  <SelectItem value="Petrol">Petrol</SelectItem>
                  <SelectItem value="Electric">Electric</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="doors">Doors (optional)</Label>
              <Input
                id="doors"
                name="doors"
                type="number"
                value={formValues.doors}
                onChange={(e) => setFormValues({...formValues, doors: e.target.value})}
                placeholder="4"
                data-testid="input-van-doors"
              />
            </div>
            <div>
              <Label htmlFor="engine">Engine (optional)</Label>
              <Input
                id="engine"
                name="engine"
                value={formValues.engine}
                onChange={(e) => setFormValues({...formValues, engine: e.target.value})}
                placeholder="2.0L TDCi"
                data-testid="input-van-engine"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="heroImage">Hero Image URL (optional)</Label>
            <Input
              id="heroImage"
              name="heroImage"
              defaultValue={van?.heroImage || ''}
              placeholder="https://example.com/image.jpg"
              data-testid="input-van-hero-image"
            />
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="vatIncluded"
                name="vatIncluded"
              defaultChecked={van?.vatIncluded}
              data-testid="switch-van-vat-included"
            />
            <Label htmlFor="vatIncluded">VAT Included</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              name="published"
              defaultChecked={van?.published !== false}
              data-testid="switch-van-published"
            />
            <Label htmlFor="published">Published</Label>
          </div>
        </div>
      </div>

        <DialogFooter className="mt-6">
          <Button type="submit" disabled={isLoading} data-testid="button-save-van">
            {isLoading ? "Saving..." : van ? "Update Van" : "Create Van"}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading vans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/admin" data-testid="link-back-to-dashboard">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Van Management</h1>
                <p className="text-muted-foreground">
                  Manage your van inventory and listings
                </p>
              </div>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-van">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Van
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Van</DialogTitle>
                  <DialogDescription>
                    Add a new van to your inventory
                  </DialogDescription>
                </DialogHeader>
                <VanForm onSubmit={handleCreateVan} isLoading={createVanMutation.isPending} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {vans.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Car className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No vans found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first van to the inventory
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                data-testid="button-create-first-van"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Van
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vans.map((van) => (
              <Card key={van.id} className="hover-elevate">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{van.title}</CardTitle>
                    <Badge variant={van.published ? "default" : "secondary"}>
                      {van.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <CardDescription>
                    {van.year} {van.make} {van.model}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-medium">£{(van.price / 100).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Mileage:</span>
                      <span>{van.mileage.toLocaleString()} miles</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Size:</span>
                      <span>{van.specs.size}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Transmission:</span>
                      <span>{van.specs.transmission}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setEditingVan(van);
                        setEditDialogTab("details");
                        setIsEditDialogOpen(true);
                      }}
                      data-testid={`button-edit-van-${van.id}`}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${van.title}"?`)) {
                          deleteVanMutation.mutate(van.id);
                        }
                      }}
                      data-testid={`button-delete-van-${van.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) {
            setEditingVan(null);
            setEditDialogTab("details");
          }
        }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Van</DialogTitle>
              <DialogDescription>
                Update van information, specifications, and images
              </DialogDescription>
            </DialogHeader>
            {editingVan && (
              <Tabs value={editDialogTab} onValueChange={setEditDialogTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
                  <TabsTrigger value="images" data-testid="tab-images">Images</TabsTrigger>
                </TabsList>
                <TabsContent value="details">
                  <VanForm
                    van={editingVan}
                    onSubmit={handleUpdateVan}
                    isLoading={updateVanMutation.isPending}
                  />
                </TabsContent>
                <TabsContent value="images">
                  <VanImageGallery van={editingVan} />
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}