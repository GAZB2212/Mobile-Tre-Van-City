import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert relative object storage paths to full GCS URLs for production
export function getImageUrl(imagePath: string): string {
  // If it's already a full URL (starts with http:// or https://), return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // In development, keep relative paths as-is (they'll go through backend proxy)
  // Only convert to full GCS URLs in production
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('replit.dev');
  
  if (isDevelopment) {
    return imagePath;
  }
  
  // In production: If it's a relative path starting with /objects/, convert to full GCS URL
  if (imagePath.startsWith('/objects/')) {
    // Extract the path after /objects/
    const objectPath = imagePath.replace('/objects/', '');
    // Get bucket name from environment or use default format
    const bucketName = `repl-default-bucket-${import.meta.env.VITE_REPL_ID || '40ccc4c6-bf62-4879-8e9a-f1f1e65f56a9'}`;
    return `https://storage.googleapis.com/${bucketName}/${objectPath}`;
  }
  
  // Otherwise return as-is (shouldn't happen, but safe fallback)
  return imagePath;
}
