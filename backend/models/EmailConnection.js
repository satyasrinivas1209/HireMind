const mongoose = require("mongoose");

const emailConnectionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    grantId: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    provider: {
      type: String,
      default: "email",
      trim: true,
    },
    status: {
      type: String,
      enum: ["connected", "disconnected", "expired"],
      default: "connected",
    },
    lastSyncedAt: {
      type: Date,
      default: null,
    },
    processedMessageIds: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailConnection", emailConnectionSchema);
