
const express = require("express");
const router = express.Router();

const publicEventController = require("../controllers/publicEvent.controller");
const verifyToken = require("../middleware/verifyToken");

// Public routes
router.get("/published", publicEventController.getPublishedEvents);
router.get("/:id", publicEventController.getEventById);

// Manager routes
router.get("/", verifyToken, publicEventController.getAllEvents);
router.post("/", verifyToken, publicEventController.createEvent);
router.put("/:id", verifyToken, publicEventController.updateEvent);
router.patch("/:id/publish", verifyToken, publicEventController.toggleEventPublish);
router.delete("/:id", verifyToken, publicEventController.deleteEvent);

module.exports = router;
