import { OrderModel } from '../models/order.model.js';
import { ProductModel } from '../models/product.model.js';
import { PaymentModel } from '../models/payment.model.js';

const OFFSET_MS = 6 * 60 * 60 * 1000; // BD Timezone (+06:00)

// Parses date range and channel filters for aggregation pipelines
const buildFilters = (req) => {
  const { range, startDate, endDate, channel } = req.query;
  const nowUtc = new Date();
  const nowLocal = new Date(nowUtc.getTime() + OFFSET_MS);
  
  const todayLocalMidnight = new Date(nowLocal);
  todayLocalMidnight.setUTCHours(0, 0, 0, 0);

  let startUtc, endUtc = nowUtc;

  if (startDate && endDate) {
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
      startUtc = new Date(s.getTime() - OFFSET_MS);
      endUtc = new Date(e.getTime() + 24 * 60 * 60 * 1000 - 1 - OFFSET_MS);
    }
  }

  if (!startUtc) {
    let days = 30;
    if (range === 'today') days = 1;
    else if (range === 'yesterday') {
      const yesterdayLocal = new Date(todayLocalMidnight.getTime() - 24 * 60 * 60 * 1000);
      startUtc = new Date(yesterdayLocal.getTime() - OFFSET_MS);
      endUtc = new Date(todayLocalMidnight.getTime() - 1 - OFFSET_MS);
    }
    else if (range === '7days') days = 7;
    else if (range === '30days') days = 30;
    else if (range === 'thisMonth') {
      const firstDayLocal = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), 1));
      startUtc = new Date(firstDayLocal.getTime() - OFFSET_MS);
    }
    else if (range === 'lastMonth') {
      const firstDayLastMonthLocal = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth() - 1, 1));
      const lastDayLastMonthLocal = new Date(Date.UTC(nowLocal.getUTCFullYear(), nowLocal.getUTCMonth(), 0, 23, 59, 59, 999));
      startUtc = new Date(firstDayLastMonthLocal.getTime() - OFFSET_MS);
      endUtc = new Date(lastDayLastMonthLocal.getTime() - OFFSET_MS);
    }
    else if (range === 'thisYear') {
      const firstDayYearLocal = new Date(Date.UTC(nowLocal.getUTCFullYear(), 0, 1));
      startUtc = new Date(firstDayYearLocal.getTime() - OFFSET_MS);
    }

    if (!startUtc) {
      startUtc = new Date(todayLocalMidnight.getTime() - (days - 1) * 24 * 60 * 60 * 1000 - OFFSET_MS);
    }
  }

  const match = { createdAt: { $gte: startUtc, $lte: endUtc } };
  
  if (channel === 'pos') {
    match.orderNumber = { $regex: /^IS/ };
  } else if (channel === 'online') {
    match.orderNumber = { $not: { $regex: /^IS/ } };
  }

  return { startUtc, endUtc, matchQuery: match };
};

// Returns aggregated KPIs including gross sales, net sales, and AOV
export const getSummaryReport = async (req, res, next) => {
  try {
    const { matchQuery } = buildFilters(req);
    
    // Only aggregate completed orders for Revenue
    const completedMatch = { ...matchQuery, status: 'completed' };

    const agg = await OrderModel.aggregate([
      { $match: completedMatch },
      {
        $group: {
          _id: null,
          grossSales: { $sum: { $add: ['$totals.subtotal', '$discountTotalAmount'] } },
          netSales: { $sum: '$totals.subtotal' },
          totalDiscount: { $sum: '$discountTotalAmount' },
          totalOrders: { $sum: 1 },
          onlineSales: { 
            $sum: { $cond: [{ $regexMatch: { input: '$orderNumber', regex: /^IS/ } }, 0, '$totals.subtotal'] }
          },
          posSales: { 
            $sum: { $cond: [{ $regexMatch: { input: '$orderNumber', regex: /^IS/ } }, '$totals.subtotal', 0] }
          },
        },
      },
    ]);

    const result = agg[0] || { grossSales: 0, netSales: 0, totalDiscount: 0, totalOrders: 0, onlineSales: 0, posSales: 0 };
    result.aov = result.totalOrders > 0 ? (result.netSales / result.totalOrders) : 0;

    return res.json({ status: 'success', data: result });
  } catch (error) {
    next(error);
  }
};

// Generates a time-series grouping of sales by date for charts
export const getSalesTimeline = async (req, res, next) => {
  try {
    const { matchQuery } = buildFilters(req);
    // Include completed for revenue
    const completedMatch = { ...matchQuery, status: 'completed' };

    const agg = await OrderModel.aggregate([
      { $match: completedMatch },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+06:00' } },
          grossSales: { $sum: { $add: ['$totals.subtotal', '$discountTotalAmount'] } },
          netSales: { $sum: '$totals.subtotal' },
          discount: { $sum: '$discountTotalAmount' },
          ordersCount: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    return res.json({ status: 'success', data: agg });
  } catch (error) {
    next(error);
  }
};

// Aggregates best-selling products by quantity sold and revenue
export const getTopProductsReport = async (req, res, next) => {
  try {
    const { matchQuery } = buildFilters(req);
    const completedMatch = { ...matchQuery, status: 'completed' };

    const agg = await OrderModel.aggregate([
      { $match: completedMatch },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          sku: { $first: '$items.sku' },
          unitsSold: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.unitPrice'] } }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 100 }
    ]);

    return res.json({ status: 'success', data: agg });
  } catch (error) {
    next(error);
  }
};

// Breaks down transactions by payment method and totals
export const getPaymentReport = async (req, res, next) => {
  try {
    const { matchQuery } = buildFilters(req);

    const agg = await PaymentModel.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentMethod',
          totalAmount: { $sum: '$totalAmount' },
          paidAmount: { $sum: '$paidAmount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    return res.json({ status: 'success', data: agg });
  } catch (error) {
    next(error);
  }
};

// Analyzes total inventory valuation and low stock alerts
export const getInventoryReport = async (req, res, next) => {
  try {
    const agg = await ProductModel.aggregate([
      {
        $project: {
          name: 1,
          sku: 1,
          type: 1,
          price: 1,
          isActive: 1,
          variants: 1,
          inventoryInfo: 1
        }
      }
    ]);
    
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let productsList = [];

    agg.forEach(p => {
      let currentStock = 0;
      let val = 0;

      if (p.type === 'variant' && p.variants?.length > 0) {
        currentStock = p.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
        val = p.variants.reduce((sum, v) => sum + ((v.stock || 0) * (v.price || 0)), 0);
      } else {
        currentStock = p.inventoryInfo?.stock || 0;
        val = currentStock * (p.price || 0);
      }

      totalValuation += val;
      if (currentStock === 0) outOfStockCount++;
      else if (currentStock < 5) lowStockCount++;

      if (currentStock < 10) {
        productsList.push({
          name: p.name,
          sku: p.sku || 'N/A',
          type: p.type,
          stock: currentStock,
          status: currentStock === 0 ? 'Out of Stock' : 'Low Stock'
        });
      }
    });

    productsList.sort((a, b) => a.stock - b.stock);

    return res.json({
      status: 'success',
      data: {
        totalValuation,
        lowStockCount,
        outOfStockCount,
        alerts: productsList.slice(0, 100)
      }
    });
  } catch (error) {
    next(error);
  }
};
