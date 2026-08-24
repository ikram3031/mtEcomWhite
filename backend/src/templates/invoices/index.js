import { buildDecantreOrderInvoiceHtml } from "./decantreOrderInvoice.js";
import { buildDashboardInvoiceHtml } from "../dashboardInvoiceTemplate.js";
import { buildOrderInvoiceEmailHtml } from "../orderInvoiceEmailTemplate.js";

/**
 * Registry of client-specific invoice templates.
 * Each client brand (Decantre, Engulfic, Toyoland, etc.) can maintain their own tailored invoice design.
 */
const CLIENT_INVOICE_TEMPLATES = {
  decantre: buildDecantreOrderInvoiceHtml,
  // Add other client templates here:
  // engulfic: buildEngulficOrderInvoiceHtml,
  // toyoland: buildToyolandOrderInvoiceHtml,
};

/**
 * Multi-Client Invoice Template Resolver.
 * Resolves the tailored invoice template based on client identifier, with graceful fallback.
 *
 * @param {Object} params
 * @param {Object} params.order - Formatted order data
 * @param {string} [params.client="decantre"] - Client store identifier ('decantre', 'engulfic', 'toyoland')
 * @param {boolean} [params.isPrintView=false] - Print mode toggle
 * @param {string} [params.logoUrl] - Custom logo URL
 * @returns {string} Fully rendered HTML string
 */
export const getClientInvoiceHtml = ({
  order = {},
  client = "decantre",
  isPrintView = false,
  logoUrl,
}) => {
  const normalizedClient = (client || "decantre").toLowerCase().trim();
  const templateBuilder = CLIENT_INVOICE_TEMPLATES[normalizedClient] || buildDecantreOrderInvoiceHtml;

  return templateBuilder({ order, isPrintView, logoUrl });
};

export {
  buildDecantreOrderInvoiceHtml,
  buildDashboardInvoiceHtml,
  buildOrderInvoiceEmailHtml,
};
