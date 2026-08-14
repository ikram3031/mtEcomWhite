import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '../RawUpload');
const outputDir = path.join(__dirname, '../RawUpload/converted');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const images = [
  'For her.png',
  'Unisex.png',
  'for him.png'
];

async function convertImage(fileName) {
  const inputPath = path.join(inputDir, fileName);
  const baseName = path.parse(fileName).name;
  const outputPath = path.join(outputDir, `${baseName}.webp`);

  console.log(`Processing ${fileName}...`);

  // We want the size to be between 200KB and 300KB (max).
  // Let's start with quality 85, and adjust.
  let quality = 85;
  let buffer;
  let sizeKB = 0;
  
  // Load metadata to see dimensions
  const metadata = await sharp(inputPath).metadata();
  console.log(`Original dimensions: ${metadata.width}x${metadata.height}`);

  // Let's resize to a max width/height of 1600 to keep it very high quality but reasonable resolution
  let pipeline = sharp(inputPath);
  if (metadata.width > 1600 || metadata.height > 1600) {
    pipeline = pipeline.resize(1600, 1600, { fit: 'inside', withoutEnlargement: true });
  }

  // Iterate to find the best quality that fits in 200KB - 300KB
  for (let attempt = 0; attempt < 10; attempt++) {
    buffer = await pipeline.clone().webp({ quality }).toBuffer();
    sizeKB = buffer.length / 1024;
    console.log(`Attempt ${attempt + 1}: Quality = ${quality}, Size = ${sizeKB.toFixed(2)} KB`);

    if (sizeKB > 300) {
      quality -= 5;
    } else if (sizeKB < 200 && quality < 95) {
      quality += 2;
    } else {
      break;
    }
    if (quality < 20 || quality > 100) break;
  }

  fs.writeFileSync(outputPath, buffer);
  console.log(`Saved ${outputPath} (${(buffer.length / 1024).toFixed(2)} KB)`);
}

async function run() {
  for (const img of images) {
    try {
      await convertImage(img);
    } catch (err) {
      console.error(`Failed to convert ${img}:`, err);
    }
  }
}

run();
