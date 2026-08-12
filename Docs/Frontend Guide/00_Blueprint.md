# Frontend Functional Architecture & API Integration Blueprint

This document contains the exact functional architecture, state flow, API client wrappers, schema adapters, and store logic extracted directly from the Decantre frontend documentation (Version 1 & Version 2) for direct copy-pasting into a new project, omitting UI styling.

---

## 1. Directory Structure

Place these core files in your target project:

```
src/
├── core/
│   ├── lib/
│   │   └── api.js              # Fetch client, retries, authFetch, token refresh & endpoints
│   ├── store/
│   │   ├── useAppStore.js      # Zustand global state (cart, wishlist, user, products)
│   │   └── productHelpers.js   # Product normalizer & variant adapters
```

---

## 2. API Client & Authentication Layer (`src/core/lib/api.js`)

```javascript
// Environment URL Resolution
export const getApiBaseUrl = () => {
  const envUrl =
    import.meta.env.VITE_API_URL || import.meta.env.NEXT_PUBLIC_API_URL || "";
  return envUrl ? envUrl.replace(/\/$/, "") : "";
};

export const getImageBaseUrl = () => {
  const envImgUrl =
    import.meta.env.VITE_IMAGE_BASE_URL ||
    import.meta.env.NEXT_PUBLIC_IMAGE_BASE_URL ||
    "";
  return envImgUrl ? envImgUrl.replace(/\/$/, "") : getApiBaseUrl();
};

// Token Storage Keys
const ACCESS_TOKEN_KEY = "luxury_access_token";
const REFRESH_TOKEN_KEY = "luxury_refresh_token";

export const getStoredMemberTokens = () => ({
  accessToken: localStorage.getItem(ACCESS_TOKEN_KEY) || "",
  refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY) || "",
});

export const setStoredMemberTokens = ({ accessToken, refreshToken }) => {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

export const clearStoredMemberTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// Request Handling Utilities & Retries
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

export const fetchWithRetry = async (
  url,
  options = {},
  timeout = 10000,
  maxAttempts = 3,
  attempt = 1,
) => {
  try {
    return await fetchWithTimeout(url, options, timeout);
  } catch (err) {
    if (attempt >= maxAttempts) throw err;
    await delay(250 * attempt);
    return fetchWithRetry(url, options, timeout, maxAttempts, attempt + 1);
  }
};

// Refresh Token Request
export const refreshMemberSession = async () => {
  const { refreshToken } = getStoredMemberTokens();
  if (!refreshToken) throw new Error("No refresh token available");

  const apiBaseUrl = getApiBaseUrl();
  const res = await fetchWithRetry(
    `${apiBaseUrl}/api/v1/members/refresh-token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    },
    8000,
    2,
  );

  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Token refresh failed");

  const newAccess = json.accessToken || json.data?.accessToken;
  const newRefresh =
    json.refreshToken || json.data?.refreshToken || refreshToken;
  setStoredMemberTokens({ accessToken: newAccess, refreshToken: newRefresh });
  return { accessToken: newAccess, refreshToken: newRefresh };
};

// Authenticated Fetch Wrapper (401 Auto Refresh)
export const authFetch = async (url, options = {}, timeout = 10000) => {
  const { accessToken } = getStoredMemberTokens();
  const headers = new Headers(options.headers || {});

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetchWithRetry(url, { ...options, headers }, timeout, 3);

  if (res.status === 401) {
    try {
      const refreshed = await refreshMemberSession();
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set("Authorization", `Bearer ${refreshed.accessToken}`);

      if (
        options.body &&
        !(options.body instanceof FormData) &&
        !retryHeaders.has("Content-Type")
      ) {
        retryHeaders.set("Content-Type", "application/json");
      }

      res = await fetchWithRetry(
        url,
        { ...options, headers: retryHeaders },
        timeout,
        3,
      );
    } catch (_) {
      clearStoredMemberTokens();
      throw new Error("Your session has expired. Please log in again.");
    }
  }
  return res;
};

// --- Product Endpoints ---
export async function fetchProducts(opts = {}) {
  const apiBaseUrl = getApiBaseUrl();
  const skip = opts.skip ?? opts.offset ?? 0;
  const limit = Math.min(opts.limit || 20, 100);
  const sortBy = opts.sortBy || "createdAt";
  const order = opts.order || "desc";
  const q = opts.q || opts.search || opts.keyword || "";

  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (opts.category) params.set("category", opts.category);
  if (opts.brand) params.set("brand", opts.brand);
  if (opts.season) params.set("season", opts.season);
  if (opts.tags) params.set("tags", opts.tags);
  if (opts.filter) params.set("filter", opts.filter);
  if (opts.name) params.set("name", opts.name);
  if (opts.slug) params.set("slug", opts.slug);
  if (opts.did) params.set("did", opts.did);
  if (opts.minPrice !== undefined) params.set("min_price", opts.minPrice);
  if (opts.maxPrice !== undefined) params.set("max_price", opts.maxPrice);

  params.set("skip", String(skip));
  params.set("limit", String(limit));
  params.set("sortBy", sortBy);
  params.set("order", order);

  try {
    const res = await fetchWithRetry(
      `${apiBaseUrl}/api/v1/products?${params.toString()}`,
      { method: "GET" },
      10000,
      3,
    );
    if (!res.ok) throw new Error(`Server error: ${res.status}`);

    const json = await res.json();
    const list = Array.isArray(json.data)
      ? json.data
      : Array.isArray(json)
        ? json
        : [];
    return list;
  } catch (err) {
    console.error("fetchProducts Error:", err);
    throw err;
  }
}

export async function fetchProductDetails(slugOrId) {
  const apiBaseUrl = getApiBaseUrl();
  try {
    let res = await fetchWithRetry(
      `${apiBaseUrl}/api/v1/products/${slugOrId}`,
      {},
      8000,
      3,
    );
    if (!res.ok) {
      res = await fetchWithRetry(
        `${apiBaseUrl}/api/wp/products/${slugOrId}`,
        {},
        8000,
        3,
      );
    }
    if (!res.ok) throw new Error("Failed to fetch product details.");

    const json = await res.json();
    return json.data || json;
  } catch (err) {
    console.error("fetchProductDetails Error:", err);
    throw err;
  }
}

// --- Categories & Brands ---
export async function fetchCategories(opts = {}) {
  const apiBaseUrl = getApiBaseUrl();
  const skip = opts.skip ?? 0;
  const limit = opts.limit || 50;
  const res = await fetchWithRetry(
    `${apiBaseUrl}/api/v1/categories?skip=${skip}&limit=${limit}`,
    {},
    8000,
    3,
  );
  if (!res.ok) throw new Error("Failed to fetch categories.");
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
}

export async function fetchBrands(opts = {}) {
  const apiBaseUrl = getApiBaseUrl();
  const skip = opts.skip ?? 0;
  const limit = opts.limit || 50;
  const res = await fetchWithRetry(
    `${apiBaseUrl}/api/v1/brands?skip=${skip}&limit=${limit}`,
    {},
    8000,
    3,
  );
  if (!res.ok) throw new Error("Failed to fetch brands.");
  const json = await res.json();
  return Array.isArray(json.data) ? json.data : Array.isArray(json) ? json : [];
}

// --- Orders & Coupons ---
export async function fetchCouponByCode(code) {
  const apiBaseUrl = getApiBaseUrl();
  const res = await fetchWithRetry(
    `${apiBaseUrl}/api/v1/coupons/${encodeURIComponent(code)}`,
    {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    },
  );
  const json = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(json?.message || json?.error || "Invalid coupon code.");
  return json?.data || json;
}

export async function createOrder(orderPayload) {
  const apiBaseUrl = getApiBaseUrl();
  const res = await fetch(`${apiBaseUrl}/api/v1/orders/new-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(orderPayload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const errorMsg =
      json?.errors?.join(", ") || json?.message || "Failed to place order";
    throw new Error(errorMsg);
  }
  return json;
}

// --- Member Auth Endpoints ---
export async function checkMemberEmail(emailPayload) {
  const apiBaseUrl = getApiBaseUrl();
  const res = await fetch(`${apiBaseUrl}/api/v1/members/check-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(emailPayload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Email check failed.");
  return json;
}

export async function loginMember(credentials) {
  const apiBaseUrl = getApiBaseUrl();
  const res = await fetch(`${apiBaseUrl}/api/v1/members/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Login failed.");
  return json;
}

export async function registerMember(memberPayload) {
  const apiBaseUrl = getApiBaseUrl();
  const res = await fetch(`${apiBaseUrl}/api/v1/members/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(memberPayload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Registration failed.");
  return json;
}

export async function verifyMemberOtp(payload) {
  const apiBaseUrl = getApiBaseUrl();
  const res = await fetch(`${apiBaseUrl}/api/v1/members/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "OTP verification failed.");
  return json;
}

export async function resendMemberOtp(payload) {
  const apiBaseUrl = getApiBaseUrl();
  const res = await fetch(`${apiBaseUrl}/api/v1/members/resend-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Failed to resend OTP.");
  return json;
}

export async function forgotMemberPassword(payload) {
  const apiBaseUrl = getApiBaseUrl();
  const res = await fetch(`${apiBaseUrl}/api/v1/members/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(json?.message || "Password reset request failed.");
  return json;
}

export async function resetMemberPassword(payload) {
  const apiBaseUrl = getApiBaseUrl();
  const res = await fetch(`${apiBaseUrl}/api/v1/members/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Password reset failed.");
  return json;
}

// --- Protected Member Administration ---
export async function fetchMembers() {
  const apiBaseUrl = getApiBaseUrl();
  const res = await authFetch(`${apiBaseUrl}/api/v1/members`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok)
    throw new Error(json?.message || "Failed to fetch members list.");
  return json?.data || [];
}

export async function fetchMemberById(memberId) {
  const apiBaseUrl = getApiBaseUrl();
  const res = await authFetch(`${apiBaseUrl}/api/v1/members/${memberId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Member not found.");
  return json?.data || json;
}

export async function updateMember(memberId, updatePayload) {
  const apiBaseUrl = getApiBaseUrl();
  const res = await authFetch(`${apiBaseUrl}/api/v1/members/${memberId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatePayload),
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Failed to update member.");
  return json?.data || json;
}

export async function deleteMember(memberId) {
  const apiBaseUrl = getApiBaseUrl();
  const res = await authFetch(`${apiBaseUrl}/api/v1/members/${memberId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(json?.message || "Failed to delete member.");
  return json;
}
```

---

## 3. Product Schema Normalizer (`src/core/store/productHelpers.js`)

```javascript
import { getImageBaseUrl } from "../lib/api";

export const normalizeProductImage = (src = "") => {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  const baseUrl = getImageBaseUrl();
  const cleanPath = src.startsWith("/") ? src : `/${src}`;
  return `${baseUrl}${cleanPath}`;
};

export const mapRemoteProduct = (product = {}) => {
  let rawImage = product.imageUrl || product.image || "";
  if (!rawImage && Array.isArray(product.images) && product.images.length > 0) {
    const firstImg = product.images[0];
    rawImage = typeof firstImg === "object" ? firstImg.url : firstImg;
  }

  const galleryImages = Array.isArray(product.images)
    ? product.images
        .map((img) =>
          typeof img === "object"
            ? normalizeProductImage(img.url)
            : normalizeProductImage(img),
        )
        .filter(Boolean)
    : [];

  let variations = [];
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    variations = product.variants.map((v, idx) => ({
      id: v._id || v.id || `var-${idx}`,
      name: `${product.name || product.title} - ${v.size}`,
      size: v.size || "Standard",
      price: Number(v.offerPrice || v.price || 0),
      originalPrice: v.offerPrice ? Number(v.price) : null,
      stockQuantity: v.stockQuantity ?? 0,
      stockStatus: (v.stockQuantity ?? 1) > 0 ? "instock" : "outofstock",
      sku: v.sku || "",
    }));
  }

  if (variations.length === 0) {
    variations.push({
      id: product.id || product._id || "var-default",
      name: product.name || product.title || "",
      size: "Full Bottle",
      price: Number(product.offerPrice || product.price || 0),
      originalPrice: product.offerPrice ? Number(product.price) : null,
      stockStatus: product.stockStatus || "instock",
    });
  }

  return {
    id: product.id || product._id || product.slug || String(Math.random()),
    name: product.name || product.title || "",
    slug: product.slug || "",
    category:
      typeof product.category === "object"
        ? product.category?.name
        : product.category || "Uncategorized",
    brand:
      typeof product.brand === "object"
        ? product.brand?.name
        : product.brand || "Generic",
    basePrice:
      variations.length > 0 ? Math.min(...variations.map((v) => v.price)) : 0,
    image: normalizeProductImage(rawImage),
    images:
      galleryImages.length > 0
        ? galleryImages
        : [normalizeProductImage(rawImage)],
    variations,
    raw: product,
  };
};

export const getDefaultSelection = (product) => {
  if (
    !product ||
    !Array.isArray(product.variations) ||
    product.variations.length === 0
  ) {
    return { size: "Standard", price: product?.basePrice || 0 };
  }
  const sorted = [...product.variations].sort((a, b) => a.price - b.price);
  return sorted[0];
};
```

---

## 4. Zustand Centralized Store (`src/core/store/useAppStore.js`)

```javascript
import { create } from "zustand";
import {
  fetchProducts as apiFetchProducts,
  fetchProductDetails as apiFetchProductDetails,
  fetchCategories as apiFetchCategories,
  fetchBrands as apiFetchBrands,
  createOrder as apiCreateOrder,
  fetchCouponByCode as apiFetchCouponByCode,
  setStoredMemberTokens,
  clearStoredMemberTokens,
} from "../lib/api";
import { mapRemoteProduct } from "./productHelpers";

const CART_KEY = "luxury_cart";
const USER_KEY = "luxury_user";
const WISHLIST_KEY = "luxury_wishlist";
const CATEGORIES_KEY = "luxury_categories";
const BRANDS_KEY = "luxury_brands";

const loadInitial = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
};

export const useAppStore = create((set, get) => ({
  // --- State ---
  products: [],
  isProductsLoading: false,
  productsError: null,

  categories: loadInitial(CATEGORIES_KEY, []),
  brands: loadInitial(BRANDS_KEY, []),

  cart: loadInitial(CART_KEY, []),
  wishlist: loadInitial(WISHLIST_KEY, []),
  user: loadInitial(USER_KEY, null),

  appliedCoupon: null,

  // --- Auth Session Actions ---
  setUser: (userData, tokens = null) => {
    if (tokens) setStoredMemberTokens(tokens);
    localStorage.setItem(USER_KEY, JSON.stringify(userData));
    set({ user: userData });
  },

  logoutUser: () => {
    clearStoredMemberTokens();
    localStorage.removeItem(USER_KEY);
    set({ user: null });
  },

  // --- Cart Actions ---
  addToCart: (product, selectedVariant, quantity = 1) => {
    const { cart } = get();
    const variantId = selectedVariant?.id || "default";
    const cartItemId = `${product.id}-${variantId}`;

    const existingIndex = cart.findIndex(
      (item) => item.cartItemId === cartItemId,
    );
    let updatedCart;

    if (existingIndex > -1) {
      updatedCart = [...cart];
      updatedCart[existingIndex].quantity += quantity;
    } else {
      const newItem = {
        cartItemId,
        productId: product.id,
        name: product.name,
        image: product.image,
        size: selectedVariant?.size || "Standard",
        price: selectedVariant?.price || product.basePrice,
        quantity,
      };
      updatedCart = [...cart, newItem];
    }

    localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
    set({ cart: updatedCart });
  },

  removeFromCart: (cartItemId) => {
    const updatedCart = get().cart.filter(
      (item) => item.cartItemId !== cartItemId,
    );
    localStorage.setItem(CART_KEY, JSON.stringify(updatedCart));
    set({ cart: updatedCart });
  },

  clearCart: () => {
    localStorage.removeItem(CART_KEY);
    set({ cart: [], appliedCoupon: null });
  },

  getCartTotals: () => {
    const { cart, appliedCoupon } = get();
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    let discount = 0;

    if (appliedCoupon) {
      if (appliedCoupon.discountType === "percentage") {
        discount = (subtotal * Number(appliedCoupon.discountValue)) / 100;
      } else {
        discount = Number(appliedCoupon.discountValue || 0);
      }
    }

    const total = Math.max(0, subtotal - discount);
    return {
      subtotal,
      discount,
      total,
      totalItems: cart.reduce((sum, item) => sum + item.quantity, 0),
    };
  },

  // --- Async Store Actions ---
  fetchProducts: async (opts = {}) => {
    set({ isProductsLoading: true, productsError: null });
    try {
      const rawList = await apiFetchProducts(opts);
      const mapped = rawList.map(mapRemoteProduct);
      set({ products: mapped, isProductsLoading: false });
      return mapped;
    } catch (err) {
      set({
        isProductsLoading: false,
        productsError: "Failed to fetch products",
      });
      return [];
    }
  },

  fetchProductDetails: async (slugOrId) => {
    const raw = await apiFetchProductDetails(slugOrId);
    return raw ? mapRemoteProduct(raw) : null;
  },

  fetchCategories: async () => {
    try {
      const list = await apiFetchCategories();
      localStorage.setItem(CATEGORIES_KEY, JSON.stringify(list));
      set({ categories: list });
      return list;
    } catch (_) {
      return get().categories;
    }
  },

  fetchBrands: async () => {
    try {
      const list = await apiFetchBrands();
      localStorage.setItem(BRANDS_KEY, JSON.stringify(list));
      set({ brands: list });
      return list;
    } catch (_) {
      return get().brands;
    }
  },

  applyPromoCode: async (code) => {
    const coupon = await apiFetchCouponByCode(code);
    set({ appliedCoupon: coupon });
    return coupon;
  },

  submitOrder: async (shippingDetails) => {
    const { cart, clearCart } = get();
    const orderPayload = {
      ...shippingDetails,
      items: cart,
    };
    const res = await apiCreateOrder(orderPayload);
    clearCart();
    return res;
  },
}));
```

---

## 5. Auth Modal Flow Logic (Non-UI State Machine)

Here is the exact step-wise authentication state machine for handling login, check-email, registration, and OTP verification:

```javascript
import { useState } from "react";
import {
  checkMemberEmail,
  loginMember,
  registerMember,
  verifyMemberOtp,
  resendMemberOtp,
} from "../lib/api";
import { useAppStore } from "../store/useAppStore";

export const useAuthFlow = () => {
  const { setUser } = useAppStore();
  const [step, setStep] = useState("email"); // "email" | "password" | "register" | "otp"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phoneSuffix, setPhoneSuffix] = useState("");
  const [otpContext, setOtpContext] = useState("login"); // "login" | "register"

  // Step 1: Submit Email
  const handleEmailSubmit = async () => {
    const res = await checkMemberEmail({ email });
    if (res.requiresOtp || res.isEmailVerified === false) {
      setOtpContext("login");
      setStep("otp");
      return;
    }
    if (res.exists) {
      setStep("password");
    } else {
      setStep("register");
    }
  };

  // Step 2a: Submit Login
  const handleLoginSubmit = async () => {
    const res = await loginMember({ email, password });
    if (res.requiresOtp || res.isEmailVerified === false) {
      setOtpContext("login");
      setStep("otp");
      return;
    }
    setUser(res.user || res.member, {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    });
  };

  // Step 2b: Submit Registration
  const handleRegisterSubmit = async () => {
    const fullPhone = `+880${phoneSuffix}`;
    const res = await registerMember({
      name,
      email,
      phone: fullPhone,
      password,
    });
    setOtpContext("register");
    setStep("otp");
  };

  // Step 3: Verify OTP
  const handleOtpSubmit = async (code) => {
    const res = await verifyMemberOtp({
      email,
      otp: code,
      context: otpContext,
    });
    setUser(res.user || res.member, {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
    });
  };

  return {
    step,
    email,
    setEmail,
    password,
    setPassword,
    name,
    setName,
    phoneSuffix,
    setPhoneSuffix,
    handleEmailSubmit,
    handleLoginSubmit,
    handleRegisterSubmit,
    handleOtpSubmit,
  };
};
```

### For cutom features

implement creating new folder naming ./client in the same directory as ./core only if a new feature is requiredm which doesn't exists on these documentations
