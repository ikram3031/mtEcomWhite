/**
 * Upsert admin user: ikramul.web@gmail.com with password 11223345
 * Run: node backend/scripts/reset-owner-password.js
 */
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../.env") });

const MONGO_URI = process.env.MONGODB_URI || "mongodb://admin:11223345@144.79.218.126:27017/perfume-store?authSource=admin";
const TARGET_EMAIL = "ikramul.web@gmail.com";
const NEW_PASSWORD = "11223345";

const userSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    phone:      { type: String, required: true, trim: true },
    role:       { type: String, default: "Owner" },
    isActive:   { type: Boolean, default: true },
    did:        { type: String, unique: true },
  },
  { timestamps: true, versionKey: false }
);

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const passwordHash = await bcrypt.hash(NEW_PASSWORD, 12);

  const result = await UserModel.findOneAndUpdate(
    { email: TARGET_EMAIL },
    {
      $set: {
        name: "Developer",
        email: TARGET_EMAIL,
        passwordHash,
        phone: "01712345678",
        role: "Owner",
        isActive: true,
        did: `did:decantre:owner:ikramul`,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  console.log(`✅ User upserted: ${result.email} | role: ${result.role}`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
