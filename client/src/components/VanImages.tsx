import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Upload, Trash2, Star, GripVertical, Info } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface VanImagesProps {
  vanId: string;
  images: string[];
  heroImage?: string | null;
}

export function VanImages({ vanId, images, heroImage }: VanImagesProps) {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const file = files[0]; // Upload one at a time
      const sessionId = localStorage.getItem('sessionId');

      if (!sessionId) {
        toast({
          title: "Not authenticated",
          description: "Please log in again",
          variant: "destructive",
        });
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/admin/vans/${vanId}/upload-image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${sessionId}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      // Refresh the van list
      await queryClient.invalidateQueries({ queryKey: ['/api/admin/vans'] });

      toast({
        title: "Success",
        description: "Image uploaded successfully",
      });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleDelete = async (imageUrl: string) => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/admin/vans/${vanId}/images`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify({ objectPath: imageUrl }),
      });

      if (!response.ok) throw new Error('Failed to delete');

      await queryClient.invalidateQueries({ queryKey: ['/api/admin/vans'] });

      toast({
        title: "Success",
        description: "Image deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete image",
        variant: "destructive",
      });
    }
  };

  const handleSetHero = async (imageUrl: string) => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return;

    try {
      const response = await fetch(`/api/admin/vans/${vanId}/hero-image`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify({ objectPath: imageUrl }),
      });

      if (!response.ok) throw new Error('Failed to set hero');

      await queryClient.invalidateQueries({ queryKey: ['/api/admin/vans'] });

      toast({
        title: "Success",
        description: "Hero image updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to set hero image",
        variant: "destructive",
      });
    }
  };

  const handleReorder = async (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= images.length) return;

    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return;

    // Create new array with reordered images
    const reordered = [...images];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);

    try {
      const response = await fetch(`/api/admin/vans/${vanId}/images/reorder`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionId}`,
        },
        body: JSON.stringify({ images: reordered }),
      });

      if (!response.ok) throw new Error('Failed to reorder');

      await queryClient.invalidateQueries({ queryKey: ['/api/admin/vans'] });

      toast({
        title: "Success",
        description: "Images reordered",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reorder images",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center gap-4">
        <input
          type="file"
          id="van-image-upload"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
          disabled={uploading}
        />
        <Button
          type="button"
          onClick={() => document.getElementById('van-image-upload')?.click()}
          disabled={uploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {uploading ? "Uploading..." : "Upload Image"}
        </Button>
        <span className="text-sm text-muted-foreground">
          {images.length} image(s)
        </span>
      </div>

      {/* Image Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="overflow-hidden">
              <div className="aspect-video relative">
                <img
                  src={image}
                  alt={`Van image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {heroImage === image && (
                  <div className="absolute top-2 left-2 bg-yellow-400 text-yellow-900 px-2 py-1 rounded text-xs font-medium">
                    <Star className="w-3 h-3 inline mr-1" />
                    Hero
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onClick={() => handleReorder(index, index - 1)}
                    disabled={index === 0}
                    data-testid={`button-move-up-${index}`}
                  >
                    <ChevronUp className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-6 w-6"
                    onClick={() => handleReorder(index, index + 1)}
                    disabled={index === images.length - 1}
                    data-testid={`button-move-down-${index}`}
                  >
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              <div className="p-2 flex gap-2">
                {heroImage !== image && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSetHero(image)}
                    className="flex-1"
                    data-testid={`button-set-hero-${index}`}
                  >
                    <Star className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => {
                    if (confirm("Delete this image?")) {
                      handleDelete(image);
                    }
                  }}
                  data-testid={`button-delete-${index}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {images.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No images uploaded yet</p>
        </div>
      )}
    </div>
  );
}
