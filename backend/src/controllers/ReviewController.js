import { ReviewModel } from "../models/review.model.js";
import { ProductModel } from "../models/product.model.js";
import { MemberModel } from "../models/member.model.js";
import { logger } from "../config/logger.js";
import { USER_ROLES } from "../models/user.model.js";

/**
 * POST /api/reviews
 * Create a new review (Authenticated Member only)
 */
export const createReview = async (req, res) => {
  try {
    const { productDid, rating, description } = req.body;
    const memberDid = req.user.did;

    if (!productDid || !rating || !description) {
      return res.status(400).json({ status: "error", message: "productDid, rating, and description are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ status: "error", message: "Rating must be between 1 and 5" });
    }

    // Check if product exists
    const product = await ProductModel.findOne({ did: productDid });
    if (!product) {
      return res.status(404).json({ status: "error", message: "Product not found" });
    }

    // Check duplicate review policy
    const existingReview = await ReviewModel.findOne({ productDid, memberDid });
    if (existingReview) {
      return res.status(409).json({ status: "error", message: "You have already reviewed this product" });
    }

    // Ensure member exists
    const member = await MemberModel.findOne({ did: memberDid });
    if (!member) {
      return res.status(404).json({ status: "error", message: "Member not found" });
    }

    const review = new ReviewModel({
      productDid,
      productId: product._id,
      memberDid,
      memberId: member._id,
      description,
      rating,
      isApproved: false, // Default is pending approval
      createdBy: member._id,
      createdByType: "Member",
    });

    await review.save();
    return res.status(201).json({ status: "success", data: review, message: "Review submitted successfully and is pending approval." });
  } catch (err) {
    logger.error({ err }, "Failed to create review");
    return res.status(500).json({ status: "error", message: "Unable to create review" });
  }
};

/**
 * GET /api/reviews/product/:productDid
 * Public API to fetch approved reviews and statistics for a specific product
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productDid } = req.params;
    const skip = parseInt(req.query.skip, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 10;

    // Fetch approved reviews
    const reviews = await ReviewModel.find({ productDid, isApproved: true })
      .populate("memberId", "name did email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ReviewModel.countDocuments({ productDid, isApproved: true });

    // Aggregate statistics
    const statsResult = await ReviewModel.aggregate([
      { $match: { productDid, isApproved: true } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          count5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          count4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          count3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          count2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          count1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
        }
      }
    ]);

    let stats = {
      totalReviews: total,
      averageRating: 0,
      ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    };

    if (statsResult.length > 0) {
      const data = statsResult[0];
      stats.averageRating = Number(data.averageRating.toFixed(2));
      stats.ratingBreakdown = {
        5: data.count5,
        4: data.count4,
        3: data.count3,
        2: data.count2,
        1: data.count1
      };
    }

    return res.json({
      status: "success",
      data: {
        stats,
        reviews,
        pagination: { skip, limit, total }
      }
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch product reviews");
    return res.status(500).json({ status: "error", message: "Unable to fetch product reviews" });
  }
};

/**
 * GET /api/reviews
 * Admin API to list all reviews with filtering
 */
export const listReviews = async (req, res) => {
  try {
    const skip = parseInt(req.query.skip, 10) || 0;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { isApproved, productDid, memberDid } = req.query;

    let query = {};
    if (isApproved !== undefined) query.isApproved = isApproved === "true";
    if (productDid) query.productDid = productDid;
    if (memberDid) query.memberDid = memberDid;

    const reviews = await ReviewModel.find(query)
      .populate("memberId", "name email phone did")
      .populate("productId", "name slug imageUrl")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await ReviewModel.countDocuments(query);

    return res.json({ status: "success", data: reviews, pagination: { skip, limit, total } });
  } catch (err) {
    logger.error({ err }, "Failed to list reviews");
    return res.status(500).json({ status: "error", message: "Unable to list reviews" });
  }
};

/**
 * GET /api/reviews/:id
 * Get single review by id or did
 */
export const getReviewById = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await ReviewModel.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { did: id }] })
      .populate("memberId", "name email did")
      .populate("productId", "name slug")
      .lean();

    if (!review) return res.status(404).json({ status: "error", message: "Review not found" });

    return res.json({ status: "success", data: review });
  } catch (err) {
    logger.error({ err }, "Failed to fetch review");
    return res.status(500).json({ status: "error", message: "Unable to fetch review" });
  }
};

/**
 * PUT /api/reviews/:id
 * Update review (Member can update own review if not approved; Admin can update any review)
 */
export const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, description, isApproved } = req.body;
    
    const review = await ReviewModel.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { did: id }] });
    if (!review) return res.status(404).json({ status: "error", message: "Review not found" });

    const userRole = typeof req.user.role === "string" ? req.user.role.toLowerCase() : "";
    const isAdmin = ["owner", "admin", "manager", "super admin"].includes(userRole);
    
    // Member authorization check
    if (!isAdmin) {
      if (req.user.did !== review.memberDid) {
        return res.status(403).json({ status: "error", message: "Forbidden: You can only edit your own reviews" });
      }
      
      // Member cannot edit if already approved
      if (review.isApproved) {
        return res.status(403).json({ status: "error", message: "You cannot edit a review that has already been approved" });
      }
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) return res.status(400).json({ status: "error", message: "Rating must be between 1 and 5" });
      review.rating = rating;
    }
    if (description !== undefined) review.description = description;
    
    // Admin can update approval status through this route as well
    if (isAdmin && isApproved !== undefined) {
      review.isApproved = isApproved;
    }

    review.updatedBy = req.user._id || req.user.id;
    review.updatedByType = isAdmin ? "User" : "Member";

    await review.save();
    return res.json({ status: "success", data: review });
  } catch (err) {
    logger.error({ err }, "Failed to update review");
    return res.status(500).json({ status: "error", message: "Unable to update review" });
  }
};

/**
 * PATCH /api/reviews/:id/status
 * Admin toggle approval
 */
export const updateReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isApproved } = req.body;

    if (isApproved === undefined) {
      return res.status(400).json({ status: "error", message: "isApproved is required" });
    }

    const review = await ReviewModel.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { did: id }] });
    if (!review) return res.status(404).json({ status: "error", message: "Review not found" });

    review.isApproved = Boolean(isApproved);
    review.updatedBy = req.user._id || req.user.id;
    review.updatedByType = "User"; // Only admins use this route

    await review.save();
    return res.json({ status: "success", data: review, message: "Review status updated successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to update review status");
    return res.status(500).json({ status: "error", message: "Unable to update review status" });
  }
};

/**
 * DELETE /api/reviews/:id
 * Delete review (Member can delete own, Admin can delete any)
 */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    
    const review = await ReviewModel.findOne({ $or: [{ _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }, { did: id }] });
    if (!review) return res.status(404).json({ status: "error", message: "Review not found" });

    const userRole = typeof req.user.role === "string" ? req.user.role.toLowerCase() : "";
    const isAdmin = ["owner", "admin", "manager", "super admin"].includes(userRole);
    
    // Member authorization check
    if (!isAdmin && req.user.did !== review.memberDid) {
      return res.status(403).json({ status: "error", message: "Forbidden: You can only delete your own reviews" });
    }

    await ReviewModel.deleteOne({ _id: review._id });
    return res.json({ status: "success", message: "Review deleted successfully" });
  } catch (err) {
    logger.error({ err }, "Failed to delete review");
    return res.status(500).json({ status: "error", message: "Unable to delete review" });
  }
};
