import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { buildOrderInvoiceEmailHtml } from "../src/templates/orderInvoiceEmailTemplate.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const recipient = process.argv[2]?.trim() || "metalhead.developer@gmail.com";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.hostinger.com",
  port: Number(process.env.SMTP_PORT || 587),
  secure: (process.env.SMTP_ENCRYPTION || "TLS").toLowerCase() === "ssl",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendInvoiceTestEmail = async () => {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
    throw new Error("SMTP credentials are not configured in the environment");
  }

  await transporter.verify();

  const orderId = "DEC-884920";
  const htmlContent = buildOrderInvoiceEmailHtml({
    order: {
      orderId,
      createdAt: new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }),
      customerName: "Ikramul Hoque",
      customerEmail: recipient,
      customerPhone: "+880 1712-345678",
      billingAddress: {
        street: "House 45, Road 11, Sector 4",
        city: "Uttara",
        state: "Dhaka",
        zipCode: "1230"
      },
      shippingAddress: {
        street: "House 45, Road 11, Sector 4",
        city: "Uttara",
        state: "Dhaka",
        zipCode: "1230"
      },
      items: [
        {
          productName: "Sauvage Elixir Eau De Parfum",
          variantName: "10ml Decant",
          quantity: 2,
          price: 1850,
          subtotal: 3700
        },
        {
          productName: "Baccarat Rouge 540 Extrait",
          variantName: "5ml Decant",
          quantity: 1,
          price: 2400,
          subtotal: 2400
        }
      ],
      subtotal: 6100,
      shippingFee: 100,
      totalAmount: 6200,
      paymentMethod: "Cash on Delivery (COD)"
    }
  });

  const fromName = process.env.SMTP_FROM_NAME || "Decantre BD";
  const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;

  const info = await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: recipient,
    subject: `Decantre BD: Order Confirmation - #${orderId}`,
    html: htmlContent
  });

  console.log(`✅ Customer Test Email successfully sent to: ${recipient}`);
  console.log(`📩 Message ID: ${info.messageId}`);
};

sendInvoiceTestEmail().catch((error) => {
  console.error("❌ Failed to send customer email:", error.message);
  process.exit(1);
});
