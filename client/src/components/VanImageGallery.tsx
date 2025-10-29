import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Star, ArrowUp, ArrowDown, Trash2 } from "lucide-react";
import type { Van } from "@shared/schema";

interface VanImageGalleryProps {
  van: Van;
}

export function VanImageGallery({ van }: VanImageGalleryProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const images = van.images || [];

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Request presigned URL
      const presignedResponse = await apiRequest(
        "POST",
        "/api/admin/objects/presigned-url",
        {
          filename: file.name,
          contentType: file.type,
        }
      );
      const { uploadURL, objectPath } = await presignedResponse.json();

      // Upload to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload file");
      }

      // Set ACL to public
      await apiRequest("POST", "/api/admin/objects/set-acl", {
        objectPath,
        acl: "public",
      });

      // Add image to van
      await apiRequest("POST", `/api/admin/vans/${van.id}/images`, {
        objectPath,
      });

      return objectPath;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vans'] });
      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeImageMutation = useMutation({
    mutationFn: async (objectPath: string) => {
      return apiRequest('DELETE', `/api/admin/vans/${van.id}/images`, { objectPath });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vans'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vans'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vans'] });
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

  const handleFileSelect = async (files: FileList | null) => {
    console.log('🖼️ VanImageGallery handleFileSelect called with files:', files?.length || 0);
    if (!files || files.length === 0) return;

    const filesToUpload = Array.from(files);

    for (const file of filesToUpload) {
      console.log('📄 Processing file:', file.name, file.type, file.size);
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not an image file`,
          variant: "destructive",
        });
        continue;
      }

      // Validate file size (10MB max)
      if (file.size > 10485760) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 10MB limit`,
          variant: "destructive",
        });
        continue;
      }

      setUploading(true);
      console.log('⬆️ Starting upload mutation for:', file.name);
      try {
        await uploadMutation.mutateAsync(file);
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newImages.length) return;
    
    [newImages[index], newImages[newIndex]] = [newImages[newIndex], newImages[index]];
    reorderImagesMutation.mutate(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className="border-2 border-dashed">
        <div className="p-6 text-center">
          <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm font-medium mb-1">
            Click to browse or drag and drop van images
          </p>
          <p className="text-xs text-muted-foreground mb-4">
            PNG, JPG, GIF up to 10MB
          </p>
          <input
            type="file"
            id="van-image-upload"
            multiple
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={uploading}
            data-testid="input-van-images"
          />
          <label htmlFor="van-image-upload">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("van-image-upload")?.click();
              }}
              data-testid="button-upload-images"
            >
              {uploading ? "Uploading..." : "Select Images"}
            </Button>
          </label>
        </div>
      </Card>

      {/* Image Gallery */}
      {images.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          <p>No images uploaded yet</p>
        </div>
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
                  data-testid={`img-van-preview-${index}`}
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
