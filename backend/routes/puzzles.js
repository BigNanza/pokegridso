const express = require("express");
const path = require("path");
const fs = require("fs").promises;
const fsSync = require("fs");
const router = express.Router();
const cron = require("node-cron");
const {
  getDailyPuzzleDateToServe,
  generateDailyPuzzle,
} = require("../utils/daily");
const {
  getWeeklyConfigDateToServe,
  generateWeeklyConfig,
} = require("../utils/weekly");
const { generatePuzzle } = require("../utils/utils");
const { generateCustomPuzzle } = require("../utils/custom");

const puzzleCache = new Map();

// --- Cache and Cleanup ---

// Cache cleanup function
function cleanupCache() {
  const now = Date.now();
  for (const [key, value] of puzzleCache.entries()) {
    // Remove expired cache entries (older than 1 hour)
    if (now - value.timestamp > 3600000) {
      puzzleCache.delete(key);
    }
  }
}

// Run cleanup every 30 minutes
setInterval(cleanupCache, 1800000);

// --- Authentication Middleware ---

const authenticateFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    req.user = null;
    next();
    return;
  }

  try {
    // Access admin through global object or require it
    const admin = require("firebase-admin");
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.warn("Firebase token verification failed:", error.message);
    req.user = null;
    next();
  }
};

// Daily Puzzle Endpoint
router.get("/daily.json", authenticateFirebaseToken, async (req, res) => {
  try {
    const puzzleDateToServe = getDailyPuzzleDateToServe();
    console.log(`Serving daily puzzle for date: ${puzzleDateToServe}`);
    const cacheKey = `daily-${puzzleDateToServe}`;

    if (puzzleCache.has(cacheKey)) {
      const cached = puzzleCache.get(cacheKey);
      const userPuzzleData = {
        ...cached.data,
        userId: req.user?.uid || null, // Changed from userId to uid
        isGuest: !req.user, // If no user, treat as guest
      };
      res.set("Cache-Control", "public, max-age=1800");
      res.set("ETag", `"${cached.data.id}"`);
      return res.json(userPuzzleData);
    }

    const fileName = `${puzzleDateToServe}.json`;
    const filePath = path.join(__dirname, "..", "puzzles", "daily", fileName);

    try {
      await fs.access(filePath, fs.constants.F_OK);
      const fileContent = await fs.readFile(filePath, "utf8");
      const puzzleData = JSON.parse(fileContent);

      puzzleCache.set(cacheKey, {
        data: puzzleData,
        timestamp: Date.now(),
      });

      const userPuzzleData = {
        ...puzzleData,
        userId: req.user?.uid || null, // Changed from userId to uid
        isGuest: !req.user, // If no user, treat as guest
      };

      res.set("Cache-Control", "public, max-age=1800");
      res.set("ETag", `"${puzzleData.id}"`);
      res.json(userPuzzleData);
    } catch (fileError) {
      if (fileError.code === "ENOENT") {
        console.warn(
          `Puzzle file for ${puzzleDateToServe} missing when requested. Attempting to generate...`
        );
        try {
          const dailyPuzzle = await generateDailyPuzzle(puzzleDateToServe);
          const userPuzzleData = {
            ...dailyPuzzle,
            userId: req.user?.uid || null, // Changed from userId to uid
            isGuest: !req.user, // If no user, treat as guest
          };
          res.set("Cache-Control", "public, max-age=1800");
          res.set("ETag", `"${dailyPuzzle.id}"`);
          return res.json(userPuzzleData);
        } catch (genError) {
          console.error(
            `Failed to generate missing puzzle for ${puzzleDateToServe}:`,
            genError
          );
          return res
            .status(500)
            .json({ error: "Failed to fetch or generate daily puzzle" });
        }
      }
      throw fileError;
    }
  } catch (error) {
    console.error("Error fetching daily puzzle:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to fetch daily puzzle" });
    }
  }
});

// Updated Weekly Config Endpoint
router.get("/weekly.json", authenticateFirebaseToken, async (req, res) => {
  try {
    // Determine the Sunday of the week whose config should be served now
    const configDateToServe = getWeeklyConfigDateToServe();
    console.log(
      `Serving weekly puzzle for week starting Sunday: ${configDateToServe}`
    );
    const cacheKey = `weekly-config-${configDateToServe}`;

    // Check in-memory cache first (only for the base config, not the generated puzzle)
    let configData;
    if (puzzleCache.has(cacheKey)) {
      const cached = puzzleCache.get(cacheKey);
      configData = cached.data;
    } else {
      // Define file path based on the Sunday
      const fileName = `${configDateToServe}.json`;
      const filePath = path.join(
        __dirname,
        "..",
        "puzzles",
        "weekly",
        fileName
      );

      try {
        await fs.access(filePath, fs.constants.F_OK);
        const fileContent = await fs.readFile(filePath, "utf8");
        configData = JSON.parse(fileContent);

        // Cache the config data for future use
        puzzleCache.set(cacheKey, {
          data: configData,
          timestamp: Date.now(),
        });
      } catch (fileError) {
        if (fileError.code === "ENOENT") {
          console.warn(
            `Weekly config file for Sunday ${configDateToServe} missing when requested. Attempting to generate...`
          );
          try {
            configData = await generateWeeklyConfig(configDateToServe);
          } catch (genError) {
            console.error(
              `Failed to generate missing weekly config for Sunday ${configDateToServe}:`,
              genError
            );
            return res
              .status(500)
              .json({ error: "Failed to fetch or generate weekly config" });
          }
        } else {
          throw fileError;
        }
      }
    }

    // Generate the puzzle using the config - DO NOT cache this result
    const weeklyPuzzle = generatePuzzle(configData);
    weeklyPuzzle["type"] = "WEEKLY";
    weeklyPuzzle["id"] = `weekly-${configDateToServe}`;
    // Add user-specific data to the generated puzzle
    const userPuzzleData = {
      ...weeklyPuzzle,
      userId: req.user?.uid || null, // Changed from userId to uid
      isGuest: !req.user, // If no user, treat as guest
    };

    // Set headers to prevent caching for weekly puzzles
    res.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, proxy-revalidate"
    );
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    res.set(
      "ETag",
      `"${configData.weekStarting || configData.id || "weekly-config"}"`
    );

    return res.json(userPuzzleData);
  } catch (error) {
    console.error("Error fetching weekly puzzle:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: "Failed to fetch weekly puzzle" });
    }
  }
});

// Custom Puzzle Endpoint
router.get("/custom.json", authenticateFirebaseToken, async (req, res) => {
  try {
    const { categories, winCon, pp, options, maxRepeats } = req.query;

    const customPuzzle = generateCustomPuzzle({
      categories,
      winCon,
      pp,
      options,
      maxRepeats,
      userId: req.user?.uid || null, // Changed from userId to uid
      isGuest: !req.user, // If no user, treat as guest
    });

    res.json(customPuzzle);
  } catch (error) {
    console.error("Error generating custom puzzle:", error);

    if (error.status === 400) {
      return res.status(400).json({ error: error.message });
    }

    if (error.code === "ENOENT") {
      return res.status(500).json({ error: "Required data file not found" });
    }

    if (!res.headersSent) {
      res.status(500).json({
        error: "Failed to generate custom puzzle",
        message: error.message,
      });
    }
  }
});

module.exports = router;
