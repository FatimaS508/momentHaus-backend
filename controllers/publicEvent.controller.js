
const PublicEvent = require("../models/PublicEvent");
const mongoose = require("mongoose");

// Helper: validate event dates
const validateEventDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (
    !startDate ||
    !endDate ||
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime())
  ) {
    throw new Error("Invalid event dates.");
  }

  if (end < start) {
    throw new Error("End date cannot be before start date.");
  }
};


// ========================================
// 1. CREATE EVENT (Manager)
// ========================================

const createEvent = async (req, res) => {
  try {
    const {
      eventName,
      image,
      startDate,
      endDate,
      startTime,
      endTime,
      desc,
      locationDesc,
      locationLink,
      price,
      features
    } = req.body;

    // Check required fields
    if (
      !eventName ||
      !image ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime ||
      !desc ||
      !locationDesc ||
      price === undefined
    ) {
      return res.status(400).json({
        message: "Please provide all required event information."
      });
    }

    validateEventDates(startDate, endDate);

    if (!Number.isFinite(Number(price)) || Number(price) < 0) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number."
      });
    }

    const newEvent = await PublicEvent.create({
      eventName,
      image,
      startDate,
      endDate,
      startTime,
      endTime,
      desc,
      locationDesc,
      locationLink,
      price,
      features: features || []
    });

    return res.status(201).json({
      message: "Public event created successfully.",
      event: newEvent
    });

  } catch (error) {
    console.error("Create event error:", error);

    return res.status(400).json({
      message: error.message || "Failed to create event."
    });
  }
};


// ========================================
// 2. GET PUBLISHED EVENTS (Public)
// ========================================

const getPublishedEvents = async (req, res) => {
  try {
    // Include events happening today or in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const events = await PublicEvent.find({
      isPublished: true,
      endDate: { $gte: today }
    }).sort({ startDate: 1 });

    return res.status(200).json({
      count: events.length,
      events
    });

  } catch (error) {
    console.error("Get published events error:", error);

    return res.status(500).json({
      message: "Failed to fetch public events."
    });
  }
};


// ========================================
// 3. GET ALL EVENTS (Manager)
// ========================================

const getAllEvents = async (req, res) => {
  try {
    const events = await PublicEvent.find()
      .sort({ startDate: -1 });

    return res.status(200).json({
      count: events.length,
      events
    });

  } catch (error) {
    console.error("Get all events error:", error);

    return res.status(500).json({
      message: "Failed to fetch events."
    });
  }
};


// ========================================
// 4. GET ONE EVENT (Public)
// Only published events can be viewed
// ========================================

const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid event ID."
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const event = await PublicEvent.findOne({
      _id: id,
      isPublished: true,
      endDate: { $gte: today }
    });

    if (!event) {
      return res.status(404).json({
        message: "Event not found or unavailable."
      });
    }

    return res.status(200).json({ event });

  } catch (error) {
    console.error("Get event error:", error);

    return res.status(500).json({
      message: "Failed to fetch event."
    });
  }
};


// ========================================
// 5. UPDATE EVENT (Manager)
// ========================================

const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid event ID."
      });
    }

    const allowedFields = [
      "eventName",
      "image",
      "startDate",
      "endDate",
      "startTime",
      "endTime",
      "desc",
      "locationDesc",
      "locationLink",
      "price",
      "features"
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        message: "No event information provided to update."
      });
    }

    // Validate dates using updated values or existing values
    if (updates.startDate || updates.endDate) {
      const existingEvent = await PublicEvent.findById(id);

      if (!existingEvent) {
        return res.status(404).json({
          message: "Event not found."
        });
      }

      validateEventDates(
        updates.startDate ?? existingEvent.startDate,
        updates.endDate ?? existingEvent.endDate
      );
    }

    if (
      updates.price !== undefined &&
      (!Number.isFinite(Number(updates.price)) || Number(updates.price) < 0)
    ) {
      return res.status(400).json({
        message: "Price must be a valid non-negative number."
      });
    }

    const updatedEvent = await PublicEvent.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({
        message: "Event not found."
      });
    }

    return res.status(200).json({
      message: "Event updated successfully.",
      event: updatedEvent
    });

  } catch (error) {
    console.error("Update event error:", error);

    return res.status(400).json({
      message: error.message || "Failed to update event."
    });
  }
};


// ========================================
// 6. PUBLISH / UNPUBLISH EVENT (Manager)
// ========================================

const toggleEventPublish = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid event ID."
      });
    }

    const event = await PublicEvent.findById(id);

    if (!event) {
      return res.status(404).json({
        message: "Event not found."
      });
    }

    event.isPublished = !event.isPublished;

    await event.save();

    return res.status(200).json({
      message: `Event ${event.isPublished ? "published" : "unpublished"} successfully.`,
      event
    });

  } catch (error) {
    console.error("Toggle event publish error:", error);

    return res.status(500).json({
      message: "Failed to update event status."
    });
  }
};


// ========================================
// 7. DELETE EVENT (Manager)
// ========================================

const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid event ID."
      });
    }

    const deletedEvent = await PublicEvent.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({
        message: "Event not found."
      });
    }

    return res.status(200).json({
      message: "Event deleted successfully."
    });

  } catch (error) {
    console.error("Delete event error:", error);

    return res.status(500).json({
      message: "Failed to delete event."
    });
  }
};


module.exports = {
  createEvent,
  getPublishedEvents,
  getAllEvents,
  getEventById,
  updateEvent,
  toggleEventPublish,
  deleteEvent
};
