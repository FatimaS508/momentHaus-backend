const Package = require("../models/Package");

const getActivePackages = async (req, res) => {
  try {
    const packages = await Package.find({ isActive: true })
      .sort({ createdAt: -1 });

    return res.status(200).json({ packages });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch packages."
    });
  }
};

const getAllPackages = async (req, res) => {
  try {
    const packages = await Package.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({ packages });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to fetch packages."
    });
  }
};

const createPackage = async (req, res) => {
  try {
    const {
      name,
      guestsNo,
      desc,
      includedHours,
      packagePrice,
      additionalHourPrice
    } = req.body;

    const newPackage = await Package.create({
      name,
      guestsNo,
      desc,
      includedHours,
      packagePrice,
      additionalHourPrice
    });

    return res.status(201).json({
      message: "Package created successfully.",
      package: newPackage
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to create package."
    });
  }
};


const updatePackage = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedFields = [
      "name",
      "guestsNo",
      "desc",
      "includedHours",
      "packagePrice",
      "additionalHourPrice"
    ];

    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const updatedPackage = await Package.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      return res.status(404).json({
        message: "Package not found."
      });
    }

    return res.status(200).json({
      message: "Package updated successfully.",
      package: updatedPackage
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update package."
    });
  }
};

const togglePackageStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const packageItem = await Package.findById(id);

    if (!packageItem) {
      return res.status(404).json({
        message: "Package not found."
      });
    }

    packageItem.isActive = !packageItem.isActive;

    await packageItem.save();

    return res.status(200).json({
      message: `Package ${packageItem.isActive ? "activated" : "deactivated"} successfully.`,
      package: packageItem
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to update package status."
    });
  }
};

module.exports = {
  getActivePackages,
  getAllPackages,
  createPackage,
  updatePackage,
  togglePackageStatus
};