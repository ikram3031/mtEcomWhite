import { LogModel, LOG_TYPE_DIDS } from "../models/log.model.js";

/**
 * List active logs with pagination and search
 * GET /api/v1/logs
 */
export const listLogs = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit || "20", 10)));
    const skip = (page - 1) * limit;

    const filter = { active: true };

    if (req.query.type) {
      filter.type = req.query.type;
    }

    if (req.query.readStatus !== undefined) {
      filter.readStatus =
        req.query.readStatus === "true" || req.query.readStatus === true;
    }

    if (req.query.q) {
      const q = req.query.q.trim();
      filter.$or = [
        { description: { $regex: q, $options: "i" } },
        { createdBy: { $regex: q, $options: "i" } },
        { did: { $regex: q, $options: "i" } },
      ];
    }

    const [logs, total] = await Promise.all([
      LogModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      LogModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit) || 1;

    return res.json({
      status: true,
      data: logs.map((l) => ({ ...l, id: l._id?.toString?.() ?? l.id })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get top 5 newOrder notification logs and total unread count
 * GET /api/v1/logs/notifications
 */
export const getNotificationLogs = async (req, res, next) => {
  try {
    const filter = { active: true, type: "newOrder" };

    const [logs, unreadCount] = await Promise.all([
      LogModel.find(filter).sort({ createdAt: -1 }).limit(5).lean(),
      LogModel.countDocuments({ active: true, type: "newOrder", readStatus: false }),
    ]);

    return res.json({
      status: true,
      data: logs.map((l) => ({ ...l, id: l._id?.toString?.() ?? l.id })),
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new log entry
 * POST /api/v1/logs
 */
export const createLog = async (req, res, next) => {
  try {
    const { type = "created", description, readStatus = false } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({
        status: false,
        message: "Log description is required.",
      });
    }

    const typeDid = req.body.typeDid || LOG_TYPE_DIDS[type] || "110";
    const userDid = req.user?.did || req.body.createdBy || "system";

    const log = await LogModel.create({
      type,
      typeDid,
      description: description.trim(),
      readStatus: Boolean(readStatus),
      active: true,
      createdBy: userDid,
      updatedBy: userDid,
    });

    return res.status(201).json({
      status: true,
      data: log,
      message: "Log created successfully.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark logs as read (set readStatus: true)
 * PUT /api/v1/logs/mark-read
 */
export const markLogsRead = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const userDid = req.user?.did || "system";

    let filter = { active: true };
    if (Array.isArray(ids) && ids.length > 0) {
      filter._id = { $in: ids };
    } else {
      filter.type = "newOrder";
      filter.readStatus = false;
    }

    await LogModel.updateMany(filter, {
      $set: { readStatus: true, updatedBy: userDid },
    });

    return res.json({
      status: true,
      message: "Logs marked as read successfully.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark logs as unread (set readStatus: false)
 * PUT /api/v1/logs/mark-unread
 */
export const markLogsUnread = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const userDid = req.user?.did || "system";

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Array of log IDs is required.",
      });
    }

    await LogModel.updateMany(
      { _id: { $in: ids }, active: true },
      { $set: { readStatus: false, updatedBy: userDid } }
    );

    return res.json({
      status: true,
      message: "Logs marked as unread successfully.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Soft delete a single log
 * DELETE /api/v1/logs/:id
 */
export const deleteLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userDid = req.user?.did || "system";

    const log = await LogModel.findOneAndUpdate(
      { $or: [{ _id: id }, { did: id }] },
      { $set: { active: false, updatedBy: userDid } },
      { new: true }
    );

    if (!log) {
      return res.status(404).json({
        status: false,
        message: "Log not found.",
      });
    }

    return res.json({
      status: true,
      message: "Log deleted successfully.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Bulk soft delete logs
 * POST /api/v1/logs/bulk-delete
 */
export const bulkDeleteLogs = async (req, res, next) => {
  try {
    const { ids } = req.body;
    const userDid = req.user?.did || "system";

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        status: false,
        message: "Array of log IDs is required for bulk deletion.",
      });
    }

    await LogModel.updateMany(
      { _id: { $in: ids } },
      { $set: { active: false, updatedBy: userDid } }
    );

    return res.json({
      status: true,
      message: `${ids.length} logs deleted successfully.`,
    });
  } catch (err) {
    next(err);
  }
};
