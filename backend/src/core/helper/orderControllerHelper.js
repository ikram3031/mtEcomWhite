import mongoose from 'mongoose';
import { OrderModel } from '../models/order.model.js';
import { MemberModel } from '../models/member.model.js';
import { PaymentModel } from '../models/payment.model.js';
import { UserModel } from '../models/user.model.js';
import { buildOrderNumber } from './orderHelper.js';

const { Types } = mongoose;

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

// Determine whether the payment method should be treated as a paid order path.
export const isPaidPaymentMethod = (paymentMethod) => {
  const method = normalizeText(paymentMethod).toLowerCase();
  if (!method) return false;
  return method === 'cod' || method.includes('cash') || method.includes('full') || method === 'paid';
};

// Resolve the effective payment status for an order based on method and amount paid.
export const getPaymentStatus = (paymentMethod, totalAmount, paidAmount) => {
  const method = normalizeText(paymentMethod).toLowerCase();
  if (!method) return 'pending';
  if (method === 'cod' || method.includes('cash') || method.includes('full') || method === 'paid') {
    if (paidAmount >= totalAmount) return 'paid';
    if (paidAmount > 0) return 'partial';
    return 'pending';
  }
  return paidAmount >= totalAmount ? 'paid' : paidAmount > 0 ? 'partial' : 'pending';
};

// Resolve a user reference into a stable Mongo ObjectId or return null when absent.
export const resolveUserIdFromReference = async (reference) => {
  const rawReference = normalizeText(reference);
  if (!rawReference) return null;

  if (Types.ObjectId.isValid(rawReference)) {
    return rawReference;
  }

  const foundUser = await UserModel.findOne({ did: rawReference }).select('_id').lean();
  return foundUser?._id ?? null;
};

// Normalize checkout items into the order schema shape expected by the database.
export const normalizeOrderItems = (items = []) =>
  (items || []).map((item) => ({
    name: item.name ?? 'Unknown product',
    quantity: Number(item.quantity || 1),
    unitPrice: Number(item.unitPrice || 0),
    size: item.size ?? '',
    concentration: item.concentration ?? '',
    productDid: item.productDid ?? '',
  }));

// Build the Mongo order document from the incoming checkout payload.
export const buildOrderDocument = async (payload) => {
  const createdByUserId = await resolveUserIdFromReference(payload.createdBy);

  return {
    orderNumber: await buildOrderNumber(payload.orderType === 'instore'),
    status: 'processing',
    createdBy: createdByUserId,
    updatedBy: null,
    member: payload.memberId && Types.ObjectId.isValid(payload.memberId) ? payload.memberId : undefined,
    customer: {
      fullName: normalizeText(payload.fullName),
      phone: normalizeText(payload.phone),
      email: normalizeText(payload.email),
      address: normalizeText(payload.address),
      city: normalizeText(payload.city),
      thana: normalizeText(payload.thana),
      district: normalizeText(payload.district),
      zip: normalizeText(payload.zip),
      giftWrap: Boolean(payload.giftWrap),
    },
    paymentMethod: normalizeText(payload.paymentMethod),
    shippingAddress: payload.shippingAddress ?? {},
    discountTotalAmount: Number(payload.discountTotalAmount || 0),
    couponCode: payload.couponCode ? String(payload.couponCode).trim().toUpperCase() : null,
    items: normalizeOrderItems(payload.items),
    totals: {
      subtotal: Number(payload.subtotal || 0),
      shippingFee: Number(payload.shippingFee || 0),
      tax: Number(payload.tax || 0),
      total: Number(payload.total || 0),
    },
  };
};

// Upsert the linked payment record so it reflects the created order totals.
// Supports advance, partial, and full payments for COD, Cash, bKash, Nagad, Bank, Card.
export const syncPaymentDocument = async (orderData, payload = {}) => {
  const totalAmount = Number(orderData.totals?.total || 0);

  let paidAmount = 0;
  if (payload.paidAmount !== undefined && payload.paidAmount !== null) {
    paidAmount = Number(payload.paidAmount);
  } else if (orderData.paidAmount !== undefined && orderData.paidAmount !== null) {
    paidAmount = Number(orderData.paidAmount);
  } else if (orderData.paymentDetails?.paidAmount !== undefined) {
    paidAmount = Number(orderData.paymentDetails.paidAmount);
  } else {
    const method = normalizeText(orderData.paymentMethod).toLowerCase();
    if (method === 'cash' || method === 'instore' || method === 'in-store') {
      paidAmount = totalAmount;
    } else {
      paidAmount = 0;
    }
  }

  paidAmount = Math.min(totalAmount, Math.max(0, paidAmount));
  const pendingAmount = Math.max(0, totalAmount - paidAmount);

  let paymentStatus = 'pending';
  if (paidAmount >= totalAmount && totalAmount > 0) {
    paymentStatus = 'paid';
  } else if (paidAmount > 0) {
    paymentStatus = 'partial';
  } else {
    paymentStatus = 'pending';
  }

  const paymentPhone =
    orderData.paymentPhone ||
    orderData.paymentDetails?.paymentPhone ||
    orderData.customer?.phone ||
    '';

  await PaymentModel.findOneAndUpdate(
    { orderId: orderData._id },
    {
      paymentMethod: orderData.paymentMethod,
      paymentPhone,
      totalAmount,
      paidAmount,
      pendingAmount,
      amount: paidAmount,
      status: paymentStatus,
      createdBy: orderData.createdBy || null,
      updatedBy: orderData.updatedBy || null,
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
};

// Recalculate the aggregate order, paid, and pending totals for a member.
export const computeMemberTotals = async (memberId) => {
  const orders = await OrderModel.find({ member: memberId }).select('paymentMethod totals.total').lean();
  let totalOrderAmount = 0;
  let totalPaidAmount = 0;
  let totalPendingAmount = 0;

  for (const order of orders) {
    const amount = Number(order?.totals?.total || 0);
    totalOrderAmount += amount;
    if (isPaidPaymentMethod(order.paymentMethod)) {
      totalPaidAmount += amount;
    } else {
      totalPendingAmount += amount;
    }
  }

  return { totalOrderAmount, totalPaidAmount, totalPendingAmount };
};

// Apply the recalculated member totals back into the member profile record.
export const updateMemberTotals = async (memberId) => {
  if (!memberId) return;
  const totals = await computeMemberTotals(memberId);
  await MemberModel.findByIdAndUpdate(memberId, totals, { new: true, runValidators: true });
};

// Keep the member's embedded orders list in sync with the latest order reference.
export const updateMemberOrderReference = async (memberId, orderDid, orderValue) => {
  if (!memberId) return;
  await MemberModel.updateOne(
    { _id: memberId },
    {
      $pull: { orders: { did: orderDid } },
      $addToSet: { orders: { did: orderDid, value: orderValue } },
    },
  );
};

// Persist the created order snapshot onto the member and refresh derived totals.
export const syncMemberOrderSnapshot = async (memberId, createdOrder, payload) => {
  if (!memberId) return;

  const orderValue = createdOrder.totals?.total ?? 0;
  const memberUpdates = { $addToSet: { orders: { did: createdOrder.did, value: orderValue } } };

  if (payload.billingInfo && typeof payload.billingInfo === 'object') {
    memberUpdates.$set = { ...(memberUpdates.$set || {}), billingInfo: payload.billingInfo };
  }
  if (payload.shippingInfo && typeof payload.shippingInfo === 'object') {
    memberUpdates.$set = { ...(memberUpdates.$set || {}), shippingInfo: payload.shippingInfo };
  }

  await MemberModel.findByIdAndUpdate(memberId, memberUpdates, { new: true, runValidators: true });
  await updateMemberTotals(memberId);
};

// Produce the safe subset of order fields that can be updated from request input.
export const buildAllowedOrderUpdates = async (payload, existingOrder) => {
  const allowedUpdates = {};

  if (payload.status) {
    const s = String(payload.status).toLowerCase();
    const validEnums = ['processing', 'shipped', 'completed', 'cancelled'];
    allowedUpdates.status = validEnums.includes(s) ? s : 'processing';
  }
  if (payload.shippingAddress) {
    allowedUpdates.shippingAddress = payload.shippingAddress;
  }
  if (payload.paymentMethod) {
    allowedUpdates.paymentMethod = payload.paymentMethod;
  }
  if (payload.paidAmount !== undefined) {
    allowedUpdates.paidAmount = Number(payload.paidAmount || 0);
  }
  if (payload.paymentPhone !== undefined) {
    allowedUpdates.paymentPhone = normalizeText(payload.paymentPhone);
  }
  if (payload.totals) {
    allowedUpdates.totals = payload.totals;
  }
  if (payload.discountTotalAmount !== undefined) {
    allowedUpdates.discountTotalAmount = Number(payload.discountTotalAmount || 0);
  }
  if (payload.shippingTotalAmount !== undefined) {
    allowedUpdates.shippingTotalAmount = Number(payload.shippingTotalAmount || 0);
  }
  if (payload.customer) {
    allowedUpdates.customer = {
      fullName: normalizeText(payload.customer.fullName) || existingOrder.customer?.fullName || '',
      phone: normalizeText(payload.customer.phone) || existingOrder.customer?.phone || '',
      email: normalizeText(payload.customer.email) || existingOrder.customer?.email || '',
      address: normalizeText(payload.customer.address) || existingOrder.customer?.address || '',
      city: normalizeText(payload.customer.city) || existingOrder.customer?.city || '',
      thana: normalizeText(payload.customer.thana) || existingOrder.customer?.thana || '',
      district: normalizeText(payload.customer.district) || existingOrder.customer?.district || '',
      zip: normalizeText(payload.customer.zip) || existingOrder.customer?.zip || '',
      giftWrap: payload.customer.giftWrap !== undefined ? Boolean(payload.customer.giftWrap) : existingOrder.customer?.giftWrap,
    };
  }
  if (payload.items) {
    allowedUpdates.items = normalizeOrderItems(payload.items);
  }
  if (payload.memberId !== undefined) {
    if (payload.memberId && Types.ObjectId.isValid(payload.memberId)) {
      allowedUpdates.member = payload.memberId;
    } else if (payload.memberId === null) {
      allowedUpdates.member = undefined;
    }
  }
  if (payload.updatedBy !== undefined) {
    const rawUpdatedBy = normalizeText(payload.updatedBy);
    allowedUpdates.updatedBy = rawUpdatedBy ? await resolveUserIdFromReference(rawUpdatedBy) : null;
  }

  return allowedUpdates;
};
