import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, Star, ArrowUp, ArrowDown, Upload, X } from "lucide-react";
import type { Van } from "@shared/schema";

interface VanImageGalleryProps {
  van: Van;
}

export function VanImageGallery({ van }: VanImageGalleryProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const addImagesMutation = useMutation({
    mutationFn: async (objectPaths: string[]) => {
      // Add all images sequentially
      for (const objectPath of objectPaths) {
        await apiRequest('POST', `/api/admin/vans/${van.id}/images`, { objectPath });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vans'] });
      toast({
        title: "Success",
        description: "Images added to van gallery",
      });
      setUploading(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add images to van",
        variant: "destructive",
      });
      setUploading(false);
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: async (objectPath: string) => {
      return apiRequest('DELETE', `/api/admin/vans/${van.id}/images`, { objectPath });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vans'] });
      toast({
        title: "Success",
        description: "Image removed from gallery",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove image",
        variant: "destructive",
      });
    },
  });

  const setHeroImageMutation = useMutation({
    mutationFn: async (objectPath: string) => {
      return apiRequest('PUT', `/api/admin/vans/${van.id}/hero-image`, { objectPath });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vans'] });
      toast({
        title: "Success",
        description: "Hero image updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set hero image",
        variant: "destructive",
      });
    },
  });

  const reorderImagesMutation = useMutation({
    mutationFn: async (newOrder: string[]) => {
      return apiRequest('PUT', `/api/admin/vans/${van.id}/images/reorder`, { images: newOrder });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vans'] });
      toast({
        title: "Success",
        description: "Images reordered",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to reorder images",
        variant: "destructive",
      });
    },
  });

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newImages.length) return;
    
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    reorderImagesMutation.mutate(newImages);
  };

  const uploadToObjectStorage = async (file: File): Promise<string> => {
    // Get presigned URL using apiRequest (handles auth properly)
    const presignedResponse = await apiRequest('POST', '/api/admin/objects/presigned-url', {
      filename: file.name,
      contentType: file.type,
    });
    const { url, objectPath } = await presignedResponse.json();

    // Upload file directly to cloud storage
    const uploadResponse = await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    // Set ACL using apiRequest (handles auth properly)
    await apiRequest('POST', '/api/admin/objects/set-acl', {
      objectPath,
      acl: 'public',
    });

    return objectPath;
  };

  const handleFiles = async (files: FileList) => {
    setUploading(true);
    const uploadPromises = Array.from(files).map(file => uploadToObjectStorage(file));

    try {
      const objectPaths = await Promise.all(uploadPromises);
      addImagesMutation.mutate(objectPaths);
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload images. Please try again.',
        variant: 'destructive',
      });
      setUploading(false);
    }
  };

  const images = van.images || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Van Images</h3>
        <div>
          <input
            type="file"
            id="van-image-upload"
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFiles(e.target.files);
              }
            }}
            disabled={uploading}
          />
          <Button
            onClick={() => document.getElementById('van-image-upload')?.click()}
            disabled={uploading}
            data-testid="button-upload-images"
          >
            <Upload className="w-4 h-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Images'}
          </Button>
        </div>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Click "Upload Images" to select files
      </p>

      {images.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No images uploaded yet</p>
            <p className="text-xs text-muted-foreground mt-1">Click "Browse Images" above to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((imagePath, index) => (
            <Card key={index} className="overflow-hidden hover-elevate">
              <div className="aspect-video relative bg-muted">
                <img
                  src={imagePath}
                  alt={`Van image ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {van.heroImage === imagePath && (
                  <Badge className="absolute top-2 left-2 bg-accent text-accent-foreground">
                    <Star className="w-3 h-3 mr-1" />
                    Hero
                  </Badge>
                )}
              </div>
              <CardContent className="p-2 space-y-1">
                <div className="flex gap-1">
                  {van.heroImage !== imagePath && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 h-8 text-xs"
                      onClick={() => setHeroImageMutation.mutate(imagePath)}
                      disabled={setHeroImageMutation.isPending}
                      data-testid={`button-set-hero-${index}`}
                    >
                      <Star className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8"
                    onClick={() => {
                      if (confirm("Remove this image?")) {
                        removeImageMutation.mutate(imagePath);
                      }
                    }}
                    disabled={removeImageMutation.isPending}
                    data-testid={`button-delete-image-${index}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                    onClick={() => moveImage(index, 'up')}
                    disabled={index === 0 || reorderImagesMutation.isPending}
                    data-testid={`button-move-up-${index}`}
                  >
                    <ArrowUp className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 h-7 text-xs"
                    onClick={() => moveImage(index, 'down')}
                    disabled={index === images.length - 1 || reorderImagesMutation.isPending}
                    data-testid={`button-move-down-${index}`}
                  >
                    <ArrowDown className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
