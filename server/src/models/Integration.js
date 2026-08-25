const mongoose = require('mongoose');
const crypto = require('crypto');
const { CREDENTIAL_ENCRYPTION_KEY } = require('../config/env');

// Pad or truncate key to exactly 32 bytes for AES-256
const getKey = () => {
  const raw = CREDENTIAL_ENCRYPTION_KEY || 'fallback_encryption_key_32chars!!';
  return Buffer.from(raw.padEnd(32, '0').slice(0, 32));
};

const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

const decrypt = (cipherText) => {
  if (!cipherText) return null;
  try {
    const [ivHex, encHex] = cipherText.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const enc = Buffer.from(encHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', getKey(), iv);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
};

const integrationSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    provider: {
      type: String,
      enum: ['gmail', 'slack', 'google-sheets', 'discord', 'openrouter', 'gemini'],
      required: true,
    },
    status: { type: String, enum: ['connected', 'disconnected'], default: 'disconnected' },
    scopes: [String],
    accessToken: { type: String }, // stored encrypted
    refreshToken: { type: String }, // stored encrypted
    tokenExpiresAt: { type: Date },
    accountEmail: { type: String },
    error: { type: String },
  },
  { timestamps: true }
);

// Encrypt tokens before save
integrationSchema.pre('save', function (next) {
  if (this.isModified('accessToken') && this.accessToken && !this.accessToken.includes(':')) {
    this.accessToken = encrypt(this.accessToken);
  }
  if (this.isModified('refreshToken') && this.refreshToken && !this.refreshToken.includes(':')) {
    this.refreshToken = encrypt(this.refreshToken);
  }
  next();
});

integrationSchema.methods.getDecryptedAccessToken = function () {
  return decrypt(this.accessToken);
};

integrationSchema.methods.getDecryptedRefreshToken = function () {
  return decrypt(this.refreshToken);
};

module.exports = mongoose.model('Integration', integrationSchema);
