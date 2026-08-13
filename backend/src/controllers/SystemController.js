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

// Return system runtime info, backend version, Node.js version, and environment
export const getSystemInfo = async (req, res, next) => {
  try {
    return res.json({
      status: 'success',
      data: {
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
