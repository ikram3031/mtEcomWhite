import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { sendOtpEmail } from "../src/core/utils/otpDelivery.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const recipient = process.argv[2]?.trim() || "metalhead.developer@gmail.com";

const testOtpEmailDelivery = async () => {
  console.log(`🚀 Sending OTP test email to: ${recipient}...`);

  const result = await sendOtpEmail({
    toEmail: recipient,
    otp: "884920",
    name: "Ikramul Hoque",
    type: "registration"
  });

  if (result.delivered) {
    console.log(`✅ OTP Test Email successfully delivered to ${recipient}`);
  } else {
    console.error(`❌ Failed to deliver OTP email:`, result.reason);
    process.exit(1);
  }
};

testOtpEmailDelivery().catch((error) => {
  console.error("❌ Unexpected error sending OTP email:", error);
  process.exit(1);
});
