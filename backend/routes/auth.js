// routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const sqlite3 = require("sqlite3").verbose();
const router = express.Router();

// Initialize database connection
const db = new sqlite3.Database("./game.db");

// JWT Secret
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

// Google Authentication Endpoint
router.post("/google", (req, res) => {
  try {
    console.log("Google auth request body:", req.body);

    const { user } = req.body;

    if (!user) {
      return res.status(400).json({ error: "User data is required" });
    }

    const { uid, email, displayName, picture } = user;

    if (!uid || !email) {
      return res.status(400).json({ error: "User ID and email are required" });
    }

    // Check if user exists
    db.get(
      `SELECT id, username, email, picture, is_guest FROM users WHERE firebase_uid = ? OR email = ?`,
      [uid, email],
      (err, row) => {
        if (err) {
          console.error("Database error:", err);
          return res.status(500).json({ error: "Database error" });
        }

        if (row) {
          // Existing user - update picture if provided
          if (picture && !row.picture) {
            db.run(`UPDATE users SET picture = ? WHERE id = ?`, [
              picture,
              row.id,
            ]);
          }

          // Generate JWT token
          const token = jwt.sign(
            {
              userId: row.id,
              username: row.username,
              isGuest: row.is_guest,
            },
            JWT_SECRET,
            { expiresIn: "30d" }
          );

          return res.json({
            token,
            user: {
              id: row.id,
              username: row.username,
              email: row.email,
              picture: row.picture || picture || null,
              isGuest: row.is_guest,
            },
          });
        } else {
          // Create new user
          const userId = require("crypto").randomUUID();
          const username =
            displayName ||
            email.split("@")[0] + "_" + Math.random().toString(36).substr(2, 5);

          db.run(
            `INSERT INTO users (id, username, email, firebase_uid, picture, is_guest) VALUES (?, ?, ?, ?, ?, ?)`,
            [userId, username, email, uid, picture || null, 0],
            function (insertErr) {
              if (insertErr) {
                console.error("Insert error:", insertErr);
                return res.status(500).json({ error: "Failed to create user" });
              }

              const newUser = {
                id: userId,
                username,
                email,
                picture: picture || null,
                is_guest: 0,
              };

              // Generate JWT token
              const token = jwt.sign(
                {
                  userId: newUser.id,
                  username: newUser.username,
                  isGuest: newUser.is_guest,
                },
                JWT_SECRET,
                { expiresIn: "30d" }
              );

              res.json({
                token,
                user: {
                  id: newUser.id,
                  username: newUser.username,
                  email: newUser.email,
                  picture: newUser.picture,
                  isGuest: newUser.is_guest,
                },
              });
            }
          );
        }
      }
    );
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
});

// Guest Authentication
router.post("/guest", (req, res) => {
  try {
    const userId = require("crypto").randomUUID();
    const username = `guest_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 5)}`;
    const email = `guest_${userId}@example.com`;

    db.run(
      `INSERT INTO users (id, username, email, is_guest) VALUES (?, ?, ?, ?)`,
      [userId, username, email, 1],
      function (err) {
        if (err) {
          return res
            .status(500)
            .json({ error: "Failed to create guest session" });
        }

        const user = {
          id: userId,
          username,
          email,
          is_guest: 1,
        };

        // Generate JWT token
        const token = jwt.sign(
          {
            userId: user.id,
            username: user.username,
            isGuest: user.is_guest,
          },
          JWT_SECRET,
          { expiresIn: "7d" }
        );

        res.json({
          token,
          user,
        });
      }
    );
  } catch (error) {
    console.error("Guest creation error:", error);
    res.status(500).json({ error: "Failed to create guest session" });
  }
});

// User verification endpoint
router.get("/verify", authenticateToken, (req, res) => {
  db.get(
    `SELECT id, username, email, picture, is_guest FROM users WHERE id = ?`,
    [req.user.userId],
    (err, row) => {
      if (err || !row) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        id: row.id,
        username: row.username,
        email: row.email,
        picture: row.picture,
        isGuest: row.is_guest,
      });
    }
  );
});

module.exports = router;
