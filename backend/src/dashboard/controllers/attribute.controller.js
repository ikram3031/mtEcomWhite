import { AttributeModel } from "../models/attribute.model.js";
import { logger } from "../../config/logger.js";

const sortAttributeValues = (values = []) => {
  if (!Array.isArray(values)) return [];
  return [...values].sort((a, b) => {
    const valA = typeof a === "string" ? a : (a?.name || a?.size || "");
    const valB = typeof b === "string" ? b : (b?.name || b?.size || "");
    return valA.localeCompare(valB, undefined, { numeric: true, sensitivity: "base" });
  });
};

/**
 * GET /api/v1/dashboard/attributes
 * Returns a list of all attribute groups.
 */
export const getAttributes = async (req, res) => {
  try {
    const attributes = await AttributeModel.find().lean();
    const sorted = attributes.map((attr) => ({
      ...attr,
      values: sortAttributeValues(attr.values || []),
    }));
    res.json({ status: "success", data: sorted });
  } catch (err) {
    logger.error({ err }, "Failed to fetch attributes");
    res.status(500).json({ status: "error", message: "Unable to fetch attributes" });
  }
};

/**
 * POST /api/v1/dashboard/attributes
 * Creates a new attribute group.
 */
export const createAttribute = async (req, res) => {
  try {
    const { name, slug, values } = req.body;
    if (!name || !slug) {
      return res.status(400).json({ status: "error", message: "Name and slug are required" });
    }

    const exists = await AttributeModel.findOne({ slug });
    if (exists) {
      return res.status(400).json({ status: "error", message: "Attribute slug already exists" });
    }

    const sortedValues = sortAttributeValues(values || []);

    const attribute = new AttributeModel({
      name,
      slug,
      values: sortedValues,
      createdBy: req.body.createdBy || req.user?._id || req.user?.id || "66af9b0d9c49d21c988a6d66",
    });

    await attribute.save();
    res.status(201).json({ status: "success", data: attribute });
  } catch (err) {
    logger.error({ err }, "Failed to create attribute");
    res.status(500).json({ status: "error", message: "Unable to create attribute" });
  }
};

/**
 * PUT /api/v1/dashboard/attributes/:id
 * Updates an existing attribute group.
 */
export const updateAttribute = async (req, res) => {
  const { id } = req.params;
  try {
    const { name, slug, values } = req.body;

    const attribute = await AttributeModel.findById(id);
    if (!attribute) {
      return res.status(404).json({ status: "error", message: "Attribute not found" });
    }

    if (name) attribute.name = name;
    if (slug) attribute.slug = slug;
    if (values !== undefined) {
      attribute.values = sortAttributeValues(values);
    }

    attribute.updatedBy = req.body.updatedBy || req.user?._id || req.user?.id || "66af9b0d9c49d21c988a6d66";
    await attribute.save();

    res.json({ status: "success", data: attribute });
  } catch (err) {
    logger.error({ err }, "Failed to update attribute");
    res.status(500).json({ status: "error", message: "Unable to update attribute" });
  }
};

/**
 * DELETE /api/v1/dashboard/attributes/:id
 * Deletes an attribute group.
 */
export const deleteAttribute = async (req, res) => {
  const { id } = req.params;
  try {
    const attribute = await AttributeModel.findByIdAndDelete(id);
    if (!attribute) {
      return res.status(404).json({ status: "error", message: "Attribute not found" });
    }
    res.json({ status: "success", message: "Attribute deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to delete attribute");
    res.status(500).json({ status: "error", message: "Unable to delete attribute" });
  }
};
