import mongoose from "mongoose";
import sharp from "sharp";
import fs from "fs";
import path from "path";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://admin:11223345@127.0.0.1:27017/perfume-store?authSource=admin";

async function run() {
  try {
    // 1. MongoDB User Creation
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB.");

    const db = mongoose.connection.db;
    const usersCol = db.collection("users");

    const existing = await usersCol.findOne({ email: "ihkhan2027@gmail.com" });
    if (!existing) {
      await usersCol.insertOne({
        name: "IH Khan",
        email: "ihkhan2027@gmail.com",
        role: "Admin",
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log("Successfully created user: ihkhan2027@gmail.com");
    } else {
      console.log("User ihkhan2027@gmail.com already exists.");
    }

    // 2. Logo Optimization
    const uploadsDir = path.join(process.cwd(), "uploads");
    const logoPngPath = path.join(uploadsDir, "logo_horizontal.png");
    const logoOptPngPath = path.join(uploadsDir, "logo_horizontal_opt.png");
    const logoWebpPath = path.join(uploadsDir, "logo_horizontal.webp");

    if (fs.existsSync(logoPngPath)) {
      const origSize = fs.statSync(logoPngPath).size;
      console.log(`Original logo_horizontal.png size: ${(origSize / 1024).toFixed(2)} KB`);

      // Compress PNG to ultra-lightweight palette PNG
      await sharp(logoPngPath)
        .resize({ width: 320, fit: "inside", withoutEnlargement: true })
        .png({ compressionLevel: 9, quality: 75, palette: true })
        .toFile(logoOptPngPath);

      // Replace original PNG with optimized version
      fs.copyFileSync(logoOptPngPath, logoPngPath);
      fs.unlinkSync(logoOptPngPath);

      // Also create WebP version
      await sharp(logoPngPath)
        .resize({ width: 320, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 75 })
        .toFile(logoWebpPath);

      const newSize = fs.statSync(logoPngPath).size;
      const webpSize = fs.statSync(logoWebpPath).size;
      console.log(`Optimized PNG size: ${(newSize / 1024).toFixed(2)} KB`);
      console.log(`Optimized WebP size: ${(webpSize / 1024).toFixed(2)} KB`);
    } else {
      console.log("logo_horizontal.png not found at:", logoPngPath);
    }
  } catch (err) {
    console.error("Script error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
