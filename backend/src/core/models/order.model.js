import mongoose, { Schema, model } from "mongoose";
import { randomUUID } from "crypto";
import { generateDid } from "../utils/generateDid.js";

const { models } = mongoose;

const orderItemSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    size: { type: String, trim: true },
    concentration: { type: String, trim: true },
    productDid: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const customerSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: false, trim: true, lowercase: true },
    address: { type: String, required: false, trim: true },
    city: { type: String, trim: true, default: '' },
    thana: { type: String, trim: true, default: '' },
    district: { type: String, required: false, trim: true },
    zip: { type: String, trim: true, default: '' },
    giftWrap: { type: Boolean, default: false },
  },
  { _id: false },
);

const orderTotalsSchema = new Schema(
  {
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    did: { type: String, default: () => generateDid(), unique: true, index: true },
    status: {
      type: String,
      required: true,
      enum: [ "processing", "shipped", "completed", "cancelled"],
      default: "processing",
    },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    member: { type: Schema.Types.ObjectId, ref: "Member", required: false },
    customer: { type: customerSchema, required: true },
    paymentMethod: { type: String, required: true, trim: true },
    shippingAddress: { type: Schema.Types.Mixed, default: {} },
    shippingTotalAmount: { type: Number, default: 0, min: 0 },
    discountTotalAmount: { type: Number, default: 0, min: 0 },
    couponCode: { type: String, default: null, trim: true, uppercase: true },
    items: { type: [orderItemSchema], required: true, validate: [(items) => items.length > 0, "items must contain at least one item"] },
    totals: { type: orderTotalsSchema, required: true },
    active: { type: Boolean, default: true, index: true },
  },
  {
    collection: "orders",
    timestamps: true,
    versionKey: false,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        if (ret._id) {
          ret.id = ret._id.toString();
        }
        delete ret._id;
        return ret;
      },
    },
  },
);

export const OrderModel = models.Order || model("Order", orderSchema);
