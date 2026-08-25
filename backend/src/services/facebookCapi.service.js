import crypto from "crypto";
import { env } from "../config/env.js";

// Computes SHA-256 hash for CAPI user data normalization
const sha256 = (value) => {
  if (!value || typeof value !== "string") return "";
  const cleanVal = value.trim().toLowerCase();
  if (!cleanVal) return "";
  return crypto.createHash("sha256").update(cleanVal).digest("hex");
};

// Normalizes Bangladeshi phone numbers into international format
const normalizePhone = (phone = "") => {
  if (!phone) return "";
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("880")) {
    return digits;
  }
  if (digits.startsWith("0")) {
    return `88${digits}`;
  }
  if (digits.length === 10) {
    return `880${digits}`;
  }
  return digits;
};

// Sends server-side Purchase event to Meta Conversions API asynchronously
export const sendServerPurchaseEvent = async (order, req = null) => {
  const pixelId = env.FB_PIXEL_ID;
  const accessToken = env.FB_ACCESS_TOKEN;
  const testEventCode = env.FB_TEST_EVENT_CODE;

  if (!pixelId || !accessToken) {
    return;
  }

  try {
    const customer = order.billingInfo || order.shippingInfo || {};
    const nameParts = (customer.fullName || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const hashedEmail = sha256(customer.email || "");
    const normalizedPhoneNum = normalizePhone(customer.phone || "");
    const hashedPhone = sha256(normalizedPhoneNum);
    const hashedFn = sha256(firstName);
    const hashedLn = sha256(lastName);
    const hashedCity = sha256(customer.district || customer.thana || "");
    const hashedCountry = sha256("bd");

    const clientIp =
      req?.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
      req?.socket?.remoteAddress ||
      "";
    const clientUserAgent = req?.headers?.["user-agent"] || "";

    const userData = {
      ...(clientUserAgent ? { client_user_agent: clientUserAgent } : {}),
      ...(clientIp ? { client_ip_address: clientIp } : {}),
      ...(hashedEmail ? { em: [hashedEmail] } : {}),
      ...(hashedPhone ? { ph: [hashedPhone] } : {}),
      ...(hashedFn ? { fn: [hashedFn] } : {}),
      ...(hashedLn ? { ln: [hashedLn] } : {}),
      ...(hashedCity ? { ct: [hashedCity] } : {}),
      ...(hashedCountry ? { country: [hashedCountry] } : {}),
    };

    const items = Array.isArray(order.items) ? order.items : [];
    const contents = items.map((item) => ({
      id: String(item.productDid || item.sku || item.productId || item.name || ""),
      quantity: item.quantity || 1,
      item_price: Number(item.unitPrice || 0),
    }));

    const contentIds = contents.map((c) => c.id).filter(Boolean);

    const customData = {
      currency: "BDT",
      value: Number(order.total || 0),
      content_type: "product",
      contents,
      content_ids: contentIds,
      num_items: items.reduce((acc, i) => acc + (i.quantity || 1), 0),
      order_id: String(order.orderNumber || order._id || ""),
    };

    const eventPayload = {
      event_name: "Purchase",
      event_time: Math.floor(Date.now() / 1000),
      event_id: `purchase_${order.orderNumber || order._id}`,
      action_source: "website",
      user_data: userData,
      custom_data: customData,
    };

    const requestBody = {
      data: [eventPayload],
      ...(testEventCode ? { test_event_code: testEventCode } : {}),
    };

    const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;

    fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.text();
          console.warn("[Meta CAPI Server] Response error:", errData);
        }
      })
      .catch((err) => {
        console.warn("[Meta CAPI Server] Network error:", err.message);
      });
  } catch (err) {
    console.warn("[Meta CAPI Server] Request builder exception:", err.message);
  }
};
