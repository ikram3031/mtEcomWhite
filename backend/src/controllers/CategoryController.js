import { CategoryModel } from "../models/category.model.js";
import { ProductModel } from "../models/product.model.js";
import { logger } from "../config/logger.js";
import { PLACEHOLDER_IMAGE_URL } from "../utils/productUtils.js";

/**
 * GET /api/v1/categories
 * Returns an array of all categories with live product counts.
 */
export const getAllCategories = async (req, res) => {
  try {
    const [categories, counts] = await Promise.all([
      CategoryModel.find()
        .populate({ path: "parent", select: "name slug" })
        .lean(),
      ProductModel.aggregate([
        { $match: { imageUrl: { $ne: PLACEHOLDER_IMAGE_URL } } },
        { $unwind: "$categories" },
        { $group: { _id: "$categories", count: { $sum: 1 } } }
      ])
    ]);

    const countMap = {};
    for (const c of counts) {
      countMap[c._id.toString()] = c.count;
    }

    const data = categories.map(cat => ({
      ...cat,
      product_count: countMap[cat._id?.toString()] || 0
    }));

    res.json({ status: "success", data });
  } catch (err) {
    logger.error({ err }, "Failed to fetch categories");
    res.status(500).json({ status: "error", message: "Unable to fetch categories" });
  }
}

/**
 * GET /api/v1/categories/:id
 * Returns a single category by its MongoDB ObjectId.
 */
// GET /categories/:id - একটি ক্যাটাগরির তথ্য দেখায়
export const getCategoryById = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await CategoryModel.findById(id)
      .populate({ path: "parent", select: "name slug" })
      .lean();
    if (!category) {
      return res.status(404).json({ status: "error", message: "Category not found" });
    }
    res.json({ status: "success", data: category });
  } catch (err) {
    logger.error({ err }, "Failed to fetch category by id");
    res.status(500).json({ status: "error", message: "Unable to fetch category" });
  }
}

/**
 * POST /api/v1/categories
 * Create a new category.
 */
// POST /categories - নতুন ক্যাটাগরি তৈরি করে
export const createCategory = async (req, res) => {
  try {
    const { name, slug, description, parent } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ status: "error", message: "Name and slug are required" });
    }

    const exists = await CategoryModel.findOne({ $or: [{ name }, { slug }] });
    if (exists) {
      return res.status(400).json({ status: "error", message: "Category name or slug already exists" });
    }

    let parentId = null;
    if (parent) {
      const parentCat = await CategoryModel.findOne({ $or: [{ _id: parent.match(/^[0-9a-fA-F]{24}$/) ? parent : null }, { slug: parent }, { did: parent }] });
      if (parentCat) parentId = parentCat._id;
    }

    const category = new CategoryModel({
      name,
      slug,
      description,
      parent: parentId,
      createdBy: req.body.createdBy || req.user?._id || req.user?.id || null,
    });

    await category.save();
    res.status(201).json({ status: "success", data: category });
  } catch (err) {
    logger.error({ err }, "Failed to create category");
    res.status(500).json({ status: "error", message: "Unable to create category" });
  }
}

/**
 * PUT /api/v1/categories/:id
 * Update an existing category by ID or slug/did.
 */
// PUT /categories/:id - ক্যাটাগরি আপডেট করে
export const updateCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const { name, slug, description, parent } = req.body;
    
    const category = await CategoryModel.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }, { did: id }] });
    if (!category) {
      return res.status(404).json({ status: "error", message: "Category not found" });
    }

    if (name) category.name = name;
    if (slug) category.slug = slug;
    if (description !== undefined) category.description = description;

    if (parent !== undefined) {
      let parentId = null;
      if (parent) {
        const parentCat = await CategoryModel.findOne({ $or: [{ _id: parent.match(/^[0-9a-fA-F]{24}$/) ? parent : null }, { slug: parent }, { did: parent }] });
        if (parentCat) parentId = parentCat._id;
      }
      category.parent = parentId;
    }

    category.updatedBy = req.body.updatedBy || req.user?._id || req.user?.id || null;
    await category.save();

    res.json({ status: "success", data: category });
  } catch (err) {
    logger.error({ err }, "Failed to update category");
    res.status(500).json({ status: "error", message: "Unable to update category" });
  }
}

/**
 * DELETE /api/v1/categories/:id
 * Delete a category by ID or slug/did.
 */
// DELETE /categories/:id - ক্যাটাগরি ডিলিট করে
export const deleteCategory = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await CategoryModel.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { slug: id }, { did: id }] });
    if (!category) {
      return res.status(404).json({ status: "error", message: "Category not found" });
    }

    await CategoryModel.deleteOne({ _id: category._id });
    res.json({ status: "success", message: "Category deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to delete category");
    res.status(500).json({ status: "error", message: "Unable to delete category" });
  }
}
