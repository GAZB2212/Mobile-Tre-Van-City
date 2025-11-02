import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Cache for bucket name - set on app initialization
let cachedBucketName: string | null = null;

// Initialize bucket name from backend - call this on app startup
export async function initializeBucketName(): Promise<void> {
  if (cachedBucketName) {
    return;
  }
  
  try {
    const response = await fetch('/api/storage/config');
    const data = await response.json();
    cachedBucketName = data.bucketName || '';
  } catch (err) {
    console.error('Failed to fetch bucket name:', err);
    cachedBucketName = '';
  }
}

// Convert relative object storage paths to full GCS URLs for production
export function getImageUrl(imagePath: string | null | undefined): string {
  // Handle null/undefined
  if (!imagePath) {
    return '';
  }
  
  // In development, always use relative paths (go through backend proxy)
  const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost' || window.location.hostname.includes('replit.dev');
  
  if (isDevelopment) {
    // If it's a full GCS URL, convert it to relative path for development
    if (imagePath.startsWith('https://storage.googleapis.com/')) {
      const match = imagePath.match(/https:\/\/storage\.googleapis\.com\/[^\/]+\/(.*)/);
      if (match) {
        return `/objects/${match[1]}`;
      }
    }
    return imagePath;
  }
  
  // In production: Normalize all image URLs
  
  // If it's a full GCS URL, update the bucket name if we have it cached
  if (imagePath.startsWith('https://storage.googleapis.com/')) {
    if (cachedBucketName) {
      // Extract the object path after the bucket name
      const match = imagePath.match(/https:\/\/storage\.googleapis\.com\/[^\/]+\/(.*)/);
      if (match) {
        const objectPath = match[1];
        return `https://storage.googleapis.com/${cachedBucketName}/${objectPath}`;
      }
    }
    // If no cached bucket name yet, return as-is (might work if bucket name is correct)
    return imagePath;
  }
  
  // If it's a relative path starting with /objects/, convert to full GCS URL
  if (imagePath.startsWith('/objects/')) {
    if (cachedBucketName) {
      const objectPath = imagePath.replace('/objects/', '');
      return `https://storage.googleapis.com/${cachedBucketName}/${objectPath}`;
    }
    // Fallback: return relative path (backend proxy will handle it)
    return imagePath;
  }
  
  // Otherwise return as-is
  return imagePath;
}
