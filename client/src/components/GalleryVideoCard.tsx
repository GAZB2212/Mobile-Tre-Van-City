import { useState, useRef, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Badge } from "@/components/ui/badge";
import { Play } from "lucide-react";

interface GalleryVideoCardProps {
  fileUrl: string;
  title: string;
  storedThumbnailUrl?: string | null;
}

export function GalleryVideoCard({ fileUrl, title, storedThumbnailUrl }: GalleryVideoCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const thumbnailRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = thumbnailRef.current;
    if (v) v.play().catch(() => {});
  }, []);

  useEffect(() => {
    const thumb = thumbnailRef.current;
    if (isModalOpen) {
      if (thumb) thumb.pause();
      const timer = setTimeout(() => {
        if (modalVideoRef.current) modalVideoRef.current.play().catch(() => {});
      }, 100);
      return () => clearTimeout(timer);
    } else {
      if (thumb) thumb.play().catch(() => {});
    }
  }, [isModalOpen]);

  return (
    <>
      <div
        className="w-full h-full relative group cursor-pointer"
        onClick={() => setIsModalOpen(true)}
        data-testid="button-play-video"
      >
        <video
          ref={thumbnailRef}
          src={fileUrl}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          poster={storedThumbnailUrl || undefined}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/20 group-hover:bg-black/35 transition-colors">
          <div className="w-14 h-14 rounded-full bg-accent/90 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
            <Play className="w-7 h-7 text-accent-foreground ml-0.5" />
          </div>
          <Badge variant="secondary" className="text-xs pointer-events-none">Video</Badge>
        </div>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl p-2 sm:p-3 bg-black border-border">
          <VisuallyHidden><DialogTitle>{title}</DialogTitle></VisuallyHidden>
          <video
            ref={modalVideoRef}
            src={fileUrl}
            controls
            playsInline
            className="w-full rounded"
            style={{ maxHeight: "80vh" }}
            data-testid="video-player-modal"
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
