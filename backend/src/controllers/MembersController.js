import mongoose from "mongoose";
import { MemberModel } from "../models/member.model.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { sendOtpEmail } from "../utils/otpDelivery.js";
import {
  sanitizeInfo,
  validateAddressPayload,
  validateMemberPayload,
} from "../helper/memberControllerHelper.js";

const { Types } = mongoose;

const createAccessToken = (member) => {
  return jwt.sign(
    { userId: member.id },
    env.ACCESS_TOKEN_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN || "20m" },
  );
};

const createRefreshToken = () => {
  return crypto.randomBytes(48).toString("hex");
};

const issueMemberTokens = async (member) => {
  const refreshToken = createRefreshToken();
  const refreshTokenExpiresAt = new Date(
    Date.now() + (env.REFRESH_TOKEN_EXPIRES_MS || 30 * 24 * 60 * 60 * 1000),
  );

  member.refreshToken = refreshToken;
  member.refreshTokenExpiresAt = refreshTokenExpiresAt;
  await member.save();

  return {
    accessToken: createAccessToken(member),
    accessTokenExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN || "20m",
    refreshToken,
    refreshTokenExpiresAt: refreshTokenExpiresAt.toISOString(),
  };
};

// List members with search, pagination, and optional segment filtering.
export const listMembers = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.max(1, parseInt(req.query.limit || '15', 10));
    
    const filter = {};
    
    if (req.query.q) {
      const searchRegex = new RegExp(req.query.q.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex }
      ];
    }
    
    if (req.query.segment && req.query.segment !== 'All') {
      filter.segment = req.query.segment;
    }
    
    const total = await MemberModel.countDocuments(filter);
    const members = await MemberModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
      
    res.json({
      status: "success",
      data: members,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Fetch one member record by Mongo ObjectId.
export const getMemberById = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    if (!Types.ObjectId.isValid(memberId)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid member ID" });
    }

    const member = await MemberModel.findById(memberId).lean();
    if (!member) {
      return res
        .status(404)
        .json({ status: "error", message: "Member not found" });
    }

    res.json({ status: "success", data: member });
  } catch (error) {
    next(error);
  }
};

// Delete a member record after validating the request id.
export const deleteMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    if (!Types.ObjectId.isValid(memberId)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid member ID" });
    }

    const member = await MemberModel.findByIdAndDelete(memberId).lean();
    if (!member) {
      return res
        .status(404)
        .json({ status: "error", message: "Member not found" });
    }

    res.json({ status: "success", message: "Member deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// Create a new member and persist its sanitized billing/shipping address data.
export const createMember = async (req, res, next) => {
  try {
    const payload = req.body ?? {};
    const validationErrors = validateMemberPayload(
      payload,
      payload.billingInfo,
      payload.shippingInfo,
    );
    if (validationErrors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid member payload",
        errors: validationErrors,
      });
    }

    const existing = await MemberModel.findOne({
      email: payload.email.toLowerCase().trim(),
    });
    if (existing) {
      return res.status(409).json({
        status: "error",
        message: "A member with this email already exists",
      });
    }

    const member = await MemberModel.create({
      name: payload.name.trim(),
      email: payload.email.toLowerCase().trim(),
      phone: payload.phone.trim(),
      passwordHash: await hashPassword(payload.password),
      billingInfo: sanitizeInfo(payload.billingInfo),
      shippingInfo: sanitizeInfo(payload.shippingInfo),
      createdBy: payload.createdBy || req.user?.userId || req.user?.id || null,
    });

    res.status(201).json({ status: "success", data: member });
  } catch (error) {
    next(error);
  }
};

// Update a member profile and persist any valid address changes.
export const updateMember = async (req, res, next) => {
  try {
    const { memberId } = req.params;
    if (!Types.ObjectId.isValid(memberId)) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid member ID" });
    }

    const payload = req.body ?? {};
    const updates = {};
    // Fixed typo: was `re.user?._id` — should be `req.user?._id`
    updates.updatedBy = payload.updatedBy || req.user?.userId || req.user?._id || req.user?.did || null;

    if (payload.name) {
      updates.name = payload.name.trim();
    }
    if (payload.email) {
      updates.email = payload.email.toLowerCase().trim();
    }
    if (payload.phone !== undefined) {
      const trimmedPhone = typeof payload.phone === "string" ? payload.phone.trim() : "";
      if (trimmedPhone) {
        if (!/^\+8801[3-9]\d{8}$/.test(trimmedPhone)) {
          return res.status(400).json({
            status: "error",
            message: "phone must be a valid Bangladeshi number in format +8801[3-9]XXXXXXXXX",
          });
        }
        // Check uniqueness excluding the current member being updated
        const existingPhoneMember = await MemberModel.findOne({
          phone: trimmedPhone,
          _id: { $ne: memberId },
        }).lean();
        if (existingPhoneMember) {
          return res.status(409).json({
            status: "error",
            message: "A member with this phone number already exists",
          });
        }
      }
      updates.phone = trimmedPhone;
    }
    if (payload.password) {
      if (typeof payload.password !== "string" || payload.password.length < 6) {
        return res.status(400).json({
          status: "error",
          message: "password must be at least 6 characters",
        });
      }
      updates.passwordHash = await hashPassword(payload.password);
    }

    // Accept both billingInfo (legacy frontend key) and billingAddress (model key)
    const billingPayload = payload.billingAddress ?? payload.billingInfo;
    if (billingPayload !== undefined) {
      const billingErrors = validateAddressPayload(billingPayload, "billingAddress");
      if (billingErrors.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Invalid billing information",
          errors: billingErrors,
        });
      }
      updates.billingAddress = sanitizeInfo(billingPayload);
    }

    // Accept both shippingInfo (legacy frontend key) and shippingAddress (model key)
    const shippingPayload = payload.shippingAddress ?? payload.shippingInfo;
    if (shippingPayload !== undefined) {
      const shippingErrors = validateAddressPayload(shippingPayload, "shippingAddress");
      if (shippingErrors.length > 0) {
        return res.status(400).json({
          status: "error",
          message: "Invalid shipping information",
          errors: shippingErrors,
        });
      }
      updates.shippingAddress = sanitizeInfo(shippingPayload);
    }

    const member = await MemberModel.findByIdAndUpdate(memberId, updates, {
      new: true,
      runValidators: true,
    }).lean();
    if (!member) {
      return res
        .status(404)
        .json({ status: "error", message: "Member not found" });
    }

    res.json({ status: "success", data: member });
  } catch (error) {
    next(error);
  }
};


// Start member registration by validating the payload and sending a verification OTP.
export const registerMember = async (req, res, next) => {
  try {
    const { name, email, password, phone, role } = req.body ?? {};

    const trimmedName = typeof name === "string" ? name.trim() : "";
    const trimmedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";
    const trimmedPassword = typeof password === "string" ? password : "";
    const trimmedPhone = typeof phone === "string" ? phone.trim() : "";
    const trimmedRole = typeof role === "string" ? role.trim() : "";

    const errors = [];
    if (!trimmedName) {
      errors.push("name is required");
    }
    if (!trimmedEmail) {
      errors.push("email is required");
    }
    if (trimmedPhone && !/^\+8801[3-9]\d{8}$/.test(trimmedPhone)) {
      // Enforce Bangladeshi number format as a backend gatekeep if provided
      errors.push("phone must be a valid Bangladeshi number in format +8801[3-9]XXXXXXXXX");
    }
    if (!trimmedPassword || trimmedPassword.length < 6) {
      errors.push("password is required and must be at least 6 characters");
    }

    if (errors.length > 0) {
      return res.status(400).json({
        status: "error",
        message: "Invalid registration payload",
        errors,
      });
    }

    const existingMember = await MemberModel.findOne({
      email: trimmedEmail,
    }).select("+emailOtp");
    if (existingMember) {
      return res.status(409).json({
        status: "error",
        message: "A member with this email already exists",
      });
    }

    // Only check phone uniqueness if a phone was provided
    if (trimmedPhone) {
      const existingPhoneMember = await MemberModel.findOne({ phone: trimmedPhone }).lean();
      if (existingPhoneMember) {
        return res.status(409).json({
          status: "error",
          message: "A member with this phone number already exists",
        });
      }
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    let member;
    try {
      member = await MemberModel.create({
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        passwordHash: await hashPassword(trimmedPassword),
        role: trimmedRole || "Customer",
        emailOtp: otp,
        emailOtpExpiresAt: otpExpires,
        billingInfo: sanitizeInfo(req.body?.billingInfo),
        shippingInfo: sanitizeInfo(req.body?.shippingInfo),
      });

      const emailResult = await sendOtpEmail({
        toEmail: member.email,
        otp,
        name: member.name,
        type: "registration",
      });

      if (!emailResult.delivered) {
        if (member?.id) {
          await MemberModel.findByIdAndDelete(member.id);
        }
        logger.warn(
          { email: trimmedEmail, reason: emailResult.reason },
          "OTP delivery failed during registration",
        );
        return res.status(500).json({
          status: "error",
          message: emailResult.reason || "Failed to send OTP email",
        });
      }
    } catch (emailError) {
      if (member?.id) {
        await MemberModel.findByIdAndDelete(member.id);
      }
      logger.error(
        { error: emailError, email: trimmedEmail },
        "Failed to send OTP email during registration",
      );
      return res
        .status(500)
        .json({ status: "error", message: "Failed to send OTP email" });
    }

    console.log(`Generated registration OTP for ${trimmedEmail}: ${otp}`);

    return res.status(201).json({
      status: "success",
      message: "An OTP to verify your account has been sent to your email.",
      data: {
        id: member.id,
        email: member.email,
        expiresAt: otpExpires.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify a registration OTP and mark the member email as confirmed.
export const verifyMemberOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body ?? {};
    const trimmedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";
    const trimmedOtp = typeof otp === "string" ? otp.trim() : "";

    if (!trimmedEmail || !trimmedOtp) {
      return res
        .status(400)
        .json({ status: "error", message: "Email and otp are required" });
    }

    const member = await MemberModel.findOne({
      email: trimmedEmail,
      emailOtp: trimmedOtp,
    }).select("+passwordHash +emailOtp +emailOtpExpiresAt");
    if (
      !member ||
      !member.emailOtpExpiresAt ||
      member.emailOtpExpiresAt < new Date()
    ) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid or expired OTP" });
    }

    if (!member.isEmailVerified) {
      if (req.body.context === "register") {
        member.emailOtp = undefined;
        member.emailOtpExpiresAt = undefined;
        member.isEmailVerified = true;
        member.emailVerifiedAt = new Date();
        await member.save();

        const tokenBundle = await issueMemberTokens(member);

        return res.json({
          status: "success",
          message: "Verified successfully",
          isEmailVerified: true,
          data: {
            user: {
              id: member.id,
              did: member.did,
              name: member.name,
              email: member.email,
              phone: member.phone,
              role: member.role,
            },
            ...tokenBundle,
          },
        });
      }

      return res.json({
        status: "success",
        requiresPasswordReset: true,
        message: "OTP verified successfully. Please reset your password to activate your account.",
        data: {
          email: member.email,
          otp: trimmedOtp,
        },
      });
    }

    member.emailOtp = undefined;
    member.emailOtpExpiresAt = undefined;
    member.isEmailVerified = true;
    member.emailVerifiedAt = new Date();
    await member.save();

    res.json({
      status: "success",
      message: "Verified successfully",
      isEmailVerified: true,
      data: {
        user: {
          id: member.id,
          did: member.did,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// Rotate a member refresh token and issue a fresh access token pair.
export const refreshMemberToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body ?? {};

    if (!refreshToken) {
      return res.status(400).json({
        status: "error",
        message: "refreshToken is required",
      });
    }

    const member = await MemberModel.findOne({ refreshToken }).select(
      "+refreshToken +refreshTokenExpiresAt",
    );
    if (!member || !member.refreshTokenExpiresAt || member.refreshTokenExpiresAt < new Date()) {
      return res.status(401).json({
        status: "error",
        message: "Invalid or expired refresh token",
      });
    }

    const tokenBundle = await issueMemberTokens(member);

    return res.json({
      status: "success",
      data: {
        ...tokenBundle,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Clear the stored refresh token so the member session can no longer be rotated.
export const logoutMember = async (req, res, next) => {
  try {
    const { refreshToken } = req.body ?? {};

    if (!refreshToken) {
      return res.status(400).json({
        status: "error",
        message: "refreshToken is required",
      });
    }

    const member = await MemberModel.findOne({ refreshToken }).select(
      "+refreshToken +refreshTokenExpiresAt",
    );
    if (member) {
      member.refreshToken = undefined;
      member.refreshTokenExpiresAt = undefined;
      await member.save();
    }

    return res.json({
      status: "success",
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Check if member email exists and is verified. Sends OTP if unverified.
export const checkMemberEmail = async (req, res, next) => {
  try {
    const { email } = req.body ?? {};
    const normalizedEmail = typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!normalizedEmail) {
      return res.status(400).json({ status: "error", message: "Email is required" });
    }

    // Lookup member by email and select OTP fields
    const member = await MemberModel.findOne({ email: normalizedEmail }).select("+emailOtp +emailOtpExpiresAt");
    if (!member) {
      return res.status(404).json({ status: "error", message: "No member account found with this email" });
    }

    // If migrated user or unverified email, generate and send verification OTP
    if (!member.isEmailVerified) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const otpExpires = new Date(Date.now() + 3 * 60 * 1000); // 3 minutes expiration

      member.emailOtp = otp;
      member.emailOtpExpiresAt = otpExpires;
      await member.save();

      // Dispatch verification email containing the 6-digit OTP
      const emailResult = await sendOtpEmail({
        toEmail: member.email,
        otp,
        name: member.name,
        type: "registration",
      });

      if (!emailResult.delivered) {
        logger.error({ email: normalizedEmail, reason: emailResult.reason }, "Failed to send verification OTP email");
        return res.status(500).json({ status: "error", message: emailResult.reason || "Failed to send verification OTP email" });
      }

      console.log(`Generated login verification OTP for unverified user ${normalizedEmail}: ${otp}`);

      return res.status(200).json({
        status: "success",
        requiresOtp: true,
        isEmailVerified: false,
        message: "Your email is not verified. A verification code has been sent to your email.",
        data: {
          email: member.email,
          expiresAt: otpExpires.toISOString(),
        },
      });
    }

    // Email is verified, user can proceed to password input step
    return res.status(200).json({
      status: "success",
      requiresOtp: false,
      isEmailVerified: true,
      message: "Email is verified. Please enter your password.",
    });
  } catch (error) {
    next(error);
  }
};

// Authenticate a member and issue new access and refresh tokens.
export const loginMember = async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {};
    const normalizedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!normalizedEmail || !password) {
      return res
        .status(400)
        .json({ status: "error", message: "Email and password are required" });
    }

    const member = await MemberModel.findOne({ email: normalizedEmail }).select(
      "+passwordHash",
    );
    if (!member) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }

    // If email is not verified, skip password check and send OTP for verification
    if (
      member.isEmailVerified === false ||
      member.isEmailVerified === null ||
      member.isEmailVerified === undefined
    ) {
      const otp = String(Math.floor(100000 + Math.random() * 900000));
      const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

      member.emailOtp = otp;
      member.emailOtpExpiresAt = otpExpires;
      await member.save();

      const emailResult = await sendOtpEmail({
        toEmail: member.email,
        otp,
        name: member.name,
        type: "registration",
      });

      if (!emailResult.delivered) {
        logger.error(
          { email: normalizedEmail, reason: emailResult.reason },
          "Failed to send verification OTP email during unverified login attempt",
        );
        return res
          .status(500)
          .json({ status: "error", message: emailResult.reason || "Verification required, but failed to send OTP email" });
      }

      console.log(`Generated login verification OTP for unverified user ${normalizedEmail}: ${otp}`);

      return res.status(200).json({
        status: "success",
        requiresOtp: true,
        isEmailVerified: false,
        message: "Your email is not verified. A verification code has been sent to your email.",
        data: {
          email: member.email,
          expiresAt: otpExpires.toISOString(),
        },
      });
    }

    // Email verified — validate password
    if (!member.passwordHash) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }

    const isPasswordValid = await comparePassword(
      password,
      member.passwordHash,
    );
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ status: "error", message: "Invalid credentials" });
    }

    const tokenBundle = await issueMemberTokens(member);

    res.json({
      status: "success",
      isEmailVerified: true,
      data: {
        user: {
          id: member.id,
          did: member.did,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
        },
        ...tokenBundle,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Resend a fresh member verification OTP to the registered email.
export const resendMemberOtp = async (req, res, next) => {
  try {
    const { email } = req.body ?? {};
    const trimmedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!trimmedEmail) {
      return res
        .status(400)
        .json({ status: "error", message: "Email is required" });
    }

    const member = await MemberModel.findOne({ email: trimmedEmail }).select(
      "+emailOtp +emailOtpExpiresAt",
    );
    if (!member) {
      return res
        .status(404)
        .json({ status: "error", message: "No member found with this email" });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    member.emailOtp = otp;
    member.emailOtpExpiresAt = otpExpires;
    await member.save();

    const emailResult = await sendOtpEmail({
      toEmail: member.email,
      otp,
      name: member.name,
      type: "registration",
    });

    if (!emailResult.delivered) {
      logger.error(
        { email: trimmedEmail, reason: emailResult.reason },
        "Failed to resend OTP email",
      );
      return res
        .status(500)
        .json({ status: "error", message: emailResult.reason || "Failed to send OTP email" });
    }

    console.log(`Resend OTP for ${trimmedEmail}: ${otp}`);

    res.json({
      status: "success",
      message: "A new OTP has been sent to your email.",
      data: {
        email: member.email,
        expiresAt: otpExpires.toISOString(),
        otp: otp, // For testing purposes; remove in production
        otpExpiresAt: otpExpires.toISOString(), // For testing purposes; remove in production
      },
    });
  } catch (error) {
    next(error);
  }
};

// Change a member password directly after validating the supplied new password.
export const changeMemberPassword = async (req, res, next) => {
  try {
    const { memberId } = req.params ?? {};
    const { newPassword } = req.body ?? {};
    const trimmedPassword = typeof newPassword === "string" ? newPassword : "";

    if (!memberId) {
      return res.status(400).json({
        status: "error",
        message: "Member id is required",
      });
    }

    if (!trimmedPassword || trimmedPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 6 characters",
      });
    }

    const member = await MemberModel.findById(memberId).select("+passwordHash");
    if (!member) {
      return res.status(404).json({
        status: "error",
        message: "Member not found",
      });
    }

    member.passwordHash = await hashPassword(trimmedPassword);
    await member.save();

    return res.json({
      status: "success",
      message: "Password updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Send a password reset OTP when a member requests a forgotten-password flow.
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body ?? {};
    const trimmedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";

    if (!trimmedEmail) {
      return res
        .status(400)
        .json({ status: "error", message: "Email is required" });
    }

    const member = await MemberModel.findOne({ email: trimmedEmail }).select(
      "+emailOtp +emailOtpExpiresAt",
    );
    if (!member) {
      // Don't reveal whether the email exists — security best practice
      return res.json({
        status: "success",
        message:
          "If an account with this email exists, a password reset OTP has been sent.",
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const otpExpires = new Date(Date.now() + 3 * 60 * 1000);

    member.emailOtp = otp;
    member.emailOtpExpiresAt = otpExpires;
    await member.save();

    const emailResult = await sendOtpEmail({
      toEmail: member.email,
      otp,
      name: member.name,
      type: "forgot-password",
    });

    if (!emailResult.delivered) {
      logger.error(
        { email: trimmedEmail, reason: emailResult.reason },
        "Failed to send password reset OTP email",
      );
      return res.status(500).json({
        status: "error",
        message: emailResult.reason || "Failed to send password reset email",
      });
    }

    console.log(`Generated forgot-password OTP for ${trimmedEmail}: ${otp}`);

    return res.json({
      status: "success",
      message:
        "If an account with this email exists, a password reset OTP has been sent.",
      data: {
        email: member.email,
        expiresAt: otpExpires.toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Verify the reset OTP and update the member password to the new value.
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, password } = req.body ?? {};
    const trimmedEmail =
      typeof email === "string" ? email.toLowerCase().trim() : "";
    const trimmedOtp = typeof otp === "string" ? otp.trim() : "";
    const trimmedPassword = typeof password === "string" ? password : "";

    if (!trimmedEmail || !trimmedOtp || !trimmedPassword) {
      return res.status(400).json({
        status: "error",
        message: "Email, otp, and new password are required",
      });
    }
    if (trimmedPassword.length < 6) {
      return res.status(400).json({
        status: "error",
        message: "Password must be at least 6 characters",
      });
    }

    const member = await MemberModel.findOne({
      email: trimmedEmail,
      emailOtp: trimmedOtp,
    }).select("+emailOtp +emailOtpExpiresAt +passwordHash");
    if (
      !member ||
      !member.emailOtpExpiresAt ||
      member.emailOtpExpiresAt < new Date()
    ) {
      return res
        .status(400)
        .json({ status: "error", message: "Invalid or expired OTP" });
    }

    member.passwordHash = await hashPassword(trimmedPassword);
    member.emailOtp = undefined;
    member.emailOtpExpiresAt = undefined;
    member.isEmailVerified = true;
    member.emailVerifiedAt = new Date();

    const tokenBundle = await issueMemberTokens(member);

    return res.json({
      status: "success",
      isEmailVerified: true,
      message:
        "Password has been reset successfully. You can now log in with your new password.",
      data: {
        user: {
          id: member.id,
          name: member.name,
          email: member.email,
          phone: member.phone,
          role: member.role,
        },
        ...tokenBundle,
      },
    });
  } catch (error) {
    next(error);
  }
};
