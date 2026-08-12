// Generic order domain utilities: validation and number generation.
import { OrderModel } from '../models/order.model.js';

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export const validateOrderPayload = (body) => {
  const errors = [];

  if (!body || typeof body !== 'object') {
    return ['Request body must be a valid JSON object'];
  }

  const isInstore = body.orderType === 'instore';
  const requiredFields = isInstore
    ? ['fullName', 'phone']
    : ['fullName', 'phone', 'email', 'address', 'district'];

  requiredFields.forEach((field) => {
    const value = body[field];
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`${field} is required`);
    }
  });

  if (!Array.isArray(body.items) || body.items.length === 0) {
    errors.push('items must be a non-empty array');
  }

  if (typeof body.paymentMethod !== 'string' || body.paymentMethod.trim() === '') {
    errors.push('paymentMethod is required');
  }

  if (!isInstore) {
    if (!isValidEmail(body.email)) {
      errors.push('email must be a valid email address');
    }
  } else if (body.email && body.email.trim() !== '') {
    if (!isValidEmail(body.email)) {
      errors.push('email must be a valid email address');
    }
  }

  return errors;
};

export const buildOrderNumber = async (isInstore = false) => {
  const now = new Date();
  const shortYear = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `${isInstore ? 'IS' : 'D'}${shortYear}${month}`;

  const lastOrder = await OrderModel.findOne({
    orderNumber: { $regex: `^${prefix}` }
  })
    .sort({ orderNumber: -1 })
    .select('orderNumber')
    .lean();

  let nextSequence = 1;
  if (lastOrder?.orderNumber) {
    const existingSuffix = lastOrder.orderNumber.slice(prefix.length);
    const parsed = parseInt(existingSuffix, 10);
    if (!Number.isNaN(parsed)) {
      nextSequence = parsed + 1;
    }
  }

  const paddedSequence = String(nextSequence).padStart(3, '0');
  return `${prefix}${paddedSequence}`;
};
