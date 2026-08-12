import nodemailer from "nodemailer";
import { UserModel } from "../models/user.model.js";
import { buildOrderInvoiceEmailHtml } from "../templates/orderInvoiceEmailTemplate.js";
import { buildAdminOrderEmailHtml } from "../templates/adminOrderEmailTemplate.js";
import { env } from "../config/env.js";

// Cached SMTP transport connection instance
let defaultTransport;

// Dynamically retrieve/initialize SMTP transport
function getTransport() {
  if (!defaultTransport) {
    defaultTransport = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: String(env.SMTP_ENCRYPTION).toLowerCase() === "ssl",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD,
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
      if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
        console.warn("[Email Notification] SMTP credentials not configured. Skipping email dispatch.");
        return;
      }

      const activeTransport = getTransport();
      const fromName = env.SMTP_FROM_NAME || "Decantre BD";
      const fromEmail = env.SMTP_FROM || env.SMTP_USER;
      const fromAddress = `"${fromName}" <${fromEmail}>`;

      // Extract order details with complete alignment to OrderModel schema
      const orderId = order.orderNumber || order.did || order._id?.toString()?.slice(-6) || "N/A";
      const customerEmail = order.billingInfo?.email || "";
      const customerName = order.billingInfo?.fullName || "Customer";
      const customerPhone = order.billingInfo?.phone || "N/A";
      const createdAt = order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

      // Build primary customer address (Billing Address) from OrderModel billingInfo schema
      const primaryAddrParts = [
        order.billingInfo?.address,
        order.billingInfo?.thana,
        order.billingInfo?.district,
        order.billingInfo?.zip ? `Zip: ${order.billingInfo?.zip}` : ''
      ].filter(Boolean);

      const billingAddress = {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        street: order.billingInfo?.address || "",
        thana: order.billingInfo?.thana || "",
        district: order.billingInfo?.district || "",
        zipCode: order.billingInfo?.zip || "",
        fullAddress: primaryAddrParts.join(', ')
      };

      // Resolve Shipping Address (Use custom shippingInfo if provided; otherwise fallback to billingAddress)
      let shippingAddress = billingAddress;
      if (order.shippingInfo && typeof order.shippingInfo === 'object') {
        const customStreet = order.shippingInfo.address || order.shippingInfo.street;
        if (customStreet && customStreet.trim()) {
          const customAddrParts = [
            customStreet,
            order.shippingInfo.thana,
            order.shippingInfo.district,
            order.shippingInfo.zip ? `Zip: ${order.shippingInfo.zip}` : ''
          ].filter(Boolean);

          shippingAddress = {
            name: order.shippingInfo.fullName || customerName,
            phone: order.shippingInfo.phone || customerPhone,
            street: customStreet,
            thana: order.shippingInfo.thana || "",
            district: order.shippingInfo.district || "",
            zipCode: order.shippingInfo.zip || "",
            fullAddress: customAddrParts.join(', ')
          };
        }
      }

      const items = Array.isArray(order.items) ? order.items.map(item => {
        const quantity = Number(item.quantity || 1);
        const price = Number(item.unitPrice ?? item.price ?? 0);
        const subtotal = Number(item.subtotal ?? item.total ?? (price * quantity) ?? 0);
        const finalPrice = price || (subtotal / quantity) || 0;
        const finalSubtotal = subtotal || (finalPrice * quantity) || 0;

        // Combine size and concentration for complete variant display
        const variantParts = [item.size, item.concentration, item.variant, item.variantName].filter(Boolean);
        const variantName = [...new Set(variantParts)].join(' • ');

        return {
          productName: item.name || item.productName || "Product",
          variantName,
          quantity,
          price: finalPrice,
          subtotal: finalSubtotal
        };
      }) : [];

      const subtotal = Number(order.totals?.subtotal || order.subtotal || 0);
      const shippingFee = Number(order.totals?.shippingFee || order.shippingFee || order.totals?.shippingTotalAmount || 0);
      const totalAmount = Number(order.totals?.total || order.totalAmount || (subtotal + shippingFee));
      const paymentMethod = order.paymentMethod || "Cash on Delivery (COD)";

      const formattedOrderData = {
        orderId,
        createdAt,
        customerName,
        customerEmail,
        customerPhone,
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
