
const mongoose = require("mongoose");

const publicEventSchema = new mongoose.Schema({

  eventName: {
    type: String,
    required: true,
    trim: true
  },

  image: {
    type: String,
    required: true
  },

  startDate: {
    type: Date,
    required: true
  },

  endDate: {
    type: Date,
    required: true
  },

  startTime: {
    type: String,
    required: true
  },

  endTime: {
    type: String,
    required: true
  },

  desc: {
    type: String,
    required: true,
    trim: true
  },

  locationDesc: {
    type: String,
    required: true,
    trim: true
  },

  locationLink: {
    type: String,
    trim: true
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },

  features: [{
    type: String,
    trim: true
  }],

  isPublished: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("PublicEvent", publicEventSchema);
