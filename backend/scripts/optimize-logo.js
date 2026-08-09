import sharp from "sharp";
import path from "path";
import fs from "fs";

const inputPath = path.join(process.cwd(), "uploads", "logo_horizontal.png");
const outputPngPath = path.join(process.cwd(), "uploads", "logo_horizontal_opt.png");
const outputWebpPath = path.join(process.cwd(), "uploads", "logo_horizontal.webp");

async function optimizeLogo() {
  try {
    if (!fs.existsSync(inputPath)) {
      console.error("Input file not found:", inputPath);
      return;
    }

    const metadata = await sharp(inputPath).metadata();
    console.log("Original Metadata:", metadata);

    // Resize to width 350px (perfect for email headers) and compress PNG
    await sharp(inputPath)
      .resize({ width: 350, fit: "inside", withoutEnlargement: true })
      .png({ compressionLevel: 9, quality: 80, palette: true })
      .toFile(outputPngPath);

    // Also generate WebP version
    await sharp(inputPath)
      .resize({ width: 350, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(outputWebpPath);

    const origStats = fs.statSync(inputPath);
    const pngStats = fs.statSync(outputPngPath);
    const webpStats = fs.statSync(outputWebpPath);

    console.log(`Original PNG Size: ${(origStats.size / 1024).toFixed(2)} KB`);
    console.log(`Optimized PNG Size: ${(pngStats.size / 1024).toFixed(2)} KB`);
    console.log(`Optimized WebP Size: ${(webpStats.size / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error("Optimization failed:", error);
  }
}

optimizeLogo();
