// server.js - Add Firebase Admin initialization
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises;
require("dotenv").config();

// Add Firebase Admin SDK
const admin = require("firebase-admin");

// Import routes
const authRoutes = require("./routes/auth");
const puzzleRoutes = require("./routes/puzzles");
const {
  initializeDailyPuzzle,
  scheduleNextPuzzleGeneration,
} = require("./utils/daily");
const {
  initializeWeeklyConfig,
  scheduleNextWeeklyConfigGeneration,
} = require("./utils/weekly");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
try {
  // 1. Check if a service account file path is provided (Recommended for local dev)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    console.log("Loading Firebase Admin SDK using service account file...");
    const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  // 2. Check if the full service account key JSON string is provided (Alternative)
  else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    console.log("Loading Firebase Admin SDK using environment variable...");
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }
  // 3. Fall back to default credentials (e.g., on Google Cloud Platform)
  else if (process.env.FIREBASE_PROJECT_ID) {
    console.log("Loading Firebase Admin SDK using default credentials...");
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }
  // 4. If none are configured
  else {
    console.warn("Firebase Admin not configured - using development mode");
    // Depending on your app's requirements, you might want to exit here
    // if Firebase auth is critical and none of the above configs are provided.
    // process.exit(1);
  }
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Failed to initialize Firebase Admin SDK:", error.message);
  // Depending on your app's requirements, you might want to exit here
  // if Firebase auth is critical.
  // process.exit(1);
}

// Make Firebase Admin available globally
global.admin = admin;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/puzzle", puzzleRoutes);

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Initialize and start server
async function startServer() {
  try {
    // Ensure puzzle directories exist
    const DAILY_PUZZLE_DIR = path.join(__dirname, "puzzles", "daily");
    const WEEKLY_PUZZLE_DIR = path.join(__dirname, "puzzles", "weekly");

    await fs.access(DAILY_PUZZLE_DIR).catch(() => {
      fs.mkdir(DAILY_PUZZLE_DIR, { recursive: true });
    });

    await fs.access(WEEKLY_PUZZLE_DIR).catch(() => {
      fs.mkdir(WEEKLY_PUZZLE_DIR, { recursive: true });
    });

    // ADD THESE TWO FUNCTION CALLS HERE:
    // Initialize daily puzzle system
    await initializeDailyPuzzle();
    scheduleNextPuzzleGeneration();

    await initializeWeeklyConfig();
    scheduleNextWeeklyConfigGeneration();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Available endpoints:`);
      console.log(`  POST /api/auth/google`);
      console.log(`  POST /api/auth/guest`);
      console.log(`  GET /api/auth/verify`);
      console.log(`  GET /api/puzzle/daily.json`);
      console.log(`  GET /api/puzzle/weekly.json`);
      console.log(`  GET /api/puzzle/custom.json`);
      console.log(`  GET /api/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
