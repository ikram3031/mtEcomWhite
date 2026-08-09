import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, 'src');

const renameMap = [
  { from: 'pages/auth/Login.jsx', to: 'pages/auth/login.jsx' },
  { from: 'layouts/DashboardLayout.jsx', to: 'layouts/dashboardLayout.jsx' },
  { from: 'pages/dashboard/Overview.jsx', to: 'pages/dashboard/overview.jsx' },
  { from: 'pages/dashboard/Users.jsx', to: 'pages/dashboard/users.jsx' },
  { from: 'pages/dashboard/Reports.jsx', to: 'pages/dashboard/reports.jsx' },
  { from: 'pages/dashboard/Members.jsx', to: 'pages/dashboard/members.jsx' },
  { from: 'pages/dashboard/products/ProductsList.jsx', to: 'pages/dashboard/products/productsList.jsx' },
  { from: 'pages/dashboard/products/ProductDetails.jsx', to: 'pages/dashboard/products/productDetails.jsx' },
  { from: 'pages/dashboard/products/NewProduct.jsx', to: 'pages/dashboard/products/newProduct.jsx' },
  { from: 'pages/dashboard/products/Stock.jsx', to: 'pages/dashboard/products/stock.jsx' },
  { from: 'pages/dashboard/products/Coupons.jsx', to: 'pages/dashboard/products/coupons.jsx' },
  { from: 'pages/dashboard/products/Categories.jsx', to: 'pages/dashboard/products/categories.jsx' },
  { from: 'pages/dashboard/products/Brands.jsx', to: 'pages/dashboard/products/brands.jsx' },
  { from: 'pages/dashboard/products/Attributes.jsx', to: 'pages/dashboard/products/attributes.jsx' },
  { from: 'pages/dashboard/orders/OrdersList.jsx', to: 'pages/dashboard/orders/ordersList.jsx' },
  { from: 'pages/dashboard/orders/OrderDetails.jsx', to: 'pages/dashboard/orders/orderDetails.jsx' },
  { from: 'pages/dashboard/orders/NewOrder.jsx', to: 'pages/dashboard/orders/newOrder.jsx' },
  { from: 'pages/dashboard/billing/BillingOverview.jsx', to: 'pages/dashboard/billing/billingOverview.jsx' },
  { from: 'pages/dashboard/billing/Payments.jsx', to: 'pages/dashboard/billing/payments.jsx' },
  { from: 'pages/dashboard/billing/Billings.jsx', to: 'pages/dashboard/billing/billings.jsx' }
];

renameMap.forEach(({ from, to }) => {
  const fromPath = path.join(srcDir, from);
  const toPath = path.join(srcDir, to);
  
  if (fs.existsSync(fromPath)) {
    fs.renameSync(fromPath, toPath);
    console.log(`Renamed: ${from} -> ${to}`);
  }
});

console.log('camelCase renaming complete.');
