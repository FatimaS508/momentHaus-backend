
const express = require("express");
const router = express.Router();

const bookingController = require("../controllers/booking.controller");
const verifyToken = require("../middleware/verifyToken");

// Public route: customer submits booking
router.post("/", bookingController.createBooking);

// Manager routes
router.get("/", verifyToken, bookingController.getAllBookings);

router.get("/:id", verifyToken, bookingController.getBookingById);

router.patch("/:id/status", verifyToken, bookingController.updateBookingStatus);

router.patch("/:id/confirmed-details", verifyToken, bookingController.updateConfirmedDetails);

router.post("/:id/notes", verifyToken, bookingController.addInternalNote);

module.exports = router;
