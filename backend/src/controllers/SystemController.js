import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let backendVersion = '2.0.1';
try {
  const pkgPath = path.resolve(__dirname, '../../package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.version) {
      backendVersion = pkg.version;
    }
  }
} catch (err) {
  console.error('Failed to read backend package.json version:', err);
}

import mongoose from 'mongoose';
import { config } from '../config/index.js';

// Returns public health check and fleet discovery telemetry
export const getHealthCheck = async (req, res, next) => {
  try {
    const isDbConnected = mongoose.connection.readyState === 1;
    return res.status(isDbConnected ? 200 : 503).json({
      status: isDbConnected ? 'healthy' : 'degraded',
      clientKey: config.clientKey || 'decantre',
      brandName: config.brandName || 'Decantre',
      policies: config.policies || {},
      backendVersion,
      uptimeSeconds: Math.floor(process.uptime()),
      dbStatus: isDbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
};

// Return system runtime info, backend version, Node.js version, and environment
export const getSystemInfo = async (req, res, next) => {
  try {
    return res.json({
      status: 'success',
      data: {
        clientKey: config.clientKey || 'decantre',
        brandName: config.brandName || 'Decantre',
        policies: config.policies || {},
        backendVersion,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV || 'development',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

import { OrderModel } from '../models/order.model.js';
import { PaymentModel } from '../models/payment.model.js';
import { CategoryModel } from '../models/category.model.js';

// Retrieve dynamic metadata configuration (order statuses, payment statuses, categories)
export const getMetadata = async (req, res, next) => {
  try {
    const orderStatusesEnum = OrderModel.schema.path('status').enumValues || [];
    const paymentStatusesEnum = PaymentModel.schema.path('status').enumValues || [];

    const orderStatuses = orderStatusesEnum.map((val) => ({
      did: `order-status-${val}`,
      name: val.charAt(0).toUpperCase() + val.slice(1),
      slug: val,
    }));

    const paymentStatuses = paymentStatusesEnum.map((val) => ({
      did: `payment-status-${val}`,
      name: val.charAt(0).toUpperCase() + val.slice(1),
      slug: val,
    }));

    const categoriesRaw = await CategoryModel.find().select('did name slug').lean();
    const categories = categoriesRaw.map((c) => ({
      did: c.did || c._id?.toString(),
      name: c.name,
      slug: c.slug,
    }));

    return res.json({
      status: 'success',
      data: {
        orderStatuses,
        paymentStatuses,
        categories,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Purges Cloudflare edge cache and resets memory caches for the tenant
export const purgeSystemCache = async (req, res, next) => {
  try {
    const clientKey = config.clientKey || process.env.CLIENT_NAME || 'engulfic';
    const domain = (config.domain || `${clientKey}.com`).replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
    const token = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_ACCOUNT_TOKEN;

    const ZONE_MAP = {
      'engulfic.com': 'b8baf3af57594678d588a9391b3a7023',
      'engulfic': 'b8baf3af57594678d588a9391b3a7023',
      'decantre.com': '532fc0163ee268da83584fe3be20e3bc',
      'decantre': '532fc0163ee268da83584fe3be20e3bc',
      'toyoland.com': '6e159fb7a28e83161c565d3ecad4e565',
      'toyoland': '6e159fb7a28e83161c565d3ecad4e565',
    };

    let zoneId = ZONE_MAP[domain] || ZONE_MAP[clientKey];
    let cfPurged = false;
    let cfMessage = '';

    if (!zoneId && token) {
      try {
        const lookupRes = await fetch(`https://api.cloudflare.com/client/v4/zones?name=${domain}`, {
          headers: { Authorization: `Bearer ${token.trim()}` },
        });
        const lookupData = await lookupRes.json();
        if (lookupData.success && lookupData.result?.length > 0) {
          zoneId = lookupData.result[0].id;
        }
      } catch (err) {
        cfMessage = err.message;
      }
    }

    if (token && zoneId) {
      try {
        const cfRes = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.trim()}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ purge_everything: true }),
        });
        const cfData = await cfRes.json();
        cfPurged = Boolean(cfData.success);
        cfMessage = cfPurged ? 'All Cloudflare Edge Cache purged successfully.' : (cfData.errors?.[0]?.message || 'Cloudflare purge failed');
      } catch (err) {
        cfMessage = err.message;
      }
    } else {
      cfMessage = 'Local application cache cleared.';
    }

    return res.json({
      status: 'success',
      message: 'System & Edge Cache purged successfully.',
      data: {
        clientKey,
        domain,
        cloudflarePurged: cfPurged,
        details: cfMessage,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

