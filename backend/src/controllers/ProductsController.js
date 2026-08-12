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
    const imageUrl = rawImageUrl.trim();

    const productData = {
      name: body.name,
      slug: body.slug,
      description: body.description || body.name, // default description to name
      type: body.type || "simple",
      imageUrl,
      thumbnailUrl: body.thumbnailUrl || body.thumbnail_url || imageUrl,
      season: body.season || "All-Season",
      tags: Array.isArray(body.tags) ? body.tags : [],
      notes: Array.isArray(body.notes) ? body.notes : [],
      categories: categoryIds,
      brand: brandDids,
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

    // Pagination and sorting configuration
    const paginationSource =
      method === "POST" ? req.body || {} : req.query || {};
    const { skip, limit } = parsePagination(paginationSource);
    
    // For sorting, if using `sort=price_low_to_high` or `sortby`, parse it
    const sortByParam = paginationSource.sort || paginationSource.sortBy || paginationSource.sortby;
    let parsedSortBy = sortByParam;
    let parsedOrder = paginationSource.order;

    if (sortByParam === 'price_low_to_high') {
      parsedSortBy = 'price';
      parsedOrder = 'asc';
    } else if (sortByParam === 'price_high_to_low') {
      parsedSortBy = 'price';
      parsedOrder = 'desc';
    } else if (sortByParam === 'newest') {
      parsedSortBy = 'createdAt';
      parsedOrder = 'desc';
    }

    const sort = buildProductSort(parsedSortBy, parsedOrder);

    // Build query filter
    // Use the combined source from POST body or GET query
    const filterInput = method === "POST" ? req.body || {} : req.query || {};
    const filter = await buildProductFilter(filterInput);

    const [total, rows] = await Promise.all([
      ProductModel.countDocuments(filter),
      ProductModel.find(filter)
        .populate('categories', 'did name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;
    const currentPage = Math.floor(skip / limit) + 1;

    res.json({
      success: true,
      message: "Products retrieved successfully",
      meta: {
        total_products: total,
        current_page: currentPage,
        limit,
        total_pages: totalPages,
        has_next_page: currentPage < totalPages,
        has_prev_page: currentPage > 1
      },
      data: rows.map(serializeProduct),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * READ (SINGLE): Retrieves a single product by either ID or slug.
 * Path: GET /api/products/:identifier
 */
export const getSingleProduct = async (req, res, next) => {
  try {
    const identifier = req.params.identifier;
    const filter = Types.ObjectId.isValid(identifier)
      ? { $or: [{ _id: identifier }, { slug: identifier }] }
      : { slug: identifier };

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

    const filter = Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
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
