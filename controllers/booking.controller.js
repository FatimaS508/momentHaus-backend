
const Booking = require("../models/Booking");
const Package = require("../models/Package");
const mongoose = require("mongoose");

const { randomInt } = require("crypto");
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "ValidationError";
  }
}

// ========================================
// Helper 1: Validate event date
// ========================================

const validateEventDate = (date) => {
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    throw new Error("Event date must use YYYY-MM-DD format.");
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new Error("Invalid event date.");
  }

  // Use Bahrain's calendar date
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Bahrain",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());

  if (date < today) {
    throw new Error("Event date cannot be in the past.");
  }

  return parsedDate;
};


// ========================================
// Helper 2: Calculate photography end time
// ========================================

const calculateEndTime = (startTime, totalHours) => {
  if (
    typeof startTime !== "string" ||
    !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)
  ) {
    throw new Error("Invalid start time. Use HH:mm format.");
  }

  if (
    !Number.isFinite(totalHours) ||
    totalHours <= 0
  ) {
    throw new Error("Invalid photography duration.");
  }

  const [hours, minutes] = startTime.split(":").map(Number);

  const startMinutes = hours * 60 + minutes;
  const durationMinutes = totalHours * 60;

  if (!Number.isInteger(durationMinutes)) {
    throw new Error("Photography duration must use whole or half hours.");
  }

  const endMinutes = startMinutes + durationMinutes;

  if (endMinutes >= 24 * 60) {
    throw new Error(
      "Photography session cannot extend into the next day."
    );
  }

  const endHours = Math.floor(endMinutes / 60);
  const remainingMinutes = endMinutes % 60;

  return `${String(endHours).padStart(2, "0")}:${String(remainingMinutes).padStart(2, "0")}`;
};


// ========================================
// Helper 3: Calculate event dates
// ========================================


const calculateEventDates = (dates, includedHours) => {
  if (!Array.isArray(dates) || dates.length === 0 || dates.length > 30) {
    throw new ValidationError("Provide between 1 and 30 event dates.");
  }

  if (!Number.isFinite(includedHours) || includedHours <= 0) {
    throw new ValidationError("Invalid package included hours.");
  }

  const seenDates = new Set();

  return dates.map((date) => {
    if (!date || !date.eventDate) {
      throw new ValidationError("Event date is required.");
    }

    // Validate date
    const parsedDate = new Date(date.eventDate);

    if (Number.isNaN(parsedDate.getTime())) {
      throw new ValidationError("Invalid event date.");
    }

    const dateKey = parsedDate.toISOString().slice(0, 10);

    if (seenDates.has(dateKey)) {
      throw new ValidationError("Duplicate event dates are not allowed.");
    }

    seenDates.add(dateKey);

    // Validate additional hours
    const additionalHours = Number(date.additionalHours ?? 0);

    if (
      !Number.isFinite(additionalHours) ||
      additionalHours < 0 ||
      additionalHours > 2 ||
      additionalHours % 0.5 !== 0
    ) {
      throw new ValidationError(
        "Additional hours must be between 0 and 2 in half-hour increments."
      );
    }

    const totalHours = includedHours + additionalHours;

    return {
      eventDate: parsedDate,
      photographyStartTime: date.photographyStartTime,
      additionalHours,
      photographyEndTime: calculateEndTime(
        date.photographyStartTime,
        totalHours
      )
    };
  });
};



// ========================================
// Helper 4: Generate booking number
// ========================================

const generateBookingNo = () => {
  return (
    Date.now().toString() +
    randomInt(100000, 1000000).toString()
  );
};


// ========================================
// Helper 5: Validate text fields
// ========================================

const validateText = (value, fieldName, maxLength = 200) => {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > maxLength
  ) {
    throw new Error(`Invalid ${fieldName}.`);
  }

  return value.trim();
};



// ========================================
// 1. CREATE BOOKING (Public)
// ========================================


const createBooking = async (req, res) => {
  try {
    const {
      packageId,
      eventDetails,
      customization,
      customerDetails
    } = req.body;

    // 1. Validate package ID
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({
        message: "Invalid package ID."
      });
    }

    if (!eventDetails || !customerDetails) {
      return res.status(400).json({
        message: "Event and customer details are required."
      });
    }

    // 2. Find active package
    const selectedPackage = await Package.findOne({
      _id: packageId,
      isActive: true
    });

    if (!selectedPackage) {
      return res.status(404).json({
        message: "Package not found or unavailable."
      });
    }

    // 3. Validate event information
    const eventType = validateText(
      eventDetails.eventType,
      "event type",
      100
    );

    const eventTitle = eventDetails.eventTitle
      ? validateText(eventDetails.eventTitle, "event title", 150)
      : undefined;

    const venueName = validateText(
      eventDetails.venueName,
      "venue name",
      150
    );

    const venueAddress = validateText(
      eventDetails.venueAddress,
      "venue address",
      300
    );

    // 4. Calculate requested event dates
    const calculatedEventDates = calculateEventDates(
      eventDetails.eventDates,
      selectedPackage.includedHours
    );

    // 5. Validate customer details
    const firstName = validateText(
      customerDetails.firstName,
      "first name",
      100
    );

    const lastName = validateText(
      customerDetails.lastName,
      "last name",
      100
    );

    const whatsappNumber = validateText(
      customerDetails.whatsappNumber,
      "WhatsApp number",
      30
    );

    const email = customerDetails.email
      ? validateText(customerDetails.email, "email", 254).toLowerCase()
      : undefined;

    if (
      email &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return res.status(400).json({
        message: "Invalid email address."
      });
    }

    // 6. Validate customization
    const eventInspirations = customization?.eventInspirations ?? [];

    if (
      !Array.isArray(eventInspirations) ||
      eventInspirations.length > 10 ||
      !eventInspirations.every(
        (url) => typeof url === "string" && url.length <= 2048
      )
    ) {
      return res.status(400).json({
        message: "Invalid event inspiration images."
      });
    }

    const specialRequest = customization?.specialRequest
      ? validateText(customization.specialRequest, "special request", 2000)
      : "";

    // 7. Calculate estimated price
    const numberOfDays = calculatedEventDates.length;

    const totalAdditionalHours = calculatedEventDates.reduce(
      (total, date) => total + date.additionalHours,
      0
    );

    const packageTotal =
      selectedPackage.packagePrice * numberOfDays;

    const additionalHoursTotal =
      totalAdditionalHours * selectedPackage.additionalHourPrice;

    const estimatedTotal = Number(
      (packageTotal + additionalHoursTotal).toFixed(3)
    );

    // 8. Prepare booking information
    const bookingData = {
      package: selectedPackage._id,

      packageSnapshot: {
        name: selectedPackage.name,
        guestsNo: selectedPackage.guestsNo,
        includedHours: selectedPackage.includedHours,
        packagePrice: selectedPackage.packagePrice,
        additionalHourPrice: selectedPackage.additionalHourPrice
      },

      requestedDetails: {
        eventDetails: {
          eventType,
          eventTitle,
          eventDates: calculatedEventDates,
          venueName,
          venueAddress
        },

        customization: {
          eventInspirations,
          specialRequest
        },

        customerDetails: {
          firstName,
          lastName,
          whatsappNumber,
          email
        },

        estimatedTotal
      },

      status: "Pending"
    };

    // 9. Generate booking number and save
    let booking;
    let attempts = 0;

    while (!booking && attempts < 3) {
      attempts++;

      try {
        booking = await Booking.create({
          ...bookingData,
          bookingNo: generateBookingNo()
        });

      } catch (error) {
        if (error.code === 11000 && attempts < 3) {
          continue;
        }

        throw error;
      }
    }

    return res.status(201).json({
      message: "Booking request submitted successfully.",
      booking
    });

  } catch (error) {
    console.error("Create booking error:", error);

    if (
      error.name === "ValidationError" ||
      error.name === "CastError" ||
      error.message.startsWith("Invalid ") ||
      error.message.includes("required") ||
      error.message.includes("cannot") ||
      error.message.includes("Duplicate") ||
      error.message.includes("Additional hours") ||
      error.message.includes("Photography") ||
      error.message.includes("Event date")
    ) {
      return res.status(400).json({
        message: error.message
      });
    }

    return res.status(500).json({
      message: "Failed to create booking."
    });
  }
};





const getAllBookings = async (req, res) => {
  try {
    const { status, search } = req.query;

    // Pagination
    const page = Number(req.query.page) || 1;
    const limit = Math.min(Number(req.query.limit) || 10, 50);

    if (
      !Number.isInteger(page) || page < 1 ||
      !Number.isInteger(limit) || limit < 1
    ) {
      return res.status(400).json({
        message: "Invalid pagination values."
      });
    }

    const filter = {};

    // Filter by status
    const allowedStatuses = [
      "Pending",
      "Confirmed",
      "Rejected",
      "Completed"
    ];

    if (status) {
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid booking status."
        });
      }

      filter.status = status;
    }

    // Search across multiple fields
    if (search) {
      const trimmedSearch = search.trim();

      if (trimmedSearch.length > 100) {
        return res.status(400).json({
          message: "Search term is too long."
        });
      }

      if (trimmedSearch) {
        const safeSearch = trimmedSearch.replace(
          /[.*+?^${}()|[\]\\]/g,
          "\\$&"
        );

        const searchRegex = {
          $regex: safeSearch,
          $options: "i"
        };

        filter.$or = [
          { bookingNo: searchRegex },
          {
            "requestedDetails.customerDetails.firstName": searchRegex
          },
          {
            "requestedDetails.customerDetails.lastName": searchRegex
          },
          {
            "requestedDetails.customerDetails.whatsappNumber": searchRegex
          },
          {
            "requestedDetails.customerDetails.email": searchRegex
          },
          {
            "requestedDetails.eventDetails.eventTitle": searchRegex
          },
          {
            "requestedDetails.eventDetails.eventType": searchRegex
          }
        ];
      }
    }

    // Fetch bookings and total count
    const skip = (page - 1) * limit;

    const [bookings, totalBookings] = await Promise.all([
      Booking.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("package", "name")
        .populate("internalNotes.addedBy", "firstName lastName"),

      Booking.countDocuments(filter)
    ]);

    return res.status(200).json({
      totalBookings,
      totalPages: Math.ceil(totalBookings / limit),
      currentPage: page,
      limit,
      bookings
    });

  } catch (error) {
    console.error("Get bookings error:", error);

    return res.status(500).json({
      message: "Failed to fetch bookings."
    });
  }
};


const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid booking ID."
      });
    }

    const booking = await Booking.findById(id)
      .populate("package", "name")
      .populate("internalNotes.addedBy", "firstName lastName");

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found."
      });
    }

    return res.status(200).json({ booking });

  } catch (error) {
    console.error("Get booking error:", error);

    return res.status(500).json({
      message: "Failed to fetch booking."
    });
  }
};


const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid booking ID."
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found."
      });
    }

    // Define allowed transitions
    const allowedTransitions = {
      Pending: ["Confirmed", "Rejected"],
      Confirmed: ["Completed"],
      Rejected: [],
      Completed: []
    };

    if (!allowedTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot change booking from ${booking.status} to ${status}.`
      });
    }

    // A booking must have agreed details before confirmation
    if (status === "Confirmed") {
      if (
        !booking.confirmedDetails ||
        !booking.confirmedDetails.eventDates?.length ||
        typeof booking.confirmedDetails.finalPrice !== "number"
      ) {
        return res.status(400).json({
          message: "Save the agreed booking details before confirming."
        });
      }
    }

    booking.status = status;
    await booking.save();

    return res.status(200).json({
      message: `Booking ${status.toLowerCase()} successfully.`,
      booking
    });

  } catch (error) {
    console.error("Update booking status error:", error);

    return res.status(500).json({
      message: "Failed to update booking status."
    });
  }
};




const updateConfirmedDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { eventDates, finalPrice } = req.body;

    // Validate booking ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid booking ID."
      });
    }

    // Validate event dates array
    if (
      !Array.isArray(eventDates) ||
      eventDates.length === 0 ||
      eventDates.length > 30
    ) {
      return res.status(400).json({
        message: "Provide between 1 and 30 agreed event dates."
      });
    }

    // Validate final price (BHD: maximum 3 decimals)
    if (
      typeof finalPrice !== "number" ||
      !Number.isFinite(finalPrice) ||
      finalPrice < 0 ||
      !/^\d+(\.\d{1,3})?$/.test(String(finalPrice))
    ) {
      return res.status(400).json({
        message: "Final price must be a valid BHD amount with up to 3 decimal places."
      });
    }

    // Find booking
    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found."
      });
    }

    // Only pending bookings can be edited
    if (booking.status !== "Pending") {
      return res.status(400).json({
        message: "Only pending bookings can have their confirmed details prepared."
      });
    }

    // Check for duplicate dates
    const dates = eventDates.map((date) => {
      if (!date.eventDate) {
        throw new Error("Every event date is required.");
      }

      const parsedDate = new Date(date.eventDate);

      if (Number.isNaN(parsedDate.getTime())) {
        throw new Error("Invalid event date.");
      }

      return parsedDate.toISOString().slice(0, 10);
    });

    if (new Set(dates).size !== dates.length) {
      return res.status(400).json({
        message: "Duplicate event dates are not allowed."
      });
    }

    // Calculate photography end times
    const includedHours = booking.packageSnapshot.includedHours;

    const calculatedDates = calculateEventDates(
      eventDates,
      includedHours
    );

    // Save agreed details without changing original request
    booking.confirmedDetails = {
      eventDates: calculatedDates,
      finalPrice: Number(finalPrice.toFixed(3))
    };

    await booking.save();

    return res.status(200).json({
      message: "Agreed booking details saved successfully.",
      confirmedDetails: booking.confirmedDetails
    });

  } catch (error) {
  console.error("Update confirmed details error:", error);

  if (
    error.name === "ValidationError" ||
    error.name === "CastError"
  ) {
    return res.status(400).json({
      message: error.message
    });
  }

  return res.status(500).json({
    message: "Failed to update confirmed details."
  });
}
};




const addInternalNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid booking ID."
      });
    }

    if (
      typeof message !== "string" ||
      !message.trim() ||
      message.trim().length > 1000
    ) {
      return res.status(400).json({
        message: "Note must contain between 1 and 1000 characters."
      });
    }

    if (!req.admin?._id) {
      return res.status(401).json({
        message: "Manager authentication required."
      });
    }

    const booking = await Booking.findById(id);

    if (!booking) {
      return res.status(404).json({
        message: "Booking not found."
      });
    }

    booking.internalNotes.push({
      message: message.trim(),
      addedBy: req.admin._id
    });

    await booking.save();

    return res.status(201).json({
      message: "Internal note added successfully.",
      internalNotes: booking.internalNotes
    });

  } catch (error) {
    console.error("Add internal note error:", error);

    return res.status(500).json({
      message: "Failed to add internal note."
    });
  }
}


module.exports = {
  createBooking,
  getAllBookings,
  getBookingById,
  updateBookingStatus,
  updateConfirmedDetails,
  addInternalNote
};
