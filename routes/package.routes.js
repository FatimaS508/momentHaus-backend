const express = require("express");
const router = express.Router();

const packageController = require("../controllers/package.controller");
const verifyToken = require("../middleware/verifyToken");

// Public route
router.get("/active", packageController.getActivePackages);

// Admin routes
router.get("/", verifyToken, packageController.getAllPackages);
router.post("/", verifyToken, packageController.createPackage);
router.put("/:id", verifyToken, packageController.updatePackage);
router.patch("/:id/status", verifyToken, packageController.togglePackageStatus);

module.exports = router;