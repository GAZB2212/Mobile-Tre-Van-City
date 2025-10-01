import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Upload, Trash2, Star } from "lucide-react";
import type { Van } from "@shared/schema";
import type { UploadResult } from "@uppy/core";

interface VanImageGalleryProps {
  van: Van;
}

export function VanImageGallery({ van }: VanImageGalleryProps) {
  const { toast } = useToast();
  const [uploadingImage, setUploadingImage] = useState(false);
  const pendingObjectPath = useRef<string | null>(null);

  const addImageMutation = useMutation({
    mutationFn: async (objectPath: string) => {
      return apiRequest('POST', `/api/admin/vans/${van.id}/images`, { objectPath });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vans'] });
      toast({
        title: "Success",
        description: "Image added to van gallery",
      });
      setUploadingImage(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add image to van",
        variant: "destructive",
      });
      setUploadingImage(false);
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

  const handleGetUploadParameters = async (file: { name: string; type: string }) => {
    setUploadingImage(true);
    const response = await apiRequest('POST', '/api/objects/upload', {
      filename: file.name,
      contentType: file.type,
    }) as { uploadURL: string; objectPath: string };
    
    // Store the objectPath for when upload completes
    pendingObjectPath.current = response.objectPath;
    
    return {
      method: 'PUT' as const,
      url: response.uploadURL,
      objectPath: response.objectPath,
    };
  };

  const handleUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    if (!result.successful || result.successful.length === 0) {
      setUploadingImage(false);
      toast({
        title: "Error",
        description: "Upload failed. Please try again.",
        variant: "destructive",
      });
      return;
    }
    
    // Use the stored objectPath
    if (pendingObjectPath.current) {
      addImageMutation.mutate(pendingObjectPath.current);
      pendingObjectPath.current = null;
    } else {
      setUploadingImage(false);
      toast({
        title: "Error",
        description: "Failed to process uploaded image",
        variant: "destructive",
      });
    }
  };

  const images = van.images || [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Van Images</h3>
        <ObjectUploader
          maxNumberOfFiles={1}
          maxFileSize={5242880}
          onGetUploadParameters={handleGetUploadParameters}
          onComplete={handleUploadComplete}
          buttonClassName="gap-2"
        >
          <Upload className="w-4 h-4" />
          {uploadingImage ? "Uploading..." : "Upload Image"}
        </ObjectUploader>
      </div>

      {images.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No images uploaded yet</p>
            <p className="text-xs text-muted-foreground mt-1">Drag and drop images to upload</p>
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
              <CardContent className="p-2">
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
