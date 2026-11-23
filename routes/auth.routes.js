
const express = require("express");
const router = express.Router();

const authController = require("../controllers/auth.controller");
const verifyToken = require("../middleware/verifyToken");

// Admin login
router.post("/sign-in", authController.signIn);

// Verify admin session
router.get("/me", verifyToken, (req, res) => {
  res.status(200).json({
    message: "Session verified",
    admin: req.admin
  });
});

module.exports = router;

