import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Simple image URL handler that works with both GCS URLs and backend proxy paths
export function getImageUrl(imagePath: string | null | undefined): string {
  // Handle null/undefined
  if (!imagePath) {
    return '';
  }
  
  // If it's a full GCS URL pointing to upgrade-images, convert to backend proxy path
  // This handles images uploaded from the deployed site before the fix
  if (imagePath.startsWith('https://storage.googleapis.com/')) {
    const upgradeImagesMatch = imagePath.match(/\/upgrade-images\/([^?]+)/);
    if (upgradeImagesMatch) {
      return `/objects/upgrade-images/${upgradeImagesMatch[1]}`;
    }
    const vanImagesMatch = imagePath.match(/\/van-images\/([^?]+)/);
    if (vanImagesMatch) {
      return `/objects/van-images/${vanImagesMatch[1]}`;
    }
    const productImagesMatch = imagePath.match(/\/product-images\/([^?]+)/);
    if (productImagesMatch) {
      return `/objects/product-images/${productImagesMatch[1]}`;
    }
    // For any other GCS URL, try to use it directly (may not work in production)
    return imagePath;
  }
  
  // If it's a relative path starting with /objects/, keep it for backend proxy
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
