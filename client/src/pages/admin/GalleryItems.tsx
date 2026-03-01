import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AdminBackButton } from "@/components/AdminBackButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Image as ImageIcon, Video, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { GalleryItem, InsertGalleryItem } from "@shared/schema";
import { ObjectUploader } from "@/components/ObjectUploader";
import type { UploadResult } from "@uppy/core";

const categories = [
  "Complete Builds",
  "Interior Layouts",
  "Equipment Installation",
  "Branding & Livery",
  "Van Designs",
  "Process Videos",
  "Customer Showcases",
] as const;

export default function AdminGalleryItems() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    category: categories[0],
    type: "image" as "image" | "video",
    fileUrl: "",
    thumbnailUrl: "",
    description: "",
    sortOrder: 0,
    published: true,
  });

  const { data: items = [], isLoading } = useQuery<GalleryItem[]>({
    queryKey: ['/api/admin/gallery-items'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertGalleryItem) => {
      const response = await apiRequest('POST', '/api/admin/gallery-items', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gallery-items'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Success",
        description: "Gallery item created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create gallery item.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertGalleryItem> }) => {
      await apiRequest('PUT', `/api/admin/gallery-items/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gallery-items'] });
      setIsEditDialogOpen(false);
      setEditingItem(null);
      resetForm();
      toast({
        title: "Success",
        description: "Gallery item updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update gallery item.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/admin/gallery-items/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/gallery-items'] });
      toast({
        title: "Success",
        description: "Gallery item deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete gallery item.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      category: categories[0],
      type: "image",
      fileUrl: "",
      thumbnailUrl: "",
      description: "",
      sortOrder: 0,
      published: true,
    });
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      category: item.category,
      type: item.type as "image" | "video",
      fileUrl: item.fileUrl,
      thumbnailUrl: item.thumbnailUrl || "",
      description: item.description || "",
      sortOrder: item.sortOrder,
      published: item.published,
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fileUrl) {
      toast({
        title: "Error",
        description: "Please upload a file",
        variant: "destructive",
      });
      return;
    }

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleFileUpload = async (result: UploadResult) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const fileUrl = `/objects/${uploadedFile.uploadURL || uploadedFile.response?.body?.path}`;
      
      setFormData(prev => ({ ...prev, fileUrl }));
      
      toast({
        title: "Success",
        description: "File uploaded successfully",
      });
    }
  };

  const handleThumbnailUpload = async (result: UploadResult) => {
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      const thumbnailUrl = `/objects/${uploadedFile.uploadURL || uploadedFile.response?.body?.path}`;
      
      setFormData(prev => ({ ...prev, thumbnailUrl }));
      
      toast({
        title: "Success",
        description: "Thumbnail uploaded successfully",
      });
    }
  };

  return (
    <>
      <AdminBackButton />
      <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-gallery-items-title">Gallery Items</h1>
          <p className="text-muted-foreground">Manage gallery images and videos</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-item">
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No gallery items yet</CardTitle>
            <CardDescription>Create your first gallery item to get started</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Preview</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                  <TableCell>
                    <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
                      {item.type === 'video' ? (
                        <Video className="w-8 h-8 text-muted-foreground" />
                      ) : (
                        <img 
                          src={item.fileUrl} 
                          alt={item.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            (e.target as HTMLImageElement).parentElement!.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-muted-foreground"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                          }}
                        />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{item.title}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>
                    <Badge variant={item.type === 'video' ? 'secondary' : 'default'}>
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.sortOrder}</TableCell>
                  <TableCell>
                    {item.published ? (
                      <Badge variant="default">
                        <Eye className="w-3 h-3 mr-1" />
                        Published
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <EyeOff className="w-3 h-3 mr-1" />
                        Draft
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(item)}
                      data-testid={`button-edit-${item.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this item?')) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      data-testid={`button-delete-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setEditingItem(null);
          resetForm();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Gallery Item' : 'Create Gallery Item'}</DialogTitle>
            <DialogDescription>
              {editingItem ? 'Update gallery item details' : 'Add a new item to the gallery'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                data-testid="input-title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category" data-testid="select-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "image" | "video") => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type" data-testid="select-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">Image</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>File Upload</Label>
              <ObjectUploader
                endpoint="/api/admin/objects/presigned-url"
                allowedFileTypes={formData.type === 'video' ? ['video/*'] : ['image/*']}
                maxNumberOfFiles={1}
                onComplete={handleFileUpload}
                data-testid="uploader-file"
              />
              {formData.fileUrl && (
                <div className="text-sm text-muted-foreground">
                  File uploaded: {formData.fileUrl.split('/').pop()}
                </div>
              )}
            </div>

            {formData.type === 'video' && (
              <div className="space-y-2">
                <Label>Thumbnail (Optional)</Label>
                <ObjectUploader
                  endpoint="/api/admin/objects/presigned-url"
                  allowedFileTypes={['image/*']}
                  maxNumberOfFiles={1}
                  onComplete={handleThumbnailUpload}
                  data-testid="uploader-thumbnail"
                />
                {formData.thumbnailUrl && (
                  <div className="text-sm text-muted-foreground">
                    Thumbnail uploaded: {formData.thumbnailUrl.split('/').pop()}
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                data-testid="input-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                  data-testid="input-sort-order"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="published">Status</Label>
                <Select
                  value={formData.published ? "published" : "draft"}
                  onValueChange={(value) => setFormData({ ...formData, published: value === "published" })}
                >
                  <SelectTrigger id="published" data-testid="select-published">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setEditingItem(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending || !formData.fileUrl}
                data-testid="button-submit"
              >
                {editingItem ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
}
