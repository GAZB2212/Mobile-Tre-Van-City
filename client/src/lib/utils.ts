import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple image URL handler that works with public GCS URLs
export function getImageUrl(imagePath: string | null | undefined): string {
  // Handle null/undefined
  if (!imagePath) {
    return '';
  }
  
  // If it's a full GCS URL (public bucket), use it directly - these work in production!
  if (imagePath.startsWith('https://storage.googleapis.com/')) {
    return imagePath;
  }
  
  // If it's a relative path starting with /objects/, keep it for backend proxy
  // This is for legacy images or private images
  if (imagePath.startsWith('/objects/')) {
    return imagePath;
  }
  
  // Otherwise return as-is
  return imagePath;
}

// Legacy function - no longer needed but kept for compatibility
export async function initializeBucketName(): Promise<void> {
  // No longer needed - we use direct public URLs now
}
