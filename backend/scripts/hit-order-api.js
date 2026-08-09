import fetch from "node-fetch";

const API_URL = "https://server.decantrebd.com/api/v1/orders/new-order";

const mockOrderPayload = {
  memberId: null,
  customer: {
    firstName: "Metalhead",
    lastName: "User",
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
      productId: "66b579f18a24d5b9423c56a1", // Use a generic string if needed, but it might validate. Let's hope validation doesn't strictly check real product DB if we pass enough details, or maybe it does? 
      name: "Sauvage Elixir Eau De Parfum",
      variant: "10ml Decant",
      quantity: 1,
      price: 1850,
      subtotal: 1850
    }
  ],
  totals: {
    subtotal: 1850,
    shipping: 100,
    total: 1950
  },
  paymentMethod: "Cash on Delivery (COD)"
};

async function createOrder() {
  console.log(`🚀 Sending POST request to ${API_URL}...`);
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(mockOrderPayload)
    });

    const data = await response.json();
    console.log("Response Status:", response.status);
    console.log("Response Data:", JSON.stringify(data, null, 2));

    if (response.ok) {
      console.log("✅ Order created successfully! Emails should be dispatched.");
    } else {
      console.error("❌ Failed to create order.");
    }
  } catch (error) {
    console.error("❌ Error making API call:", error);
  }
}

createOrder();
