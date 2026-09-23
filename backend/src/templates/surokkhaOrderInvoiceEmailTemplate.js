/**
 * Surokkha Personal Wellness Store — Customer Order Confirmation Email Template
 * Optimized for full HTML email client rendering (Gmail, Outlook, Apple Mail, Yahoo)
 * 
 * Features:
 * - Clean light background (#F8FAFC / #FFFFFF) with Surokkha brand rose/burgundy accents (#881337 / #BE123C)
 * - Table-based bulletproof email layout with inline styles
 * - 100% Discreet packaging assurance guarantee
 *
 * @param {Object} params
 * @param {Object} params.order - Formatted order data
 * @param {string} [params.logoUrl] - Public Surokkha Logo URL
 * @returns {string} Standalone HTML email string
 */
export const buildSurokkhaOrderInvoiceEmailHtml = ({
  order = {},
  logoUrl = "https://surokkha.store/assets/log-D8ALCVK7.png",
}) => {
  const {
    orderId = "N/A",
    createdAt = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
    customerName = "Valued Customer",
    customerEmail = "",
    customerPhone = "N/A",
    billingAddress = {},
    shippingAddress = null,
    items = [],
    subtotal = 0,
    shippingFee = 0,
    discountAmount = 0,
    couponCode = null,
    totalAmount = 0,
    paymentMethod = "Cash on Delivery (COD)",
  } = order;

  const finalShipping = shippingAddress || billingAddress;

  // Formats address safely
  const formatAddress = (addr) => {
    if (!addr) return "N/A";
    if (typeof addr === "string") return addr;
    if (addr.fullAddress && addr.fullAddress.trim()) return addr.fullAddress;
    const parts = [
      addr.street || addr.address,
      addr.thana,
      addr.district || addr.city || addr.state,
      addr.zipCode || addr.zip ? `Zip: ${addr.zipCode || addr.zip}` : "",
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  const deliveryAddressStr = formatAddress(finalShipping);

  // Build item rows
  const itemRowsHtml = items.map((item, index) => {
    const isEven = index % 2 === 1;
    const itemName = item.productName || item.name || "MO Wellness Product";
    const variantParts = [item.size, item.variant, item.variantName, item.packType].filter(Boolean);
    const variant = [...new Set(variantParts)].join(" • ") || item.variantName || item.size || "Standard Pack";
    const qty = Number(item.quantity || 1);
    const unitPrice = Number(item.unitPrice || item.price || 0);
    const itemTotal = Number(item.subtotal || (unitPrice * qty) || 0);

    return `
      <tr style="background-color: ${isEven ? "#FFF1F2" : "#FFFFFF"}; border-bottom: 1px solid #F1F5F9;">
        <td style="padding: 12px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #0F172A; vertical-align: top;">
          <strong style="color: #0F172A; font-weight: 700; font-size: 13.5px;">${itemName}</strong>
          ${variant ? `<div style="font-size: 11px; color: #9F1239; font-weight: 600; margin-top: 2px;">✦ ${variant}</div>` : ""}
        </td>
        <td style="padding: 12px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #334155; text-align: center; vertical-align: top;">
          ${qty}
        </td>
        <td style="padding: 12px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #334155; text-align: right; vertical-align: top; white-space: nowrap;">
          ৳${unitPrice.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
        <td style="padding: 12px 14px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 13px; color: #881337; font-weight: 700; text-align: right; vertical-align: top; white-space: nowrap;">
          ৳${itemTotal.toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </td>
      </tr>
    `;
  }).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Confirmation #${orderId}</title>
</head>
<body style="margin: 0; padding: 24px 10px; background-color: #F8FAFC; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <!-- Main Container -->
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 640px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06);">
          
          <!-- Top Accent Gradient Line -->
          <tr>
            <td style="height: 6px; background: linear-gradient(90deg, #881337 0%, #BE123C 50%, #FDA4AF 100%);"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 28px 32px 20px 32px; border-bottom: 1px solid #F1F5F9;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align: middle;">
                    <div style="display: flex; align-items: center; gap: 8px;">
                      <span style="display: inline-block; width: 28px; height: 28px; background-color: #881337; color: #FFFFFF; font-weight: 800; font-size: 15px; border-radius: 8px; text-align: center; line-height: 28px;">S</span>
                      <span style="font-size: 20px; font-weight: 800; letter-spacing: -0.5px; color: #0F172A;">Surokkha<span style="color: #BE123C;">.store</span></span>
                    </div>
                    <div style="font-size: 11px; color: #64748B; letter-spacing: 0.5px; text-transform: uppercase; margin-top: 4px;">Authentic Personal Wellness • Bangladesh</div>
                  </td>
                  <td style="text-align: right; vertical-align: middle;">
                    <div style="font-size: 18px; font-weight: 800; color: #0F172A;">ORDER CONFIRMED</div>
                    <div style="font-size: 13px; font-weight: 700; color: #BE123C; margin-top: 2px;">#${orderId}</div>
                    <div style="margin-top: 6px;">
                      <span style="display: inline-block; padding: 4px 12px; background-color: #FFF1F2; color: #9F1239; border: 1px solid #FECDD3; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase;">✓ Processing</span>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Customer & Order Meta Information -->
          <tr>
            <td style="padding: 24px 32px; background-color: #FAFAFA; border-bottom: 1px solid #F1F5F9;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="50%" style="vertical-align: top; padding-right: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.75px; margin-bottom: 6px;">Customer & Delivery Details</div>
                    <div style="font-size: 13.5px; font-weight: 700; color: #1E293B;">${customerName}</div>
                    <div style="font-size: 13px; color: #64748B; margin-top: 2px;">${customerPhone}</div>
                    ${customerEmail ? `<div style="font-size: 12px; color: #64748B; margin-top: 1px;">${customerEmail}</div>` : ""}
                    <div style="margin-top: 8px; font-size: 12.5px; color: #1E293B; line-height: 1.4;">
                      <strong style="color: #475569; font-size: 11px; text-transform: uppercase;">Shipping Coordinates:</strong><br />
                      ${deliveryAddressStr}
                    </div>
                  </td>
                  <td width="50%" style="vertical-align: top; padding-left: 12px;">
                    <div style="font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.75px; margin-bottom: 6px;">Order & Payment Info</div>
                    <div style="font-size: 13px; color: #1E293B; line-height: 1.5;">
                      <strong>Order Date:</strong> ${createdAt}<br />
                      <strong>Payment Method:</strong> ${paymentMethod}<br />
                      <strong>Payment Status:</strong> <span style="color: #BE123C; font-weight: 700;">Pending (COD)</span>
                    </div>
                    <div style="margin-top: 8px; font-size: 12.5px; color: #1E293B; line-height: 1.4;">
                      <strong style="color: #475569; font-size: 11px; text-transform: uppercase;">Customer Helpline:</strong><br />
                      01869151550 (WhatsApp)
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Items Table -->
          <tr>
            <td style="padding: 24px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                <thead>
                  <tr style="background-color: #881337; color: #FFFFFF;">
                    <th style="padding: 10px 14px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; text-align: left; border-top-left-radius: 8px;">Product & Pack Details</th>
                    <th style="padding: 10px 14px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; text-align: center; width: 50px;">Qty</th>
                    <th style="padding: 10px 14px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; text-align: right; width: 90px;">Unit Price</th>
                    <th style="padding: 10px 14px; font-size: 11.5px; font-weight: 700; text-transform: uppercase; text-align: right; width: 90px; border-top-right-radius: 8px;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemRowsHtml}
                </tbody>
              </table>

              <!-- Totals Breakdown -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 20px; border-top: 2px solid #881337; padding-top: 14px;">
                <tr>
                  <td></td>
                  <td width="260">
                    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #475569;">Items Subtotal:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #1E293B; font-weight: 600; text-align: right;">৳${Number(subtotal).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #475569;">Delivery Fee:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #1E293B; font-weight: 600; text-align: right;">${Number(shippingFee) > 0 ? `৳${Number(shippingFee).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '<span style="color: #15803D; font-weight: 600;">Free</span>'}</td>
                      </tr>
                      ${Number(discountAmount) > 0 ? `
                      <tr>
                        <td style="padding: 4px 0; font-size: 13px; color: #15803D; font-weight: 600;">Discount ${couponCode ? `(${couponCode})` : ""}:</td>
                        <td style="padding: 4px 0; font-size: 13px; color: #15803D; font-weight: 700; text-align: right;">-৳${Number(discountAmount).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>` : ""}
                      <tr>
                        <td style="padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 15px; font-weight: 700; color: #0F172A;">Grand Total (BDT):</td>
                        <td style="padding-top: 10px; border-top: 1px solid #E2E8F0; font-size: 18px; font-weight: 800; color: #881337; text-align: right;">৳${Number(totalAmount).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Discreet Packaging Assurance Notice -->
          <tr>
            <td style="padding: 0 32px 24px 32px;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #FFF1F2; border: 1px solid #FECDD3; border-radius: 12px; padding: 14px 18px;">
                <tr>
                  <td width="30" style="vertical-align: top; font-size: 20px;">🔒</td>
                  <td style="vertical-align: top; padding-left: 10px;">
                    <div style="font-size: 12px; font-weight: 700; color: #881337; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;">100% Discreet & Confidential Delivery Guarantee</div>
                    <div style="font-size: 11.5px; color: #4C0519; line-height: 1.45;">Your order is shipped in plain, unmarked courier bags. No product titles or sensitive personal wellness labels appear on the outer package.</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 32px; background-color: #0F172A; color: #94A3B8; text-align: center; font-size: 12px; line-height: 1.6;">
              <div style="display: inline-block; margin-bottom: 8px; padding: 4px 12px; border: 1px solid #BE123C; border-radius: 6px; color: #FDA4AF; background-color: rgba(190, 18, 60, 0.15); font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">
                ✦ 100% Authentic MO Product Standard • Factory Sealed ✦
              </div>
              <div>Thank you for ordering with <strong>Surokkha.store</strong> — Your Trusted Personal Wellness Platform.</div>
              <div style="margin-top: 4px; font-size: 11px; color: #64748B;">
                Helpline (WhatsApp): <strong>01869151550</strong> | Email: <a href="mailto:support@surokkha.store" style="color: #FDA4AF; text-decoration: none; font-weight: 600;">support@surokkha.store</a>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
};
