// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises;
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const puzzleRoutes = require("./routes/puzzles");
const { initializeDatabase } = require("./db/init");
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

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/puzzle", puzzleRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Initialize and start server
async function startServer() {
  try {
    // Initialize database
    initializeDatabase();

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
