import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Play, Film } from "lucide-react";

interface GalleryVideoCardProps {
  fileUrl: string;
  title: string;
  storedThumbnailUrl?: string | null;
}

export function GalleryVideoCard({ fileUrl, title, storedThumbnailUrl }: GalleryVideoCardProps) {
  const [thumbnail, setThumbnail] = useState<string | null>(storedThumbnailUrl || null);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const hiddenVideoRef = useRef<HTMLVideoElement>(null);

  const captureThumbnail = useCallback(() => {
    const video = hiddenVideoRef.current;
    if (!video || thumbnail) return;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext("2d");
      if (ctx && video.videoWidth > 0) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.75);
        if (dataUrl && dataUrl !== "data:,") {
          setThumbnail(dataUrl);
        } else {
          setThumbnailFailed(true);
        }
      } else {
        setThumbnailFailed(true);
      }
    } catch {
      setThumbnailFailed(true);
    }
  }, [thumbnail]);

  return (
    <>
      <div
        className="w-full h-full relative group cursor-pointer"
        onClick={() => setIsModalOpen(true)}
        data-testid="button-play-video"
      >
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted to-muted/70 flex items-center justify-center">
            {thumbnailFailed && <Film className="w-10 h-10 text-muted-foreground/40" />}
          </div>
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/25 group-hover:bg-black/40 transition-colors">
          <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
            <Play className="w-7 h-7 text-accent-foreground ml-0.5" />
          </div>
          <Badge variant="secondary" className="text-xs pointer-events-none">Video</Badge>
        </div>
      </div>

      <video
        ref={hiddenVideoRef}
        src={fileUrl}
        preload="metadata"
        muted
        playsInline
        crossOrigin="anonymous"
        style={{ display: "none", position: "absolute", pointerEvents: "none" }}
        onLoadedMetadata={(e) => {
          const video = e.currentTarget;
          const duration = video.duration;
          video.currentTime = duration && duration > 1 ? 1 : 0.1;
        }}
        onSeeked={captureThumbnail}
        onError={() => setThumbnailFailed(true)}
      />

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl p-2 sm:p-4 bg-black border-border">
          <video
            src={fileUrl}
            controls
            autoPlay
            playsInline
            className="w-full rounded"
            style={{ maxHeight: "80vh" }}
            data-testid="video-player-modal"
          >
            Your browser does not support the video tag.
          </video>
        </DialogContent>
      </Dialog>
    </>
  );
}
