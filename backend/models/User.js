const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["Admin", "HR"], default: "HR" },

    // Gmail OAuth tokens are stored encrypted (AES-256-GCM).
    // gmailTokens holds the encrypted ciphertext (base64),
    // gmailTokensIV holds the initialization vector,
    // gmailTokensAuthTag holds the GCM auth tag.
    gmailTokens: { type: String, select: false },
    gmailTokensIV: { type: String, select: false },
    gmailTokensAuthTag: { type: String, select: false },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toSafeObject = function () {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    gmailConnected: Boolean(this.gmailTokens),
  };
};

module.exports = mongoose.model("User", userSchema);
