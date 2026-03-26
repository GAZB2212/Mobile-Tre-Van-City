import * as fs from "fs";
import * as path from "path";
import sharp from "sharp";

const ASSETS_DIR = path.resolve(__dirname, "../attached_assets");

function findImages(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findImages(fullPath));
    } else if (/\.(png|jpg|jpeg)$/i.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

async function convertToWebP(imagePath: string): Promise<void> {
  const ext = path.extname(imagePath);
  const webpPath = imagePath.slice(0, -ext.length) + ".webp";

  if (fs.existsSync(webpPath)) {
    console.log(`SKIP (already exists): ${path.relative(ASSETS_DIR, webpPath)}`);
    return;
  }

  await sharp(imagePath).webp({ quality: 85 }).toFile(webpPath);
  const origSize = fs.statSync(imagePath).size;
  const webpSize = fs.statSync(webpPath).size;
  const saving = (((origSize - webpSize) / origSize) * 100).toFixed(1);
  console.log(`CONVERTED: ${path.relative(ASSETS_DIR, imagePath)} -> .webp (${saving}% smaller)`);
}

async function main() {
  const images = findImages(ASSETS_DIR);
  console.log(`Found ${images.length} PNG/JPG/JPEG images to convert.`);
  for (const img of images) {
    try {
      await convertToWebP(img);
    } catch (err) {
      console.error(`ERROR converting ${img}:`, err);
    }
  }
  console.log("Done.");
}

main();
