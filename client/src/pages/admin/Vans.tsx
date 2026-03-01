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
import { VanImages } from "@/components/VanImages";
import { VanFormNew } from "./VanFormNew";
import { VanWizard } from "@/components/VanWizard";
import type { Van, InsertVan } from "@shared/schema";

export default function AdminVans() {
  const { toast } = useToast();
  const [editingVanId, setEditingVanId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editDialogTab, setEditDialogTab] = useState<string>("details");

  // Fetch vans (using admin endpoint to see all vans including unpublished)
  const { data: vans = [], isLoading } = useQuery<Van[]>({
    queryKey: ['/api/admin/vans'],
  });

  // Derive editingVan live from query cache so images update immediately after upload
  const editingVan = vans.find(v => v.id === editingVanId) ?? null;

  // Create van mutation
  const createVanMutation = useMutation({
    mutationFn: async (vanData: InsertVan) => {
      const response = await apiRequest('POST', '/api/admin/vans', vanData);
      return response.json();
    },
    onSuccess: async (createdVan: Van) => {
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/vans'] });
      setIsCreateDialogOpen(false);
      toast({
        title: "Van created!",
        description: "Add photos using the Images tab below.",
      });
      // Open edit dialog straight onto the Images tab so photos can be added immediately
      setEditingVanId(createdVan.id);
      setEditDialogTab("images");
      setIsEditDialogOpen(true);
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vans'] });
      setIsEditDialogOpen(false);
      setEditingVanId(null);
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vans'] });
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

  // Fix van image ACLs mutation
  const fixAclsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/admin/vans/fix-acls', {});
      return response.json();
    },
    onSuccess: (data: { fixedCount: number; message: string }) => {
      toast({
        title: "Success",
        description: data.message || `Fixed ${data.fixedCount} images`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to fix image permissions.",
        variant: "destructive",
      });
    },
  });

  const handleCreateVan = async (formData: FormData, selectedFiles?: File[]) => {
    // Get files from the component state (passed as parameter)
    const files = selectedFiles;
    
    // Debug: Log FormData contents
    console.log("📝 FormData entries:");
    Array.from(formData.entries()).forEach(([key, value]) => {
      console.log(`  ${key}:`, value);
    });
    
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      toast({
        title: "Not authenticated",
        description: "Please log in again",
        variant: "destructive",
      });
      return;
    }

    // Upload images first if any (max 10)
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      try {
        toast({
          title: "Uploading images...",
          description: `Uploading ${files.length} image(s)`,
        });

        for (let i = 0; i < files.length; i++) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', files[i]);

          const response = await fetch(`/api/admin/temp-upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionId}`,
            },
            body: uploadFormData,
          });

          if (!response.ok) throw new Error('Upload failed');
          
          const data = await response.json();
          imageUrls.push(data.url);
          // File is automatically made public during upload - no ACL step needed
        }
      } catch (error) {
        toast({
          title: "Upload failed",
          description: "Could not upload images",
          variant: "destructive",
        });
        return;
      }
    }

    const vanData: InsertVan = {
      slug: formData.get('slug') as string,
      title: formData.get('title') as string,
      make: formData.get('make') as string,
      model: formData.get('model') as string,
      year: parseInt(formData.get('year') as string),
      mileage: parseInt(formData.get('mileage') as string),
      price: parseInt(formData.get('price') as string) * 100,
      vatIncluded: formData.get('vatIncluded') === 'on',
      specs: {
        transmission: formData.get('transmission') as string,
        size: formData.get('size') as string,
        fuel: formData.get('fuel') as string,
        doors: parseInt(formData.get('doors') as string) || undefined,
        engine: formData.get('engine') as string || undefined,
      },
      images: imageUrls,
      heroImage: imageUrls[0] || undefined,
      description: (formData.get('description') as string) || undefined,
      published: formData.get('published') === 'on',
      euroStatus: (formData.get('euroStatus') as string) || undefined,
    };

    createVanMutation.mutate(vanData);
  };

  const handleUpdateVan = async (formData: FormData, selectedFiles?: File[]) => {
    if (!editingVan) return;

    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      toast({
        title: "Not authenticated",
        description: "Please log in again",
        variant: "destructive",
      });
      return;
    }

    // Upload new images if any
    let newImageUrls: string[] = [];
    if (selectedFiles && selectedFiles.length > 0) {
      try {
        toast({
          title: "Uploading images...",
          description: `Uploading ${selectedFiles.length} image(s)`,
        });

        for (let i = 0; i < selectedFiles.length; i++) {
          const uploadFormData = new FormData();
          uploadFormData.append('file', selectedFiles[i]);

          const response = await fetch('/api/admin/temp-upload', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionId}`,
            },
            body: uploadFormData,
          });

          if (!response.ok) {
            throw new Error(`Failed to upload image ${i + 1}`);
          }

          const { url } = await response.json();
          newImageUrls.push(url);
        }

        toast({
          title: "Images uploaded",
          description: `Successfully uploaded ${newImageUrls.length} image(s)`,
        });
      } catch (error) {
        toast({
          title: "Image upload failed",
          description: error instanceof Error ? error.message : "Failed to upload images",
          variant: "destructive",
        });
        return;
      }
    }

    // Get existing images from the form (if managing them separately)
    const imagesJson = formData.get('images') as string;
    const existingImages = imagesJson ? JSON.parse(imagesJson) : (editingVan.images || []);

    // Combine existing and new images
    const allImages = [...existingImages, ...newImageUrls];

    const vanData: Partial<InsertVan> = {
      slug: formData.get('slug') as string,
      title: formData.get('title') as string,
      make: formData.get('make') as string,
      model: formData.get('model') as string,
      year: parseInt(formData.get('year') as string),
      mileage: parseInt(formData.get('mileage') as string),
      price: parseInt(formData.get('price') as string) * 100, // Convert to pence
      vatIncluded: formData.get('vatIncluded') === 'on',
      specs: {
        transmission: formData.get('transmission') as string,
        size: formData.get('size') as string,
        fuel: formData.get('fuel') as string,
        doors: parseInt(formData.get('doors') as string) || undefined,
        engine: formData.get('engine') as string || undefined,
      },
      images: allImages,
      heroImage: allImages[0] || formData.get('heroImage') as string || undefined,
      description: (formData.get('description') as string) || undefined,
      published: formData.get('published') === 'on',
      euroStatus: (formData.get('euroStatus') as string) || undefined,
    };

    updateVanMutation.mutate({ id: editingVan.id, data: vanData });
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
                  Back to Admin
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Van Management</h1>
                <p className="text-muted-foreground">
                  Manage your van inventory and listings
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => fixAclsMutation.mutate()}
                disabled={fixAclsMutation.isPending}
                data-testid="button-fix-acls"
              >
                {fixAclsMutation.isPending ? "Fixing..." : "Fix Image Permissions"}
              </Button>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-van">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Van
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <VanWizard onComplete={handleCreateVan} isLoading={createVanMutation.isPending} />
                </DialogContent>
              </Dialog>
            </div>
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
                        setEditingVanId(van.id);
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
            setEditingVanId(null);
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
                  <VanFormNew
                    van={editingVan}
                    onSubmit={handleUpdateVan}
                    isLoading={updateVanMutation.isPending}
                  />
                </TabsContent>
                <TabsContent value="images">
                  <VanImages 
                    vanId={editingVan.id} 
                    images={editingVan.images || []} 
                    heroImage={editingVan.heroImage}
                  />
                </TabsContent>
              </Tabs>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}