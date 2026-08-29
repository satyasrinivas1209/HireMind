const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

const getKey = () => {
  const hexKey = process.env.GMAIL_TOKEN_ENC_KEY;
  if (!hexKey || hexKey.length !== 64) {
    throw new Error(
      "GMAIL_TOKEN_ENC_KEY must be a 64-character hex string (32 bytes) set in .env"
    );
  }
  return Buffer.from(hexKey, "hex");
};

// Encrypts a JS object (e.g. Gmail OAuth tokens) into { ciphertext, iv, authTag }
const encryptTokens = (tokensObject) => {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const plaintext = JSON.stringify(tokensObject);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
  };
};

// Decrypts back into the original tokens object
const decryptTokens = (ciphertext, iv, authTag) => {
  const key = getKey();
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(authTag, "base64"));

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64")),
    decipher.final(),
  ]);

  return JSON.parse(decrypted.toString("utf8"));
};

module.exports = { encryptTokens, decryptTokens };
