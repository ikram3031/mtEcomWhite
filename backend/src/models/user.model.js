import mongoose, { Schema, model } from "mongoose";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

export const USER_ROLES = ["Owner", "Admin", "Manager", "Employee"];

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    passwordHash: { type: String, required: true, trim: true, select: false },
    phone: { type: String, required: true, trim: true, index: true },
    refreshToken: { type: String, select: false },
    refreshTokenExpiresAt: { type: Date, select: false },
    emailOtp: { type: String, trim: true, select: false },
    emailOtpExpiresAt: { type: Date, select: false },
    twoFactorSecret: { type: String, select: false },
    twoFactorEnabled: { type: Boolean, default: false },
    role: { type: String, required: true, enum: USER_ROLES, default: "Employee" },
    assets: {
      type: [String],
      validate: {
        validator: function (arr) {
          // ensure max 2 assets per employee
          if (!Array.isArray(arr)) return true;
          return arr.length <= 2;
        },
        message: 'An employee may have at most 2 assets assigned',
      },
      default: [],
    },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        if (ret._id) {
          ret.id = ret._id.toString();
        }
        delete ret._id;
        delete ret.passwordHash;
        delete ret.emailOtp;
        delete ret.emailOtpExpiresAt;
        delete ret.twoFactorSecret;
        delete ret.refreshToken;
        delete ret.refreshTokenExpiresAt;
        return ret;
      },
    },
  },
);

export const UserModel = models.User || model("User", userSchema);
