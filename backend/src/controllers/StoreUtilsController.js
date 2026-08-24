import { Types } from "mongoose";
import { StoreUtilsModel } from "../models/storeUtils.model.js";
import { ProductModel } from "../models/product.model.js";
import { serializeProduct } from "../utils/productUtils.js";

/**
 * READ: Retrieves the store utility showcases (featured and best seller products).
 * Path: GET /api/v1/store-utils
 */
export const getStoreUtils = async (req, res, next) => {
  try {
    let storeUtils = await StoreUtilsModel.findOne({ key: "default" })
      .populate({
        path: "featured",
        populate: { path: "categories" },
      })
      .populate({
        path: "bestSeller",
        populate: { path: "categories" },
      })
      .lean();

    if (!storeUtils) {
      storeUtils = await StoreUtilsModel.create({
        key: "default",
        featured: [],
        bestSeller: [],
      });
      storeUtils = storeUtils.toObject ? storeUtils.toObject() : storeUtils;
    }

    const featuredProducts = Array.isArray(storeUtils.featured)
      ? storeUtils.featured.filter(Boolean).map(serializeProduct)
      : [];

    const bestSellerProducts = Array.isArray(storeUtils.bestSeller)
      ? storeUtils.bestSeller.filter(Boolean).map(serializeProduct)
      : [];

    res.json({
      status: "success",
      data: {
        featured: featuredProducts,
        bestSeller: bestSellerProducts,
        updatedAt: storeUtils.updatedAt || null,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * UPDATE: Updates the store utility showcases with arrays of Product ObjectIDs.
 * Path: PUT /api/v1/store-utils
 */
export const updateStoreUtils = async (req, res, next) => {
  try {
    const body = req.body || {};
    const updateData = {};

    // Validate and sanitize featured product ObjectIDs
    if (body.featured !== undefined) {
      const rawFeatured = Array.isArray(body.featured)
        ? body.featured
        : [body.featured];

      const validFeaturedIds = rawFeatured
        .map((id) => (typeof id === "object" && id !== null ? id.id || id._id : id))
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      updateData.featured = validFeaturedIds;
    }

    // Validate and sanitize bestSeller product ObjectIDs
    if (body.bestSeller !== undefined || body.best_seller !== undefined) {
      const rawBestSeller =
        body.bestSeller !== undefined ? body.bestSeller : body.best_seller;
      const rawBestSellerArr = Array.isArray(rawBestSeller)
        ? rawBestSeller
        : [rawBestSeller];

      const validBestSellerIds = rawBestSellerArr
        .map((id) => (typeof id === "object" && id !== null ? id.id || id._id : id))
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      updateData.bestSeller = validBestSellerIds;
    }

    if (req.user?.userId || req.user?.id) {
      updateData.updatedBy = req.user.userId || req.user.id;
    }

    const updatedDoc = await StoreUtilsModel.findOneAndUpdate(
      { key: "default" },
      { $set: updateData },
      { new: true, upsert: true }
    )
      .populate({
        path: "featured",
        populate: { path: "categories" },
      })
      .populate({
        path: "bestSeller",
        populate: { path: "categories" },
      })
      .lean();

    const featuredProducts = Array.isArray(updatedDoc.featured)
      ? updatedDoc.featured.filter(Boolean).map(serializeProduct)
      : [];

    const bestSellerProducts = Array.isArray(updatedDoc.bestSeller)
      ? updatedDoc.bestSeller.filter(Boolean).map(serializeProduct)
      : [];

    res.json({
      status: "success",
      message: "Store utilities updated successfully",
      data: {
        featured: featuredProducts,
        bestSeller: bestSellerProducts,
        updatedAt: updatedDoc.updatedAt || null,
      },
    });
  } catch (err) {
    next(err);
  }
};
