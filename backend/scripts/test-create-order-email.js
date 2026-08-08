import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { sendOrderEmailsAsynchronously } from "../src/core/utils/orderDelivery.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const testSimulatedOrderEmail = async () => {
  console.log("🚀 Testing async order email trigger for web checkout order...");

  const mockOrder = {
    _id: "66b579f18a24d5b9423c56a1",
    did: "DEC-994821",
    orderNumber: "DEC-994821",
    createdAt: new Date(),
    customer: {
      firstName: "Ikramul",
      lastName: "Hoque",
      email: "metalhead.developer@gmail.com",
      phone: "+880 1712-345678"
    },
    billingAddress: {
      street: "House 45, Road 11, Sector 4",
      city: "Uttara",
      state: "Dhaka",
      zipCode: "1230"
    },
    shippingAddress: {
      street: "House 45, Road 11, Sector 4",
      city: "Uttara",
      state: "Dhaka",
      zipCode: "1230"
    },
    items: [
      {
        name: "Sauvage Elixir Eau De Parfum",
        variant: "10ml Decant",
        quantity: 2,
        price: 1850,
        subtotal: 3700
      },
      {
        name: "Baccarat Rouge 540 Extrait",
        variant: "5ml Decant",
        quantity: 1,
        price: 2400,
        subtotal: 2400
      }
    ],
    totals: {
      subtotal: 6100,
      shipping: 100,
      total: 6200
    },
    paymentMethod: "Cash on Delivery (COD)"
  };

  sendOrderEmailsAsynchronously(mockOrder);
  console.log("⚡ Non-blocking email trigger initiated. Controller flow returns response instantly.");

  // Keep script alive briefly for background email to finish logging
  await new Promise(resolve => setTimeout(resolve, 4000));
};

testSimulatedOrderEmail();
