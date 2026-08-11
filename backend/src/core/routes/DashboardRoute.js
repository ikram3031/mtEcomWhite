import express from 'express';
import { dailyOrders, getKpiStats } from '../controllers/DashboardController.js';

const router = express.Router();

router.get('/orders/daily', dailyOrders);
router.get('/kpi', getKpiStats);

export default router;
