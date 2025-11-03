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

// Convert image paths to use backend proxy for all environments
export function getImageUrl(imagePath: string | null | undefined): string {
  // Handle null/undefined
  if (!imagePath) {
    return '';
  }
  
  // If it's a full GCS URL, convert it to relative path to use backend proxy
  if (imagePath.startsWith('https://storage.googleapis.com/')) {
    const match = imagePath.match(/https:\/\/storage\.googleapis\.com\/[^\/]+\/(.*)/);
    if (match) {
      return `/objects/${match[1]}`;
    }
  }
  
  // If it's already a relative path starting with /objects/, use it as-is
  if (imagePath.startsWith('/objects/')) {
    return imagePath;
  }
  
  // Otherwise return as-is (shouldn't happen, but just in case)
  return imagePath;
}
