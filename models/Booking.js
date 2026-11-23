
const mongoose = require("mongoose");

// 1. Event Schedule Schema
const eventDateSchema = new mongoose.Schema({

  eventDate: {
    type: Date,
    required: true
  },

  eventStartTime: {
    type: String,
    required: true
  },

  eventEndTime: {
    type: String,
    required: true
  }

}, { _id: false });


// 2. Event Details Schema
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
      validator: dates => dates.length > 0,
      message: "At least one event date is required"
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


// 3. Customization Schema
const customizationSchema = new mongoose.Schema({

  eventInspirations: [{
    type: String
  }],

  specialRequest: {
    type: String,
    trim: true
  }

}, { _id: false });


// 4. Customer Details Schema
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
    required: true
  },

  phoneNumber: {
    type: String
  },

  email: {
    type: String,
    lowercase: true,
    trim: true
  },

  note: {
    type: String,
    trim: true
  }

}, { _id: false });


// 5. Internal Notes Schema
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


// 6. Main Booking Schema
const bookingSchema = new mongoose.Schema({

  bookingNo: {
    type: String,
    required: true,
    unique: true
  },

  status: {
    type: String,
    enum: [
      "Pending",
      "Confirmed",
      "Cancelled",
      "Completed"
    ],
    default: "Pending"
  },

  package: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Package",
    required: true
  },

  packageSnapshot: {
    name: String,
    guestsNo: Number,
    includedHours: Number,
    packagePrice: Number,
    additionalHourPrice: Number
  },

  additionalHourNo: {
    type: Number,
    default: 0,
    min: 0
  },

  estimatedTotal: {
    type: Number,
    required: true,
    min: 0
  },

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

  internalNotes: {
    type: [internalNoteSchema],
    default: []
  }

}, { timestamps: true });


module.exports = mongoose.model("Booking", bookingSchema);
