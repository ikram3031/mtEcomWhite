import { ProductModel } from "../models/product.model.js";
import { RecentSearchModel } from "../models/recentSearch.model.js";
import { PopularSearchModel } from "../models/popularSearch.model.js";
import { buildProductImageUrl } from "../utils/imageUrl.js";

/**
 * GET /api/v1/search?q=term&limit=12
 * Performs product search and asynchronously tracks search analytics
 */
export const searchProducts = async (req, res, next) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) {
      res.json({ data: [] });
      return;
    }

    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "12", 10)));
    const regex = { $regex: q, $options: "i" };

    const filter = {
      $or: [{ name: regex }, { "brand.name": regex }, { "categories.name": regex }],
    };

    const docs = await ProductModel.find(filter).limit(limit).lean();

    const results = docs.map((p) => {
      const category = Array.isArray(p.categories) && p.categories.length > 0 ? p.categories[0].name : null;
      const brand = p.brand?.name || null;
      const imageUrl = buildProductImageUrl(p.thumbnail?.url);

      return {
        id: p._id?.toString?.() ?? p.id,
        name: p.name,
        category,
        brand,
        image: imageUrl,
      };
    });

    res.json({ data: results });

    // Track search asynchronously in background
    trackSearchAsync(req, q);
  } catch (err) {
    next(err);
  }
};

/**
 * Asynchronously logs search terms for popular rankings and recent user history
 */
async function trackSearchAsync(req, searchString) {
  try {
    const cleanTerm = searchString.trim().toLowerCase();
    if (!cleanTerm || cleanTerm.length < 2) return;

    // 1. Increment popular search count
    await PopularSearchModel.findOneAndUpdate(
      { keyword: cleanTerm },
      { $inc: { count: 1 }, $set: { updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    // 2. Log user recent search if authenticated
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (userId) {
      // Remove any existing duplicate search term for user to push newest to top
      await RecentSearchModel.deleteMany({ userId, query: cleanTerm });
      await RecentSearchModel.create({ userId, query: cleanTerm, searchedAt: new Date() });

      // Cap user history at 10 items
      const userSearches = await RecentSearchModel.find({ userId }).sort({ searchedAt: -1 }).select("_id").lean();
      if (userSearches.length > 10) {
        const idsToRemove = userSearches.slice(10).map((doc) => doc._id);
        await RecentSearchModel.deleteMany({ _id: { $in: idsToRemove } });
      }
    }
  } catch (err) {
    // Non-blocking search telemetry failure
    console.error("Search tracking error:", err);
  }
}

/**
 * GET /api/v1/search/recent
 * Returns the recent searches for authenticated user
 */
export const getRecentSearches = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!userId) {
      res.json({ data: [] });
      return;
    }

    const items = await RecentSearchModel.find({ userId })
      .sort({ searchedAt: -1 })
      .limit(10)
      .select("query searchedAt")
      .lean();

    const data = items.map((item) => ({
      id: item._id,
      query: item.query,
      searchedAt: item.searchedAt,
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/v1/search/recent
 * Clears all or specific recent search item for authenticated user
 */
export const clearRecentSearches = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?.userId || req.user?._id;
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const queryToDelete = req.query.q ? String(req.query.q).trim().toLowerCase() : null;
    if (queryToDelete) {
      await RecentSearchModel.deleteMany({ userId, query: queryToDelete });
    } else {
      await RecentSearchModel.deleteMany({ userId });
    }

    res.json({ success: true, message: "Recent search history cleared" });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/v1/search/popular
 * Returns top popular search keywords globally
 */
export const getPopularSearches = async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit || "8", 10)));
    const items = await PopularSearchModel.find({})
      .sort({ count: -1, updatedAt: -1 })
      .limit(limit)
      .select("keyword count")
      .lean();

    const data = items.map((item) => ({
      keyword: item.keyword,
      count: item.count,
    }));

    res.json({ data });
  } catch (err) {
    next(err);
  }
};
