import { Types } from "mongoose";
import { CategoryModel } from "../models/category.model.js";
import { BrandModel } from "../models/brand.model.js";

const DEFAULT_LIMIT = 10;
const SORT_FIELD_MAP = {
  name: "name",
  price: "price",
  createdAt: "createdAt",
  updatedAt: "updatedAt",
  stockStatus: "stockStatus",
};

export const PLACEHOLDER_IMAGE_URL = "/uploads/product_placeholder.webp";

/**
 * Normalizes input value by trimming if it is a string.
 * @param {*} value - The value to normalize.
 * @returns {*} Normalized value.
 */
export const normalizeValue = (value) => {
  if (typeof value === "string") {
    return value.trim();
  }

  return value;
};

/**
 * Checks if the image URL matches the placeholder image.
 * @param {string} value - The image URL to check.
 * @returns {boolean} True if the image is a placeholder.
 */
export const isPlaceholderImageUrl = (value) => typeof value === "string" && value.trim() === PLACEHOLDER_IMAGE_URL;

/**
 * Serializes a Mongoose product document into a clean API response format.
 * @param {Object} product - The product document.
 * @returns {Object} Serialized product object.
 */
export const serializeProduct = (product) => {
  const source = product?.toObject ? product.toObject() : product;
  const { _id, __v, ...rest } = source || {};
  const id = source?._id?.toString?.() ?? source?.id ?? null;

  return {
		...rest,
		id,
		stockStatus: source?.stockStatus ?? null,
		created_at: source?.createdAt ?? null,
		updated_at: source?.updatedAt ?? null,
		image_url: source?.imageUrl ?? null,
		thumbnail_url: source?.thumbnailUrl ?? null,
	};
};

/**
 * Builds a Mongoose filter query object based on the provided request parameters.
 * Supports keyword search, stock status, category filter, brand filter, type, slug, and did.
 * @param {Object} input - The input parameters.
 * @returns {Promise<Object>} The filter object.
 */
export const buildProductFilter = async (input = {}) => {
  const source = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const explicitFilter = source.filter && typeof source.filter === "object" && !Array.isArray(source.filter)
    ? source.filter
    : {};

  const filter = {};

  Object.entries(explicitFilter).forEach(([key, value]) => {
    if (value === "" || value === null || value === undefined) {
      return;
    }

    if (key !== "q") {
      filter[key] = value;
    }
  });

  Object.entries(source).forEach(([key, value]) => {
    if (["q", "search", "keyword", "page", "skip", "offset", "limit", "sort", "sortBy", "sortby", "order", "filter", "category", "categories", "brand", "brands", "minPrice", "maxPrice", "min_price", "max_price", "rating"].includes(key)) {
      return;
    }

    if (value === "" || value === null || value === undefined) {
      return;
    }

    filter[key] = value;
  });

  const rawQ = normalizeValue(source.q ?? source.search ?? source.keyword);
  const q = (typeof rawQ === "string" && (rawQ === "undefined" || rawQ === "null" || rawQ.trim() === "")) ? "" : rawQ;
  if (q) {
    const searchClause = [
      { name: { $regex: q, $options: "i" } },
      { slug: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];

    if (filter.$or) {
      filter.$or = [...filter.$or, ...searchClause];
    } else {
      filter.$or = searchClause;
    }
  }

  const stockStatus = normalizeValue(source.stockStatus ?? source.status);
  if (stockStatus) {
    filter.stockStatus = stockStatus;
  }

  const categoryInput = source.category ?? source.categories;
  if (categoryInput) {
    const categoryValues = Array.isArray(categoryInput) ? categoryInput : [categoryInput];
    const resolved = [];

    for (const categoryValue of categoryValues) {
      if (categoryValue === "" || categoryValue === null || categoryValue === undefined) {
        continue;
      }

      if (Types.ObjectId.isValid(categoryValue)) {
        resolved.push(categoryValue);
        continue;
      }

      const normalizedCategory = normalizeValue(categoryValue);
      if (!normalizedCategory) continue;

      const categoryQuery = /^[0-9a-fA-F]{16}$/.test(normalizedCategory)
        ? { did: normalizedCategory }
        : {
            $or: [
              { slug: normalizedCategory },
              { slug: { $regex: normalizedCategory, $options: "i" } }
            ]
          };

      const categoryDocs = await CategoryModel.find(categoryQuery).lean();
      for (const categoryDoc of categoryDocs) {
        if (categoryDoc?._id) {
          resolved.push(categoryDoc._id);
        }
      }
    }

    filter.categories = { $in: resolved };
  }

  const brandInput = source.brand ?? source.brands;
  if (brandInput) {
    const rawValues = Array.isArray(brandInput) ? brandInput : [brandInput];
    const brandValues = [];
    rawValues.forEach(val => {
      if (typeof val === 'string' && val.includes(',')) {
        brandValues.push(...val.split(','));
      } else {
        brandValues.push(val);
      }
    });

    const resolved = [];

    for (const brandValue of brandValues) {
      if (brandValue === "" || brandValue === null || brandValue === undefined) {
        continue;
      }

      const normalizedBrand = normalizeValue(brandValue);
      if (!normalizedBrand) continue;

      let brandDocs = [];
      if (/^[0-9a-fA-F]{16}$/.test(normalizedBrand)) {
        brandDocs = await BrandModel.find({ did: normalizedBrand }).lean();
      } else {
        const brandQuery = /^[0-9a-fA-F]{24}$/.test(normalizedBrand)
          ? { _id: normalizedBrand }
          : {
              $or: [
                { slug: normalizedBrand },
                { slug: { $regex: normalizedBrand, $options: "i" } }
              ]
            };
        brandDocs = await BrandModel.find(brandQuery).lean();
      }

      for (const brandDoc of brandDocs) {
        if (brandDoc.did) {
          resolved.push(brandDoc.did);
        }
        const subBrands = await BrandModel.find({ parent: brandDoc._id }).lean();
        subBrands.forEach(sub => {
          if (sub.did) {
            resolved.push(sub.did);
          }
        });
      }
    }

    filter.brand = { $in: resolved };
  }

  const type = normalizeValue(source.type);
  if (type) {
    filter.type = type;
  }

  const slug = normalizeValue(source.slug);
  if (slug) {
    filter.slug = slug;
  }

  const did = normalizeValue(source.did);
  if (did) {
    filter.did = did;
  }

  // Price range filters
  const minPrice = Number(source.minPrice ?? source.min_price);
  const maxPrice = Number(source.maxPrice ?? source.max_price);

  if (!isNaN(minPrice) || !isNaN(maxPrice)) {
    const minVal = !isNaN(minPrice) ? minPrice : 0;
    const maxVal = !isNaN(maxPrice) ? maxPrice : Infinity;

    const priceConditions = [];

    // Simple products price filter
    const simpleOfferPriceCond = { $gt: 0, $ne: null, $gte: minVal };
    const simplePriceCond = { $gte: minVal };
    if (maxVal !== Infinity) {
      simpleOfferPriceCond.$lte = maxVal;
      simplePriceCond.$lte = maxVal;
    }

    const simpleCond = {
      type: "simple",
      $or: [
        { offerPrice: simpleOfferPriceCond },
        { $or: [{ offerPrice: null }, { offerPrice: 0 }], price: simplePriceCond }
      ]
    };
    priceConditions.push(simpleCond);

    // Variant products price filter
    const variantOfferPriceCond = { $gt: 0, $ne: null, $gte: minVal };
    const variantPriceCond = { $gte: minVal };
    if (maxVal !== Infinity) {
      variantOfferPriceCond.$lte = maxVal;
      variantPriceCond.$lte = maxVal;
    }

    const variantCond = {
      type: "variant",
      variants: {
        $elemMatch: {
          $or: [
            { offerPrice: variantOfferPriceCond },
            { $or: [{ offerPrice: null }, { offerPrice: 0 }], price: variantPriceCond }
          ]
        }
      }
    };
    priceConditions.push(variantCond);

    if (filter.$or) {
      filter.$and = [
        { $or: filter.$or },
        { $or: priceConditions }
      ];
      delete filter.$or;
    } else {
      filter.$or = priceConditions;
    }
  }

  return filter;
};

/**
 * Builds a Mongoose sort options object.
 * @param {string} sortBy - The field name to sort by.
 * @param {string} order - Sort order, either "asc" or "desc".
 * @returns {Object} The Mongoose sort configuration.
 */
export const buildProductSort = (sortBy = "createdAt", order = "desc") => {
  const field = SORT_FIELD_MAP[normalizeValue(sortBy)] || "createdAt";
  const direction = normalizeValue(order).toLowerCase() === "asc" ? 1 : -1;

  return { [field]: direction };
};

/**
 * Parses and validates offset (skip) and limit pagination parameters.
 * @param {Object} input - Pagination input parameters.
 * @returns {Object} An object containing parsed skip and limit.
 */
export const parsePagination = (input = {}) => {
  const skip = Math.max(0, parseInt(normalizeValue(input.skip ?? input.offset ?? 0), 10) || 0);
  const limit = Math.min(100, Math.max(1, parseInt(normalizeValue(input.limit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT));

  return { skip, limit };
};
