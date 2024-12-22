const mongoose = require("mongoose");

// Settings Schema
const settingsSchema = new mongoose.Schema({
  contactEmail: {
    type: String,
    required: true,
    trim: true
  },
  contactPhone: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  facebook: {
    type: String,
    trim: true
  },
  instagram: {
    type: String,
    trim: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Middleware to update the `updatedAt` field on save
settingsSchema.pre("save", function(next) {
  this.updatedAt = Date.now();
  next();
});

const Settings = mongoose.model("Settings", settingsSchema);

module.exports = Settings;
