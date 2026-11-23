
const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

async function verifyToken(req, res, next) {
  try {
    // 1. Get the token from the request header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Authentication required."
      });
    }

    const token = authHeader.split(" ")[1];

    // 2. Verify the JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // 3. Find the admin in MongoDB
    const admin = await Admin.findById(decoded.adminId)
      .select("-hashedPassword");

    // 4. Check if admin exists and is active
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        message: "Admin account is inactive or unavailable."
      });
    }

    // 5. Attach admin information to the request
    req.admin = admin;

    // 6. Continue to the next function
    next();

  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token."
    });
  }
}

module.exports = verifyToken;

