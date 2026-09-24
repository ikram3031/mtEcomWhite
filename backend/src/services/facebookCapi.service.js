import crypto from "crypto";
import { env } from "../config/env.js";
import { config as clientConfig } from "../config/index.js";
import { StoreSettingsModel } from "../models/storeSettings.model.js";

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

// Resolves active Meta Pixel configuration from database, client config, and environment fallbacks
export const getMetaPixelConfig = async () => {
  try {
    const doc = await StoreSettingsModel.findOne({ key: "default" }).lean();
    const dbMeta = doc?.metaPixel || {};
    const fallbackClientMeta = clientConfig?.metaPixel || {};

    const pixelId = dbMeta.pixelId || fallbackClientMeta.pixelId || env.FB_PIXEL_ID || "";
    const accessToken = dbMeta.accessToken || fallbackClientMeta.accessToken || env.FB_ACCESS_TOKEN || "";
    const testEventCode = dbMeta.testEventCode || fallbackClientMeta.testEventCode || env.FB_TEST_EVENT_CODE || "";

    return {
      pixelId,
      accessToken,
      testEventCode,
      isEnabled: dbMeta.isEnabled ?? fallbackClientMeta.isEnabled ?? true,
      enableBrowserPixel: dbMeta.enableBrowserPixel ?? fallbackClientMeta.enableBrowserPixel ?? true,
      enableCapi: dbMeta.enableCapi ?? fallbackClientMeta.enableCapi ?? true,
      advancedMatching: dbMeta.advancedMatching ?? fallbackClientMeta.advancedMatching ?? true,
      lastVerifiedAt: dbMeta.lastVerifiedAt || null,
      lastTestStatus: dbMeta.lastTestStatus || "untested",
      lastTestMessage: dbMeta.lastTestMessage || "",
    };
  } catch (_error) {
    return {
      pixelId: env.FB_PIXEL_ID || "",
      accessToken: env.FB_ACCESS_TOKEN || "",
      testEventCode: env.FB_TEST_EVENT_CODE || "",
      isEnabled: true,
      enableBrowserPixel: true,
      enableCapi: true,
      advancedMatching: true,
      lastVerifiedAt: null,
      lastTestStatus: "untested",
      lastTestMessage: "",
    };
  }
};

// Dispatches a live verification test event to Meta Graph API
export const testMetaCapiConnection = async ({ pixelId, accessToken, testEventCode = "" }) => {
  if (!pixelId || !accessToken) {
    return {
      success: false,
      status: 400,
      message: "Pixel ID and Conversions API Access Token are required.",
    };
  }

  const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events?access_token=${accessToken}`;
  const testPayload = {
    data: [
      {
        event_name: "TestConnection",
        event_time: Math.floor(Date.now() / 1000),
        event_id: `test_${Date.now()}`,
        action_source: "website",
        user_data: {
          client_user_agent: "Decantre-WL-Ecom/Backend-CAPI-Tester",
        },
        custom_data: {
          test: true,
          system: "WL-Ecom Admin Dashboard",
        },
      },
    ],
    ...(testEventCode ? { test_event_code: testEventCode } : {}),
  };

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(testPayload),
    });

    const responseBody = await res.json().catch(() => ({}));

    if (!res.ok) {
      const errMsg = responseBody?.error?.message || `Meta Graph API responded with HTTP ${res.status}`;
      return {
        success: false,
        status: res.status,
        message: errMsg,
        raw: responseBody,
      };
    }

    return {
      success: true,
      status: 200,
      message: "Meta Conversions API connection verified successfully.",
      eventsReceived: responseBody?.events_received || 1,
      fbtraceId: responseBody?.fbtrace_id || "",
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: error.message || "Network error connecting to Meta Graph API",
    };
  }
};

// Sends server-side Purchase event to Meta Conversions API asynchronously
export const sendServerPurchaseEvent = async (order, req = null) => {
  try {
    const metaConfig = await getMetaPixelConfig();

    if (!metaConfig.isEnabled || !metaConfig.enableCapi) {
      return;
    }

    const { pixelId, accessToken, testEventCode, advancedMatching } = metaConfig;

    if (!pixelId || !accessToken) {
      return;
    }

    const customer = order.billingInfo || order.shippingInfo || {};
    const nameParts = (customer.fullName || "").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";

    const clientIp =
      req?.headers?.["x-forwarded-for"]?.split(",")?.[0]?.trim() ||
      req?.socket?.remoteAddress ||
      "";
    const clientUserAgent = req?.headers?.["user-agent"] || "";

    const userData = {
      ...(clientUserAgent ? { client_user_agent: clientUserAgent } : {}),
      ...(clientIp ? { client_ip_address: clientIp } : {}),
    };

    if (advancedMatching) {
      const hashedEmail = sha256(customer.email || "");
      const normalizedPhoneNum = normalizePhone(customer.phone || "");
      const hashedPhone = sha256(normalizedPhoneNum);
      const hashedFn = sha256(firstName);
      const hashedLn = sha256(lastName);
      const hashedCity = sha256(customer.district || customer.thana || "");
      const hashedCountry = sha256("bd");

      if (hashedEmail) userData.em = [hashedEmail];
      if (hashedPhone) userData.ph = [hashedPhone];
      if (hashedFn) userData.fn = [hashedFn];
      if (hashedLn) userData.ln = [hashedLn];
      if (hashedCity) userData.ct = [hashedCity];
      if (hashedCountry) userData.country = [hashedCountry];
    }

    const items = Array.isArray(order.items) ? order.items : [];
    const contents = items.map((item) => ({
      id: String(item.productDid || item.sku || item.productId || item.name || ""),
      quantity: item.quantity || 1,
      item_price: Number(item.unitPrice || 0),
    }));

    const contentIds = contents.map((c) => c.id).filter(Boolean);

    const orderTotalAmount = Number(
      order.totals?.total ?? order.total ?? order.totalAmount ?? 0
    );

    const customData = {
      currency: "BDT",
      value: orderTotalAmount,
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
