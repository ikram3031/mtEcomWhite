import { SizeChartModel } from "../models/sizeChart.model.js";
import { CategoryModel } from "../models/category.model.js";
import { logger } from "../config/logger.js";

// Fetches and returns all configured category size charts
export const getAllSizeCharts = async (req, res) => {
  try {
    const sizeCharts = await SizeChartModel.find()
      .populate({
        path: "category",
        select: "name slug did imageUrl parent",
      })
      .populate({
        path: "attributeId",
        select: "name slug values",
      })
      .lean();

    res.json({ status: "success", data: sizeCharts });
  } catch (err) {
    logger.error({ err }, "Failed to fetch size charts");
    res.status(500).json({ status: "error", message: "Unable to fetch size charts" });
  }
};

// Fetches and returns a specific size chart by parent category identifier
export const getSizeChartByCategory = async (req, res) => {
  const { categoryId } = req.params;
  try {
    const category = await CategoryModel.findOne({
      $or: [
        { _id: categoryId.match(/^[0-9a-fA-F]{24}$/) ? categoryId : null },
        { slug: categoryId },
        { did: categoryId },
      ],
    }).lean();

    if (!category) {
      return res.status(404).json({ status: "error", message: "Category not found" });
    }

    const sizeChart = await SizeChartModel.findOne({ category: category._id })
      .populate({
        path: "category",
        select: "name slug did imageUrl parent",
      })
      .populate({
        path: "attributeId",
        select: "name slug values",
      })
      .lean();

    if (!sizeChart) {
      return res.status(404).json({ status: "error", message: "Size chart not configured for this category" });
    }

    res.json({ status: "success", data: sizeChart });
  } catch (err) {
    logger.error({ err }, "Failed to fetch size chart by category");
    res.status(500).json({ status: "error", message: "Unable to fetch size chart" });
  }
};

// Creates or updates a parent category size chart specification
export const upsertSizeChart = async (req, res) => {
  try {
    const {
      categoryId,
      category: rawCategory,
      attributeId,
      attributeName = "Size",
      columns = [],
      rows = [],
      unit = "inches",
    } = req.body;

    const targetCatIdentifier = categoryId || rawCategory;
    if (!targetCatIdentifier) {
      return res.status(400).json({ status: "error", message: "Category identifier is required" });
    }

    const category = await CategoryModel.findOne({
      $or: [
        { _id: targetCatIdentifier.match(/^[0-9a-fA-F]{24}$/) ? targetCatIdentifier : null },
        { slug: targetCatIdentifier },
        { did: targetCatIdentifier },
      ],
    });

    if (!category) {
      return res.status(404).json({ status: "error", message: "Target category not found" });
    }

    const cleanedColumns = Array.isArray(columns)
      ? columns.map((col) => (typeof col === "string" ? col.trim() : col?.name || col?.label || "")).filter(Boolean)
      : [];

    const cleanedRows = Array.isArray(rows)
      ? rows.map((row) => ({
          size: typeof row.size === "string" ? row.size.trim() : String(row.size || ""),
          values: row.values && typeof row.values === "object" ? row.values : {},
        }))
      : [];

    const userId = req.user?._id || req.user?.id || null;

    const updatedChart = await SizeChartModel.findOneAndUpdate(
      { category: category._id },
      {
        $set: {
          category: category._id,
          categorySlug: category.slug,
          attributeId: attributeId || null,
          attributeName: attributeName || "Size",
          columns: cleanedColumns,
          rows: cleanedRows,
          unit: unit || "inches",
          updatedBy: userId,
        },
        $setOnInsert: {
          createdBy: userId,
        },
      },
      { upsert: true, new: true, runValidators: true }
    )
      .populate({
        path: "category",
        select: "name slug did imageUrl parent",
      })
      .populate({
        path: "attributeId",
        select: "name slug values",
      });

    res.status(200).json({ status: "success", data: updatedChart });
  } catch (err) {
    logger.error({ err }, "Failed to save size chart");
    res.status(500).json({ status: "error", message: "Unable to save size chart" });
  }
};

// Deletes a category size chart by its record ID or category ID
export const deleteSizeChart = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await SizeChartModel.findOneAndDelete({
      $or: [
        { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { category: id.match(/^[0-9a-fA-F]{24}$/) ? id : null },
        { categorySlug: id },
      ],
    });

    if (!deleted) {
      return res.status(404).json({ status: "error", message: "Size chart not found" });
    }

    res.json({ status: "success", message: "Size chart deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to delete size chart");
    res.status(500).json({ status: "error", message: "Unable to delete size chart" });
  }
};
