import nodemailer from "nodemailer";
import { UserModel } from "../models/user.model.js";
import { buildOrderInvoiceEmailHtml } from "../../templates/orderInvoiceEmailTemplate.js";
import { buildAdminOrderEmailHtml } from "../../templates/adminOrderEmailTemplate.js";

// Cached SMTP transport connection instance
let defaultTransport;

// Dynamically retrieve/initialize SMTP transport
function getTransport() {
  if (!defaultTransport) {
    defaultTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.hostinger.com",
      port: Number(process.env.SMTP_PORT || 587),
      secure: (process.env.SMTP_ENCRYPTION || "TLS").toLowerCase() === "ssl",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return defaultTransport;
}

/**
 * Safely send order notification emails asynchronously without blocking the response.
 * Sends Customer Order Confirmation to Customer & Admin Notification to Admin emails.
 * 
 * @param {Object} order - The created order document/payload
 */
export function sendOrderEmailsAsynchronously(order) {
  // Execute in setImmediate to ensure completely non-blocking execution flow
  setImmediate(async () => {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
        console.warn("[Email Notification] SMTP credentials not configured. Skipping email dispatch.");
        return;
      }

      const activeTransport = getTransport();
      const fromName = process.env.SMTP_FROM_NAME || "Decantre BD";
      const fromEmail = process.env.SMTP_FROM || process.env.SMTP_USER;
      const fromAddress = `"${fromName}" <${fromEmail}>`;

      // Extract order details with fallback
      const orderId = order.orderNumber || order.did || order._id?.toString()?.slice(-6) || "N/A";
      const customerEmail = order.customer?.email;
      const customerName = order.customer?.name || `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || "Customer";
      const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

      const billingAddress = order.billingAddress || order.shippingAddress || {};
      const shippingAddress = order.shippingAddress || billingAddress;
      const items = Array.isArray(order.items) ? order.items.map(item => {
        const quantity = Number(item.quantity || 1);
        const price = Number(item.price ?? item.unitPrice ?? 0);
        const subtotal = Number(item.subtotal ?? item.total ?? (price * quantity) ?? 0);
        return {
          productName: item.name || item.productName || "Product",
          variantName: item.variant || item.variantName || item.size || "",
          quantity,
          price,
          subtotal
        };
      }) : [];

      const subtotal = Number(order.totals?.subtotal || order.subtotal || 0);
      const shippingFee = Number(order.totals?.shipping || order.shippingFee || 0);
      const totalAmount = Number(order.totals?.total || order.totalAmount || (subtotal + shippingFee) || 0);
      const paymentMethod = order.paymentMethod || "Cash on Delivery (COD)";

      const formattedOrderData = {
        orderId,
        createdAt,
        customerName,
        customerEmail,
        customerPhone: order.customer?.phone || "N/A",
        billingAddress,
        shippingAddress,
        items,
        subtotal,
        shippingFee,
        totalAmount,
        paymentMethod
      };

      // 1. Send Customer Order Confirmation Email (to customer email)
      if (customerEmail) {
        try {
          const customerHtml = buildOrderInvoiceEmailHtml({ order: formattedOrderData });
          await activeTransport.sendMail({
            from: fromAddress,
            to: customerEmail,
            subject: `Decantre BD: Order Confirmation - #${orderId}`,
            html: customerHtml
          });
          console.log(`[Email Notification] Customer confirmation email sent to: ${customerEmail}`);
        } catch (custErr) {
          console.error(`[Email Notification] Failed sending customer email to ${customerEmail}:`, custErr.message);
        }
      }

      // 2. Resolve Admin Recipients: decantre.store@gmail.com AND database Super Admin / Owner / Admin EXCLUDING ikramul.web@gmail.com
      const adminRecipientsSet = new Set(["decantre.store@gmail.com"]);

      try {
        const superAdmins = await UserModel.find({
          role: { $in: ["Owner", "Admin", "Super Admin", "Manager"] },
          $or: [{ isActive: true }, { active: true }, { isActive: { $exists: false } }]
        }).select("email").lean();

        for (const adminUser of superAdmins) {
          if (adminUser.email) {
            adminRecipientsSet.add(adminUser.email.toLowerCase().trim());
          }
        }
      } catch (dbErr) {
        console.error("[Email Notification] Database query for super admin emails failed, falling back to default admins:", dbErr.message);
      }

      // Explicitly EXCLUDE ikramul.web@gmail.com as requested
      adminRecipientsSet.delete("ikramul.web@gmail.com");

      const adminRecipients = Array.from(adminRecipientsSet);
      console.log(`[Email Notification] Admin notification targets: ${adminRecipients.join(", ")}`);

      // Send Admin New Order Notification Email to all resolved admin emails
      if (adminRecipients.length > 0) {
        try {
          const adminHtml = buildAdminOrderEmailHtml({ order: formattedOrderData });
          await activeTransport.sendMail({
            from: fromAddress,
            to: adminRecipients,
            subject: `Decantre BD: You have got a new order - #${orderId}`,
            html: adminHtml
          });
          console.log(`[Email Notification] Admin notification email successfully sent to: ${adminRecipients.join(", ")}`);
        } catch (adminErr) {
          console.error(`[Email Notification] Failed sending admin email to ${adminRecipients.join(", ")}:`, adminErr.message);
        }
      }

    } catch (globalErr) {
      console.error("[Email Notification] Unexpected error in async email handler:", globalErr.message);
    }
  });
}
