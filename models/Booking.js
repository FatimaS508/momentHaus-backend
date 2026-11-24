
const mongoose = require("mongoose");

// Event date schema
const eventDateSchema = new mongoose.Schema({
  eventDate: {
    type: Date,
    required: true
  },
  photographyStartTime: {
    type: String,
    required: true
  },
  additionalHours: {
    type: Number,
    default: 0,
    min: 0
  },
  photographyEndTime: {
    type: String,
    required: true
  }
}, { _id: false });


// Event details schema
const eventDetailsSchema = new mongoose.Schema({
  eventType: {
    type: String,
    required: true,
    trim: true
  },
  eventTitle: {
    type: String,
    trim: true
  },
  eventDates: {
    type: [eventDateSchema],
    required: true,
    validate: {
      validator: (dates) => dates.length > 0,
      message: "At least one event date is required."
    }
  },
  venueName: {
    type: String,
    required: true,
    trim: true
  },
  venueAddress: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: false });


// Customization schema
const customizationSchema = new mongoose.Schema({
  eventInspirations: [{
    type: String
  }],
  specialRequest: {
    type: String,
    trim: true
  }
}, { _id: false });


// Customer details schema
const customerDetailsSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  whatsappNumber: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true
  }
}, { _id: false });


// Package snapshot schema
const packageSnapshotSchema = new mongoose.Schema({
  name: String,
  guestsNo: Number,
  includedHours: Number,
  packagePrice: Number,
  additionalHourPrice: Number
}, { _id: false });


// Customer's original request
const requestedDetailsSchema = new mongoose.Schema({
  eventDetails: {
    type: eventDetailsSchema,
    required: true
  },
  customization: {
    type: customizationSchema,
    default: () => ({})
  },
  customerDetails: {
    type: customerDetailsSchema,
    required: true
  },
  estimatedTotal: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });


// Manager-approved details
const confirmedDetailsSchema = new mongoose.Schema({
  eventDates: {
    type: [eventDateSchema],
    default: []
  },
  finalPrice: {
    type: Number,
    min: 0
  }
}, { _id: false });


// Internal notes schema
const internalNoteSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true,
    trim: true
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Admin",
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});


// Main Booking schema
const bookingSchema = new mongoose.Schema({
  bookingNo: {
    type: String,
    required: true,
    unique: true
  },

  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Rejected", "Completed"],
    default: "Pending"
  },

  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Package",
    required: true
  },

  packageSnapshot: {
    type: packageSnapshotSchema,
    required: true
  },

  requestedDetails: {
    type: requestedDetailsSchema,
    required: true
  },

  confirmedDetails: {
    type: confirmedDetailsSchema,
    default: null
  },

  internalNotes: {
    type: [internalNoteSchema],
    default: []
  }

}, { timestamps: true });

bookingSchema.index({ status: 1, createdAt: -1 });
bookingSchema.index({ createdAt: -1 });


module.exports = mongoose.model("Booking", bookingSchema);

