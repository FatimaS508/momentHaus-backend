
const express = require("express");
const router = express.Router();

const contactMessageController = require("../controllers/contactMessage.controller");
const verifyToken = require("../middleware/verifyToken");

// Public route
router.post("/", contactMessageController.createMessage);

// Manager routes
router.get("/", verifyToken, contactMessageController.getAllMessages);
router.get("/:id", verifyToken, contactMessageController.getMessageById);
router.patch("/:id/status", verifyToken, contactMessageController.updateMessageStatus);
router.delete("/:id", verifyToken, contactMessageController.deleteMessage);

module.exports = router;
