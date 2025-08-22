// utils/daily.js
//
// Handles logic for generating, serving, and scheduling daily puzzles.
//

const { generatePuzzle } = require("./utils");
const {
  DAILY_PUZZLE_TIME,
  TIMEZONE,
  DAILY_PUZZLE_GENERATION_OFFSET_MINUTES,
} = require("../config/constants");
const cron = require("node-cron");
const fs = require("fs").promises;
const path = require("path");

let puzzleGenerationTask = null; // Holds the scheduled cron task

/**
 * Initialize daily puzzle logic on server start.
 * Ensures that the puzzle corresponding to "today's serving date" exists.
 * If missing, it will be generated immediately.
 *
 * @returns {Promise<void>}
 */
async function initializeDailyPuzzle() {
  try {
    const dateToServe = getDailyPuzzleDateToServe();
    const filePath = path.join(
      __dirname,
      "..",
      "puzzles",
      "daily",
      `${dateToServe}.json`
    );

    try {
      await fs.access(filePath, fs.constants.F_OK);
      console.log(`Daily puzzle file for ${dateToServe} already exists.`);
    } catch (err) {
      if (err.code === "ENOENT") {
        console.log(
          `Daily puzzle for ${dateToServe} not found. Generating now...`
        );
        await generateDailyPuzzle(dateToServe);
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error("Error initializing daily puzzle:", err);
  }
}

/**
 * Get the date string (YYYY-MM-DD) of the puzzle that should be served *now*.
 *
 * Rules:
 * - Before DAILY_PUZZLE_TIME → serve yesterday's puzzle
 * - At or after DAILY_PUZZLE_TIME → serve today's puzzle
 *
 * @returns {string} Date string (YYYY-MM-DD) to serve
 */
function getDailyPuzzleDateToServe() {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat("sv-SE", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter.formatToParts(now).map((p) => [p.type, p.value])
  );
  const currentDate = `${parts.year}-${parts.month}-${parts.day}`;
  const currentHour = parseInt(parts.hour, 10);
  const currentMinute = parseInt(parts.minute, 10);

  if (
    currentHour < DAILY_PUZZLE_TIME.hour ||
    (currentHour === DAILY_PUZZLE_TIME.hour &&
      currentMinute < DAILY_PUZZLE_TIME.minute)
  ) {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const yFormatter = new Intl.DateTimeFormat("sv-SE", {
      timeZone: TIMEZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return yFormatter.format(yesterday);
  }

  return currentDate;
}

/**
 * Generate a daily puzzle for a given date string.
 *
 * @param {string} [dateString] - Optional date string (YYYY-MM-DD). Defaults to today's date.
 * @returns {Promise<object>} The generated puzzle object
 */
async function generateDailyPuzzle(dateString) {
  try {
    // Pick target date
    let targetDate;
    if (typeof dateString === "string") {
      targetDate = dateString;
    } else {
      const formatter = new Intl.DateTimeFormat("sv-SE", {
        timeZone: TIMEZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      targetDate = formatter.format(new Date());
    }

    console.log(`Generating daily puzzle for ${targetDate}`);

    // Build puzzle data
    const dailyPuzzle = generatePuzzle(generateDailyPuzzleConfig());
    dailyPuzzle.type = "DAILY";
    dailyPuzzle.id = `dailypuzzle-${targetDate}`;

    // Save puzzle to file
    const filePath = path.join(
      __dirname,
      "..",
      "puzzles",
      "daily",
      `${targetDate}.json`
    );
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(dailyPuzzle, null, 2));

    console.log(`Daily puzzle for ${targetDate} saved to ${filePath}`);
    return dailyPuzzle;
  } catch (err) {
    console.error(
      `Error generating daily puzzle (${dateString || "today"}):`,
      err
    );
    throw err;
  }
}

/**
 * Build the randomized configuration for a daily puzzle.
 *
 * Categories are chosen randomly with weighted probabilities.
 * A target metric is selected with weighted randomness.
 * Additional game options (win condition, repeats, etc.) are randomized as well.
 *
 * @returns {{
 *   categories: number[],
 *   winCondition: {
 *    isMinimum: boolean,
 *    isSecond: boolean,
 *    targetMetric: number
 *   },
 *   gameOptions: {
 *     limitedGuesses: boolean,
 *     showAllOptions: boolean,
 *     maxRepeats: number
 *   }
 * }}
 */
function generateDailyPuzzleConfig() {
  const categories = [];
  if (Math.random() < 1.0) categories.push(0); // Mono/Dual Type
  if (Math.random() < 0.9) categories.push(1); // Types
  if (Math.random() < 0.75) categories.push(2); // Groups
  if (Math.random() < 0.75) categories.push(3); // Evos
  if (Math.random() < 0.375) categories.push(4); // Colors
  if (Math.random() < 0.25) categories.push(5); // Abilities
  if (Math.random() < 0.5) categories.push(6); // Generations
  if (Math.random() < 0.0625) categories.push(7); // Moves
  if (Math.random() < 0.25) categories.push(8); // Evolution Triggers
  if (Math.random() < 0.125) categories.push(9); // Abilities
  if (Math.random() < 0.125) categories.push(10); // Egg Groups
  if (Math.random() < 0.0625) categories.push(11); // Gender Rates
  if (Math.random() < 0.0625) categories.push(12); // Growth Rates
  if (Math.random() < 0.125) categories.push(13); // Shapes

  const isMinimum = Math.random() < 0.25;
  const isSecond = Math.random() < 0.03125;

  const metrics = [
    { id: 0, weight: 5 },
    { id: 1, weight: 2.5 },
    { id: 2, weight: 5 },
    { id: 3, weight: 2.5 },
    { id: 4, weight: 5 },
    { id: 5, weight: 5 },
    { id: 6, weight: 3 },
    { id: 7, weight: 1.67 },
    { id: 8, weight: 3 },
    { id: 9, weight: 3 },
    { id: 10, weight: 3 },
    { id: 11, weight: 3 },
    { id: 12, weight: 3 },
    { id: 13, weight: 2.5 },
    { id: 14, weight: 2.5 },
    { id: 15, weight: 3 },
    { id: 16, weight: 1.67 },
    { id: 17, weight: 3 },
    { id: 18, weight: 1.25 },
    { id: 19, weight: 3 },
    { id: 20, weight: 1.25 },
  ];
  let r = Math.random() * metrics.reduce((s, m) => s + m.weight, 0);
  const targetMetric = metrics.find((m) => (r -= m.weight) < 0).id;

  // Weighted choice for maxRepeats (favors 3 & 4)
  const values = [1, 2, 3, 4, 5, 6];
  const weights = [1, 20, 40, 20, 8, 4];
  r = Math.random() * weights.reduce((a, b) => a + b);
  const maxRepeats = values[weights.findIndex((w) => (r -= w) < 0)];

  return {
    categories,
    winCondition: { isMinimum, isSecond, targetMetric },
    gameOptions: {
      limitedGuesses: false,
      showAllOptions: false,
      maxRepeats,
    },
  };
}

/**
 * Schedule the daily puzzle generation job via cron.
 * Cancels any existing job before rescheduling.
 *
 * @returns {void}
 */
function scheduleNextPuzzleGeneration() {
  if (puzzleGenerationTask) {
    puzzleGenerationTask.stop();
    console.log("Previous daily puzzle generation task stopped.");
  }

  // Adjust generation time by offset
  let genHour = DAILY_PUZZLE_TIME.hour;
  let genMinute =
    DAILY_PUZZLE_TIME.minute - DAILY_PUZZLE_GENERATION_OFFSET_MINUTES;
  let genSecond = DAILY_PUZZLE_TIME.second || 0;

  if (genMinute < 0) {
    genHour -= 1;
    genMinute += 60;
    if (genHour < 0) genHour += 24;
  }

  const cronExpression = `${String(genSecond).padStart(2, "0")} ${String(
    genMinute
  ).padStart(2, "0")} ${String(genHour).padStart(2, "0")} * * *`;

  console.log(
    `Scheduling daily puzzle generation with cron: ${cronExpression} (${TIMEZONE})`
  );

  puzzleGenerationTask = cron.schedule(
    cronExpression,
    async () => {
      try {
        console.log(
          `Daily cron job triggered: Generating puzzle for ${new Date().toISOString()}.`
        );
        await generateDailyPuzzle();
        console.log("Daily puzzle generation completed successfully.");
      } catch (err) {
        console.error("Error during scheduled daily puzzle generation:", err);
      }
    },
    { timezone: TIMEZONE }
  );
}

module.exports = {
  getDailyPuzzleDateToServe,
  generateDailyPuzzle,
  initializeDailyPuzzle,
  scheduleNextPuzzleGeneration,
};
