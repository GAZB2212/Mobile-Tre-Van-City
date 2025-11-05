// Script to upload videos from attached_assets to object storage
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';

const BUCKET_ID = process.env.REPLIT_OBJSTORE_BUCKET_ID || 'replit-objstore-0c1756d1-950b-4a98-a3ee-b578220f8ce4';

async function uploadVideos() {
  const storage = new Storage();
  const bucket = storage.bucket(BUCKET_ID);

  const videoFiles = [
    'ZenoVideo 20_1759504716286.mp4',
    'ZenoVideo 14_1759504750775.mp4',
    'ZenoVideo 8_1759504750775.mp4'
  ];

  for (const filename of videoFiles) {
    const localPath = path.join('attached_assets', filename);
    const remotePath = `media/${filename}`;

    if (!fs.existsSync(localPath)) {
      console.log(`❌ File not found: ${localPath}`);
      continue;
    }

    console.log(`📤 Uploading ${filename}...`);
    
    try {
      await bucket.upload(localPath, {
        destination: remotePath,
        metadata: {
          cacheControl: 'public, max-age=31536000',
        },
        public: true, // Make publicly accessible
      });
      
      console.log(`✅ Uploaded: ${remotePath}`);
      console.log(`   URL: /objects/${remotePath}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${filename}:`, error.message);
    }
  }
  
  console.log('\n✅ All videos uploaded!');
}

uploadVideos().catch(console.error);
