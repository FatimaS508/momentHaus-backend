
const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  guestsNo: {
    type: Number,
    required: true,
    min: 1
  },

  desc: {
    type: String,
    trim: true
  },

  includedHours: {
    type: Number,
    required: true,
    min: 1
  },

  packagePrice: {
    type: Number,
    required: true,
    min: 0
  },

  additionalHourPrice: {
    type: Number,
    required: true,
    min: 0
  },

  isActive: {
    type: Boolean,
    default: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Package", packageSchema);
