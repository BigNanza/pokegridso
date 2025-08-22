// routes/auth.js - Simplified for Firebase-only
const express = require("express");
const admin = require("firebase-admin"); // Make sure this is initialized in server.js
const router = express.Router();

// Authentication middleware for Firebase tokens
const authenticateFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Firebase ID token required" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Firebase token verification failed:", error);
    return res.status(403).json({ error: "Invalid Firebase token" });
  }
};

// Just verify the Firebase token and return user info
router.get("/verify", authenticateFirebaseToken, async (req, res) => {
  try {
    const { uid, email, name, picture } = req.user;

    res.json({
      uid,
      email,
      displayName: name,
      photoURL: picture,
      isAuthenticated: true,
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({ error: "Verification failed" });
  }
});

module.exports = router;
