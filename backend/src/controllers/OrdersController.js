import mongoose from 'mongoose';
import { validateOrderPayload } from '../helper/orderHelper.js';
import { OrderModel } from '../models/order.model.js';
import { MemberModel } from '../models/member.model.js';
import { CouponModel } from '../models/coupon.model.js';
import { PaymentModel } from '../models/payment.model.js';
import { buildAllowedOrderUpdates,
  buildOrderDocument,
  syncMemberOrderSnapshot,
  syncPaymentDocument,
  updateMemberOrderReference,
  updateMemberTotals,
} from '../helper/orderControllerHelper.js';
import { buildOrderInvoiceEmailHtml } from '../templates/orderInvoiceEmailTemplate.js';

const { Types } = mongoose;

import { sendOrderEmailsAsynchronously } from '../utils/orderDelivery.js';

// Create a new order from checkout payload and sync related payment/member data.
export const createOrder = async (req, res, next) => {
  try {
    const payload = req.body ?? {};
    const validationErrors = validateOrderPayload(payload);

    // Backend validation: Ensure multiple coupons are not added at once (optional field)
    const rawCoupon = payload.couponCode;
    if (rawCoupon && typeof rawCoupon === 'string' && rawCoupon.trim() !== '' && rawCoupon.trim().toLowerCase() !== 'null' && rawCoupon.trim().toLowerCase() !== 'undefined') {
      const code = rawCoupon.trim().toUpperCase();
      if (code.includes(',') || code.includes(' ') || code.includes(';')) {
        validationErrors.push('Only one coupon can be applied to an order');
      } else {
        const coupon = await CouponModel.findOne({ code });
        if (!coupon) {
          validationErrors.push('Coupon code is invalid or has expired');
        } else if (!coupon.active) {
          validationErrors.push('Coupon is currently inactive');
        } else {
          const now = new Date();
          if (coupon.validFrom && now < new Date(coupon.validFrom)) {
            validationErrors.push('Coupon promotion has not started yet');
          }
          if (coupon.validTo && now > new Date(coupon.validTo)) {
            validationErrors.push('Coupon code has expired');
          }
          const subtotal = Number(payload.subtotal || 0);
          if (subtotal < Number(coupon.minOrderAmount || 0)) {
            validationErrors.push(`Coupon requires a minimum purchase of ৳${coupon.minOrderAmount}`);
          }
        }
      }
    }

    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order payload',
        errors: validationErrors,
      });
    }

        const orderData = await buildOrderDocument(payload);
    const createdOrder = await OrderModel.create(orderData);

    await syncPaymentDocument(createdOrder, payload);
    await syncMemberOrderSnapshot(orderData.member, createdOrder, payload);

    // Safely trigger non-blocking email notifications for Customer and Admin
    sendOrderEmailsAsynchronously(createdOrder);

    return res.status(201).json({
      status: 'success',
      message: 'Order received successfully',
      data: createdOrder,
    });
  } catch (error) {
    next(error);
  }
};

// List orders with pagination and optional filtering by status, paymentStatus, or customer email.
export const listOrders = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || '20', 10)));
    const filter = { active: true };

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.paymentStatus) {
      const pStatus = req.query.paymentStatus.toLowerCase();
      const matchingPayments = await PaymentModel.find({ status: pStatus }).distinct('orderId');
      if (pStatus === 'paid') {
        filter.$or = [
          { _id: { $in: matchingPayments } },
          { status: { $in: ['completed', 'shipped'] } }
        ];
      } else if (pStatus === 'pending') {
        const paidPayments = await PaymentModel.find({ status: 'paid' }).distinct('orderId');
        filter.$and = [
          { _id: { $nin: paidPayments } },
          { status: { $nin: ['completed', 'shipped'] } }
        ];
      } else {
        filter._id = { $in: matchingPayments };
      }
    }

    if (req.query.email) {
      filter['billingInfo.email'] = req.query.email.toLowerCase().trim();
    }

    const total = await OrderModel.countDocuments(filter);
    const orders = await OrderModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const orderIds = orders.map((o) => o._id);
    const payments = await PaymentModel.find({ orderId: { $in: orderIds } }).select('orderId status').lean();
    const paymentMap = new Map(payments.map((p) => [p.orderId.toString(), p.status]));

        const data = orders.map((order) => {
      const pStatus = paymentMap.get(order._id.toString());
      const fallbackPaid = ['completed', 'shipped'].includes(order.status);
      const effectivePaymentStatus = pStatus || (fallbackPaid ? 'paid' : 'pending');
      return {
        ...order,
        id: order._id.toString(),
        customer: order.billingInfo,
        paymentStatus: effectivePaymentStatus,
      };
    });

    return res.json({
      status: 'success',
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Fetch a single order by Mongo ObjectId for detail views or admin editing.
export const getOrderById = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    if (!Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ status: 'error', message: 'Invalid order ID' });
    }

        const order = await OrderModel.findById(orderId).lean();
    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const payment = await PaymentModel.findOne({ orderId: order._id }).lean();
    const fallbackPaid = ['completed', 'shipped'].includes(order.status);
    const effectivePaymentStatus = payment?.status || (fallbackPaid ? 'paid' : 'pending');

    const orderWithCustomer = {
      ...order,
      id: order._id.toString(),
      customer: order.billingInfo,
      paymentStatus: effectivePaymentStatus,
    };

    return res.json({ status: 'success', data: orderWithCustomer });
  } catch (error) {
    next(error);
  }
};

// Update an existing order while keeping member references and payment sync consistent.
export const updateOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    
    let query = {};
    if (Types.ObjectId.isValid(orderId)) {
      query = { _id: orderId };
    } else {
      query = { $or: [{ did: orderId }, { orderNumber: orderId }] };
    }

    const payload = req.body ?? {};
    const existingOrder = await OrderModel.findOne(query).lean();
    if (!existingOrder) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const affectedMemberIds = new Set();
    if (existingOrder.member) {
      affectedMemberIds.add(existingOrder.member.toString());
    }

    const allowedUpdates = await buildAllowedOrderUpdates(payload, existingOrder);

    // Fallback updatedBy to authenticated user ID if not explicitly resolved from payload
    if (!allowedUpdates.updatedBy && req.user?.userId) {
      allowedUpdates.updatedBy = req.user.userId;
    }

    if (payload.memberId !== undefined && payload.memberId && Types.ObjectId.isValid(payload.memberId)) {
      affectedMemberIds.add(payload.memberId);
    }

    const order = await OrderModel.findOneAndUpdate(query, allowedUpdates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!order) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    const oldMemberId = existingOrder.member ? existingOrder.member.toString() : null;
    const newMemberId = order.member ? order.member.toString() : null;
    const orderDid = order.did;
    const orderValue = Number(order.totals?.total || 0);

    if (oldMemberId && oldMemberId !== newMemberId) {
      await MemberModel.updateOne(
        { _id: oldMemberId },
        { $pull: { orders: { did: orderDid } } },
      );
    }

    if (newMemberId) {
      await updateMemberOrderReference(newMemberId, orderDid, orderValue);
    }

        await syncPaymentDocument(order, payload);

    if (oldMemberId) affectedMemberIds.add(oldMemberId);
    if (newMemberId) affectedMemberIds.add(newMemberId);

    for (const memberId of affectedMemberIds) {
      await updateMemberTotals(memberId);
    }

    const payment = await PaymentModel.findOne({ orderId: order._id }).lean();
    const fallbackPaid = ['completed', 'shipped'].includes(order.status);
    const effectivePaymentStatus = payment?.status || (fallbackPaid ? 'paid' : 'pending');

    const orderWithCustomer = {
      ...order,
      id: order._id.toString(),
      customer: order.billingInfo,
      paymentStatus: effectivePaymentStatus,
    };

    return res.status(200).json({ status: 'success', data: orderWithCustomer });
  } catch (error) {
    next(error);
  }
};

// Soft delete an order by setting active = false and clean up its linked member and payment records.
export const deleteOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;

    // Try finding by _id (if valid ObjectId) or by custom id/did
    let query = {};
    if (Types.ObjectId.isValid(orderId)) {
      query = { _id: orderId };
    } else {
      query = { $or: [{ did: orderId }, { orderNumber: orderId }] };
    }

    const deletedOrder = await OrderModel.findOneAndUpdate(query, { $set: { active: false } }, { new: true }).lean();
    if (!deletedOrder) {
      return res.status(404).json({ status: 'error', message: 'Order not found' });
    }

    // Safe cleanup of member reference
    if (deletedOrder.member) {
      try {
        if (deletedOrder.did) {
          await MemberModel.updateOne(
            { _id: deletedOrder.member },
            { $pull: { orders: { did: deletedOrder.did } } }
          );
        }
        await updateMemberTotals(deletedOrder.member);
      } catch (memErr) {
        console.error("Error updating member totals on order delete:", memErr);
      }
    }

    // Safe cleanup of payment record
    try {
      await PaymentModel.findOneAndDelete({ orderId: deletedOrder._id });
    } catch (payErr) {
      console.error("Error deleting linked payment record:", payErr);
    }

    return res.json({ status: 'success', message: 'Order deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Soft delete multiple orders by setting active = false in bulk.
export const bulkDeleteOrders = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order IDs provided' });
    }

    // Convert IDs to Mongoose ObjectIds where applicable
    const objectIds = ids.map(id => Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null).filter(Boolean);

    // Build query targeting ObjectIds, custom short IDs (did), or order numbers
    const deleteQuery = {
      $or: [
        { _id: { $in: objectIds } },
        { did: { $in: ids } },
        { orderNumber: { $in: ids } }
      ]
    };

    // Find orders to identify linked members and payments before deletion
    const orders = await OrderModel.find(deleteQuery).lean();
    if (orders.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No orders found to delete' });
    }

    // Perform soft delete of order documents (active = false)
    await OrderModel.updateMany(deleteQuery, { $set: { active: false } });

    // Collect distinct member IDs, dids, and database ObjectIds
    const memberIds = [...new Set(orders.map(o => o.member).filter(Boolean))];
    const orderDids = orders.map(o => o.did).filter(Boolean);
    const orderDbIds = orders.map(o => o._id);

    // Pull order references from the member profiles and recalculate totals
    if (memberIds.length > 0 && orderDids.length > 0) {
      try {
        await MemberModel.updateMany(
          { _id: { $in: memberIds } },
          { $pull: { orders: { did: { $in: orderDids } } } }
        );
        for (const mId of memberIds) {
          await updateMemberTotals(mId).catch(err => console.error(err));
        }
      } catch (memErr) {
        console.error("Error cleaning up members on bulk order delete:", memErr);
      }
    }

    // Delete all linked payment documents in bulk
    try {
      await PaymentModel.deleteMany({ orderId: { $in: orderDbIds } });
    } catch (payErr) {
      console.error("Error deleting payments on bulk order delete:", payErr);
    }

    return res.json({ status: 'success', message: 'Orders deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Bulk update orders status and paymentStatus.
// This allows updating multiple orders at once, syncing payments and member totals.
export const bulkUpdateOrders = async (req, res, next) => {
  try {
    const { ids, status, paymentStatus } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ status: 'error', message: 'No order IDs provided' });
    }

    // Convert IDs to Mongoose ObjectIds where applicable
    const objectIds = ids.map(id => Types.ObjectId.isValid(id) ? new Types.ObjectId(id) : null).filter(Boolean);

    // Query targeting ObjectIds, custom short IDs (did), or order numbers
    const query = {
      $or: [
        { _id: { $in: objectIds } },
        { did: { $in: ids } },
        { orderNumber: { $in: ids } }
      ]
    };

    // Prepare update parameters
    const updateFields = {};
    if (status) {
      updateFields.status = status.toLowerCase();
    }

    // Find affected orders first to read references before updating
    const orders = await OrderModel.find(query).lean();
    if (orders.length === 0) {
      return res.status(404).json({ status: 'error', message: 'No orders found' });
    }

    // Update order documents status in bulk
    if (Object.keys(updateFields).length > 0) {
      await OrderModel.updateMany(query, { $set: updateFields });
    }

    // Identify distinct member IDs affected by the updates
    const memberIds = [...new Set(orders.map(o => o.member).filter(Boolean))];

    // Loop through each order to update payments
    for (const order of orders) {
      const updatedOrder = await OrderModel.findById(order._id).lean();
      if (!updatedOrder) continue;

      // If a specific paymentStatus is requested in bulk payload, update the linked payment document
      if (paymentStatus) {
        const pStatus = paymentStatus.toLowerCase();
        const totalAmount = Number(updatedOrder.totals?.total || 0);
        const paidAmount = pStatus === 'paid' ? totalAmount : 0;
        const pendingAmount = Math.max(0, totalAmount - paidAmount);

        await PaymentModel.findOneAndUpdate(
          { orderId: updatedOrder._id },
          {
            paymentMethod: updatedOrder.paymentMethod,
            paymentPhone: updatedOrder.billingInfo?.phone || '',
            totalAmount,
            paidAmount,
            pendingAmount,
            amount: paidAmount,
            status: pStatus,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } else {
        // Fall back to standard payment sync based on order state
        await syncPaymentDocument(updatedOrder);
      }
    }

    // Recalculate member totals
    if (memberIds.length > 0) {
      for (const mId of memberIds) {
        await updateMemberTotals(mId).catch(err => console.error(err));
      }
    }

    return res.json({ status: 'success', message: 'Orders updated successfully' });
  } catch (error) {
    next(error);
  }
};

// Render printable HTML / PDF invoice view for a specific order.
export const getOrderInvoiceView = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    let query = {};
    if (Types.ObjectId.isValid(orderId)) {
      query = { _id: orderId };
    } else {
      query = { $or: [{ did: orderId }, { orderNumber: orderId }] };
    }

    const order = await OrderModel.findOne(query).lean();
    if (!order) {
      return res.status(404).send("<h1 style='font-family:sans-serif;text-align:center;padding:50px;'>Order Invoice Not Found</h1>");
    }

    const formattedOrderData = {
      orderId: order.orderNumber || order.did || order._id?.toString()?.slice(-6),
      createdAt: order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
      customerName: order.billingInfo?.fullName || "Customer",
      customerEmail: order.billingInfo?.email || "",
      customerPhone: order.billingInfo?.phone || "",
      billingAddress: order.billingInfo || {},
      shippingAddress: order.shippingInfo || {},
      items: Array.isArray(order.items) ? order.items.map(item => ({
        productName: item.name || "Product",
        variantName: item.size || item.variant || "",
        quantity: item.quantity || 1,
        price: item.unitPrice || item.price || 0,
        subtotal: (item.unitPrice || item.price || 0) * (item.quantity || 1)
      })) : [],
      subtotal: order.totals?.subtotal || order.subtotal || 0,
      shippingFee: order.totals?.shippingFee || order.shippingFee || 0,
      totalAmount: order.totals?.total || order.totalAmount || 0,
      paymentMethod: order.paymentMethod || "Cash on Delivery"
    };

    const invoiceHtml = buildOrderInvoiceEmailHtml({ order: formattedOrderData, isPrintView: true });
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `inline; filename="Invoice-${formattedOrderData.orderId}.pdf"`);
    return res.send(invoiceHtml);
  } catch (error) {
    next(error);
  }
};


