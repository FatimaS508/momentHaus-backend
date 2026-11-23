
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("../models/Admin");

const admins = [
  {
    firstName: process.env.ADMIN1_FIRST_NAME,
    lastName: process.env.ADMIN1_LAST_NAME,
    email: process.env.ADMIN1_EMAIL,
    password: process.env.ADMIN1_PASSWORD
  },
  {
    firstName: process.env.ADMIN2_FIRST_NAME,
    lastName: process.env.ADMIN2_LAST_NAME,
    email: process.env.ADMIN2_EMAIL,
    password: process.env.ADMIN2_PASSWORD
  }
];

const seedAdmins = async () => {
  try {
    for (const admin of admins) {
      if (
        !admin.firstName ||
        !admin.lastName ||
        !admin.email ||
        !admin.password
      ) {
        throw new Error("Missing admin credentials in .env");
      }
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log("MongoDB connected");

    for (const admin of admins) {
      const existingAdmin = await Admin.findOne({
        email: admin.email.toLowerCase()
      });

      if (existingAdmin) {
        console.log(`${admin.email} already exists. Skipping.`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(
        admin.password,
        12
      );

      await Admin.create({
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        hashedPassword
      });

      console.log(`${admin.email} created successfully`);
    }

    console.log("Admin seeding completed");

  } catch (error) {
    console.error("Seeding error:", error.message);

  } finally {
    await mongoose.disconnect();
  }
};

seedAdmins();
