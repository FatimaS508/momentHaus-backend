
const ContactMessage = require("../models/ContactMessage");
const mongoose = require("mongoose");

// ========================================
// 1. CREATE MESSAGE (Public)
// ========================================

const createMessage = async (req, res) => {
  try {
    const {
      name,
      email,
      phoneNumber,
      subject,
      message
    } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        message: "Please provide all required fields."
      });
    }

    // Create message
    const newMessage = await ContactMessage.create({
      name,
      email,
      phoneNumber,
      subject,
      message
    });

    return res.status(201).json({
      message: "Your message has been sent successfully.",
      contactMessage: newMessage
    });

  } catch (error) {
    console.error("Create message error:", error);

    return res.status(500).json({
      message: "Failed to send your message."
    });
  }
};


// ========================================
// 2. GET ALL MESSAGES (Manager)
// ========================================

const getAllMessages = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};

    if (status) {
      const allowedStatuses = ["New", "Read", "Replied"];

      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          message: "Invalid message status."
        });
      }

      filter.status = status;
    }

    const messages = await ContactMessage.find(filter)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      count: messages.length,
      messages
    });

  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      message: "Failed to fetch messages."
    });
  }
};


// ========================================
// 3. GET MESSAGE BY ID (Manager)
// ========================================

const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid message ID."
      });
    }

    const contactMessage = await ContactMessage.findById(id);

    if (!contactMessage) {
      return res.status(404).json({
        message: "Message not found."
      });
    }

    return res.status(200).json({
      contactMessage
    });

  } catch (error) {
    console.error("Get message error:", error);

    return res.status(500).json({
      message: "Failed to fetch message."
    });
  }
};


// ========================================
// 4. UPDATE MESSAGE STATUS (Manager)
// ========================================

const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid message ID."
      });
    }

    const allowedStatuses = ["New", "Read", "Replied"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid message status."
      });
    }

    const contactMessage = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );

    if (!contactMessage) {
      return res.status(404).json({
        message: "Message not found."
      });
    }

    return res.status(200).json({
      message: "Message status updated successfully.",
      contactMessage
    });

  } catch (error) {
    console.error("Update message status error:", error);

    return res.status(500).json({
      message: "Failed to update message status."
    });
  }
};


// ========================================
// 5. DELETE MESSAGE (Manager)
// ========================================

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid message ID."
      });
    }

    const deletedMessage = await ContactMessage.findByIdAndDelete(id);

    if (!deletedMessage) {
      return res.status(404).json({
        message: "Message not found."
      });
    }

    return res.status(200).json({
      message: "Message deleted successfully."
    });

  } catch (error) {
    console.error("Delete message error:", error);

    return res.status(500).json({
      message: "Failed to delete message."
    });
  }
};


module.exports = {
  createMessage,
  getAllMessages,
  getMessageById,
  updateMessageStatus,
  deleteMessage
};
