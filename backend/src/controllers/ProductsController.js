import { Types } from "mongoose";
import { ProductModel } from "../models/product.model.js";
import { CategoryModel } from "../models/category.model.js";
import { BrandModel } from "../models/brand.model.js";
import { UserModel } from "../models/user.model.js";
import {
  PLACEHOLDER_IMAGE_URL,
  serializeProduct,
  buildProductFilter,
  buildProductSort,
  parsePagination,
} from "../utils/productUtils.js";

// ==========================================
// CRUD ENDPOINTS
// ==========================================

/**
 * CREATE: Creates a new product.
 * Expects product information in req.body. Resolves categories, brand, user IDs, and structure.
 * Path: POST /api/products
 */
export const createProduct = async (req, res, next) => {
  try {
    const body = req.body || {};

    // Resolve createdBy user
    let userId = req.body.createdBy || req.user?.userId || req.user?.id;
    if (!userId) {
      const fallbackUser = await UserModel.findOne({
        role: { $in: ["Owner", "Admin"] },
      }).lean();
      if (fallbackUser) {
        userId = fallbackUser._id;
      } else {
        const anyUser = await UserModel.findOne().lean();
        if (anyUser) userId = anyUser._id;
      }
    }

    if (!userId) {
      res
        .status(400)
        .json({
          status: "error",
          message: "User is required to create a product",
        });
      return;
    }

    // Resolve Categories: convert array of IDs or slugs to ObjectIds
    let categoryIds = [];
    if (body.categories || body.category) {
      const catInput = body.categories || body.category;
      const catArray = Array.isArray(catInput) ? catInput : [catInput];
      for (const cat of catArray) {
        if (!cat) continue;
        if (Types.ObjectId.isValid(cat)) {
          categoryIds.push(cat);
        } else {
          const found = await CategoryModel.findOne({ slug: cat }).lean();
          if (found) categoryIds.push(found._id);
        }
      }
    }

    // Resolve Brand: convert array of slugs or IDs to brand DIDs
    let brandDids = [];
    if (body.brand || body.brands) {
      const brandInput = body.brand || body.brands;
      const brandArray = Array.isArray(brandInput) ? brandInput : [brandInput];
      for (const br of brandArray) {
        if (!br) continue;
        if (/^[0-9a-fA-F]{16}$/.test(br)) {
          brandDids.push(br);
        } else {
          const found = await BrandModel.findOne({ slug: br }).lean();
          if (found) brandDids.push(found.did);
        }
      }
    }

    // Validate image URL — must be a non-empty string
    const rawImageUrl = body.imageUrl || body.image_url;
    if (!rawImageUrl || !rawImageUrl.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Product image is required. Please upload an image before saving.",
      });
    }
    const rawGallery = body.images || body.galleryImages || body.gallery || [];
    const images = Array.isArray(rawGallery)
      ? rawGallery
          .map((item) => {
            if (typeof item === "string" && item.trim()) return item.trim();
            if (typeof item === "object" && item !== null) {
              const url = item.url || item.imageUrl || item.preview || "";
              return typeof url === "string" && url.trim() ? url.trim() : null;
            }
            return null;
          })
          .filter(Boolean)
      : [];

    const productData = {
      name: body.name,
      slug: body.slug,
      description: body.description || body.name, // default description to name
      longDescription: body.longDescription || "",
      chargeTax: Boolean(body.chargeTax),
      taxRate: body.taxRate !== undefined && body.taxRate !== null && body.taxRate !== "" ? Number(body.taxRate) : null,
      isActive: body.isActive !== undefined ? Boolean(body.isActive) : true,
      type: body.type || "simple",
      imageUrl,
      thumbnailUrl: body.thumbnailUrl || body.thumbnail_url || imageUrl,
      season: body.season || "",
      tags: Array.isArray(body.tags) ? body.tags : [],
      notes: Array.isArray(body.notes) ? body.notes : [],
      categories: categoryIds,
      brand: brandDids,
      images,
      stockStatus: body.stockStatus || "instock",
      createdBy: userId,
    };

    // Parse product configurations based on simple vs variant types
    if (body.type === "variant") {
      productData.variants = Array.isArray(body.variants)
        ? body.variants.map((v, i) => ({
          size: v.size,
          price: Number(v.price),
          offerPrice:
            v.offerPrice !== undefined && v.offerPrice !== null
              ? Number(v.offerPrice)
              : null,
          sku: v.sku || "",
          sortOrder: v.sortOrder !== undefined ? Number(v.sortOrder) : i,
          imageUrl: v.imageUrl || null,
        }))
        : [];
    } else {
      productData.price = Number(body.price || 0);
      productData.offerPrice =
        body.offerPrice !== undefined && body.offerPrice !== null
          ? Number(body.offerPrice)
          : null;
      productData.sku = body.sku || "";
    }

    if (body.metaData) {
      productData.metaData = {
        metaTitle: body.metaData.metaTitle || "",
        metaDescription: body.metaData.metaDescription || "",
        keywords: Array.isArray(body.metaData.keywords)
          ? body.metaData.keywords
          : [],
        ogImage: body.metaData.ogImage || "",
      };
    }

    const newProduct = await ProductModel.create(productData);
    res
      .status(201)
      .json({ status: "success", data: serializeProduct(newProduct) });
  } catch (err) {
    next(err);
  }
};

/**
 * READ (LIST): Lists products with filtering, search, sorting, and pagination.
 * Path: GET /api/products or POST /api/products/search (or query POST)
 */
export const listProducts = async (req, res, next) => {
  try {
    const method = (req.method || "GET").toUpperCase();

    const queryOptions = method === "POST" ? req.body : req.query;
    const filter = await buildProductFilter(queryOptions);
    const sort = buildProductSort(queryOptions);
    const { limit, skip } = parsePagination(queryOptions);

    const products = await ProductModel.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("categories")
      .lean();

    const count = await ProductModel.countDocuments(filter);

    res.json({
      status: "success",
      data: products.map(serializeProduct),
      pagination: {
        total: count,
        limit,
        skip,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * READ (SINGLE): Retrieves a single product details by MongoDB ID or slug.
 * Path: GET /api/products/:identifier
 */
export const getSingleProduct = async (req, res, next) => {
  try {
    const identifier = req.params.identifier;
    const filter = Types.ObjectId.isValid(identifier)
      ? { $or: [{ _id: identifier }, { slug: identifier }, { did: identifier }] }
      : { $or: [{ slug: identifier }, { did: identifier }] };

    const product = await ProductModel.findOne(filter).lean();

    if (!product) {
      res.status(404).json({ status: "error", message: "Product not found" });
      return;
    }

    res.json({ data: serializeProduct(product) });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE: Updates an existing product details by ID or slug.
 * Path: PUT /api/products/:id
 */
export const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const filter = Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { slug: id }, { did: id }] }
      : { $or: [{ slug: id }, { did: id }] };
    const product = await ProductModel.findOne(filter);
    if (!product) {
      res.status(404).json({ status: "error", message: "Product not found" });
      return;
    }

    // Resolve updatedBy user
    let userId = req.body.updatedBy || req.body.createdBy || req.user?.userId || req.user?.id;
    if (!userId) {
      const fallbackUser = await UserModel.findOne({
        role: { $in: ["Owner", "Admin"] },
      }).lean();
      if (fallbackUser) userId = fallbackUser._id;
    }

    // Validate image URL on update — must be a non-empty string if provided
    const incomingImageUrl = body.imageUrl || body.image_url;
    if (incomingImageUrl !== undefined && incomingImageUrl !== null && !incomingImageUrl.trim()) {
      return res.status(400).json({
        status: "error",
        message: "Product image is required. Please upload an image before saving.",
      });
    }

    // Update primitive properties
    if (body.name !== undefined) product.name = body.name;
    if (body.slug !== undefined) product.slug = body.slug;
    if (body.description !== undefined) product.description = body.description;
    if (body.longDescription !== undefined) product.longDescription = body.longDescription;
    if (body.chargeTax !== undefined) product.chargeTax = Boolean(body.chargeTax);
    if (body.taxRate !== undefined) product.taxRate = body.taxRate ? Number(body.taxRate) : null;
    if (body.isActive !== undefined) product.isActive = Boolean(body.isActive);
    if (body.metaData !== undefined) {
      product.metaData = {
        metaTitle: body.metaData.metaTitle || "",
        metaDescription: body.metaData.metaDescription || "",
        keywords: Array.isArray(body.metaData.keywords) ? body.metaData.keywords : [],
        ogImage: body.metaData.ogImage || "",
      };
    }
    if (body.type !== undefined) product.type = body.type;
    if (incomingImageUrl && incomingImageUrl.trim()) product.imageUrl = incomingImageUrl.trim();
    if (body.thumbnailUrl && body.thumbnailUrl.trim())
      product.thumbnailUrl = body.thumbnailUrl.trim();
    if (body.thumbnail_url && body.thumbnail_url.trim())
      product.thumbnailUrl = body.thumbnail_url.trim();
    if (body.season !== undefined) product.season = body.season;
    if (body.tags !== undefined) product.tags = body.tags;
    if (body.notes !== undefined) product.notes = body.notes;
    if (body.stockStatus !== undefined) product.stockStatus = body.stockStatus;

    // Update gallery images
    const rawGallery =
      body.images !== undefined
        ? body.images
        : body.galleryImages !== undefined
        ? body.galleryImages
        : body.gallery;

    if (rawGallery !== undefined) {
      product.images = Array.isArray(rawGallery)
        ? rawGallery
            .map((item) => {
              if (typeof item === "string" && item.trim()) return item.trim();
              if (typeof item === "object" && item !== null) {
                const url = item.url || item.imageUrl || item.preview || "";
                return typeof url === "string" && url.trim() ? url.trim() : null;
              }
              return null;
            })
            .filter(Boolean)
        : [];
    }

    if (userId) {
      product.updatedBy = userId;
    }

    // Update categories references
    if (body.categories !== undefined || body.category !== undefined) {
      const catInput =
        body.categories !== undefined ? body.categories : body.category;
      const catArray = Array.isArray(catInput) ? catInput : [catInput];
      let categoryIds = [];
      for (const cat of catArray) {
        if (!cat) continue;
        if (Types.ObjectId.isValid(cat)) {
          categoryIds.push(cat);
        } else {
          const found = await CategoryModel.findOne({ slug: cat }).lean();
          if (found) categoryIds.push(found._id);
        }
      }
      product.categories = categoryIds;
    }

    // Update brand references
    if (body.brand !== undefined || body.brands !== undefined) {
      const brandInput = body.brand !== undefined ? body.brand : body.brands;
      const brandArray = Array.isArray(brandInput) ? brandInput : [brandInput];
      let brandDids = [];
      for (const br of brandArray) {
        if (!br) continue;
        if (/^[0-9a-fA-F]{16}$/.test(br)) {
          brandDids.push(br);
        } else {
          const found = await BrandModel.findOne({ slug: br }).lean();
          if (found) brandDids.push(found.did);
        }
      }
      product.brand = brandDids;
    }

    // Adjust sub-structures (variant schema fields vs simple product fields)
    if (product.type === "variant") {
      if (body.variants !== undefined) {
        product.variants = Array.isArray(body.variants)
          ? body.variants.map((v, i) => ({
            size: v.size,
            price: Number(v.price),
            offerPrice:
              v.offerPrice !== undefined && v.offerPrice !== null
                ? Number(v.offerPrice)
                : null,
            sku: v.sku || "",
            sortOrder: v.sortOrder !== undefined ? Number(v.sortOrder) : i,
            imageUrl: v.imageUrl || null,
          }))
          : [];
      }
      product.price = undefined;
      product.offerPrice = undefined;
      product.sku = undefined;
    } else {
      if (body.price !== undefined) product.price = Number(body.price);
      if (body.offerPrice !== undefined)
        product.offerPrice =
          body.offerPrice !== null ? Number(body.offerPrice) : null;
      if (body.sku !== undefined) product.sku = body.sku;
      product.variants = undefined;
    }

    if (body.metaData !== undefined) {
      product.metaData = {
        metaTitle: body.metaData.metaTitle || "",
        metaDescription: body.metaData.metaDescription || "",
        keywords: Array.isArray(body.metaData.keywords)
          ? body.metaData.keywords
          : [],
        ogImage: body.metaData.ogImage || "",
      };
    }

    await product.save();
    res.json({ status: "success", data: serializeProduct(product) });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE: Deletes a product by ID or slug.
 * Path: DELETE /api/products/:id
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const filter = Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const result = await ProductModel.deleteOne(filter);
    if (result.deletedCount === 0) {
      res.status(404).json({ status: "error", message: "Product not found" });
      return;
    }
    res.json({ status: "success", message: "Product deleted successfully" });
  } catch (err) {
    next(err);
  }
};
