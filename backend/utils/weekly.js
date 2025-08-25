// utils/weekly.js
//
// Handles logic for generating, serving, and scheduling weekly puzzle configurations.
//

const {
  DAILY_PUZZLE_TIME,
  TIMEZONE,
  DAILY_PUZZLE_GENERATION_OFFSET_MINUTES,
  WEEK_START_DAY,
} = require("../config/constants");
const { getDatePartsInTimezone, formatDateForFile } = require("./utils");
const cron = require("node-cron");
const fs = require("fs").promises;
const path = require("path");

let weeklyConfigGenerationTask = null; // Holds the scheduled cron task

/**
 * Get the start day (e.g., Sunday or configured WEEK_START_DAY) for the week containing a given date.
 *
 * @param {Date|string|number} targetDate - The reference date (Date object, timestamp, or parseable string).
 * @param {number} [startDay=WEEK_START_DAY] - Start of week (0=Sunday, 1=Monday, etc.).
 * @returns {string} Date string (YYYY-MM-DD) representing the start of the week in TIMEZONE.
 */
function getStartDayOfWeek(date, startDay) {
  const day = date.getDay();
  const diff = (day - startDay + 7) % 7;
  const startDate = new Date(date);
  startDate.setDate(date.getDate() - diff);
  return startDate;
}

/**
 * Get the weekly config start date (e.g., Sunday) that should be *served* now.
 *
 * Rules:
 * - If today is WEEK_START_DAY and before DAILY_PUZZLE_TIME → serve last week's config.
 * - Otherwise → serve this week's config.
 *
 * @returns {string} Date string (YYYY-MM-DD) representing the weekly config to serve.
 */
function getWeeklyConfigDateToServe() {
  const now = new Date();
  const { year, month, day, hour, minute } = getDatePartsInTimezone(now);

  const currentDay = new Date(`${year}-${month}-${day}T00:00:00`).getDay();
  const isStartDay = currentDay === WEEK_START_DAY;

  const isBeforeServingTime =
    hour < DAILY_PUZZLE_TIME.hour ||
    (hour === DAILY_PUZZLE_TIME.hour && minute < DAILY_PUZZLE_TIME.minute);

  const targetDate = new Date(`${year}-${month}-${day}T00:00:00`);

  if (isStartDay && isBeforeServingTime) {
    targetDate.setDate(targetDate.getDate() - 7); // Go back one week
  }

  return getStartDayOfWeek(targetDate, WEEK_START_DAY);
}

/**
 * Get the weekly config start date (e.g., Sunday) that should be *generated* now.
 *
 * Always returns the start of the *upcoming* week.
 *
 * @returns {string} Date string (YYYY-MM-DD) representing the start of the next week.
 */
function getWeeklyConfigDateToGenerate() {
  const now = new Date();
  const { currentDateStr } = getDatePartsInTimezone(now, false);

  const currentDay = new Date(`${currentDateStr}T00:00:00`).getDay();
  const daysUntilStart = (WEEK_START_DAY - currentDay + 7) % 7;

  const nextStartDate = new Date(`${currentDateStr}T00:00:00`);
  nextStartDate.setDate(
    nextStartDate.getDate() + (daysUntilStart === 0 ? 7 : daysUntilStart)
  );

  return getStartDayOfWeek(nextStartDate, WEEK_START_DAY);
}

/**
 * Generate a weekly puzzle configuration and save it to disk.
 *
 * @param {string} [weekStartDate] - Optional YYYY-MM-DD date string for the week start. Defaults to upcoming week.
 * @returns {Promise<object>} The generated weekly configuration object.
 */

async function generateWeeklyConfig(targetDate) {
  const weekStartStr = formatDateForFile(targetDate); // ✅ instead of Date.toString()
  const filePath = path.join(
    __dirname,
    "..",
    "puzzles",
    "weekly",
    `${weekStartStr}.json`
  );

  const config = {
    /* your weekly puzzle config generation logic */
  };

  await fs.writeFile(filePath, JSON.stringify(config, null, 2), "utf8");
  return config;
}

/**
 * Placeholder implementation of weekly config generation.
 * Replace this with real weekly puzzle generation logic.
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
function generateWeeklyPuzzleConfig() {
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
const values = [1, 2, 3, 4, 5, 6];
const weights = [1, 20, 40, 20, 8, 4];
r = Math.random() * weights.reduce((a, b) => a + b);
const maxRepeats = values[weights.findIndex((w) => (r -= w) < 0)];
const limitedGuesses = false;
const showAllOptions = false;
/**
 * Ensure the weekly config for the current serving week exists.
 * Called on server startup.
 *
 * @returns {Promise<void>}
 */
async function initializeWeeklyConfig() {
  try {
    const currentWeekStart = formatDateForFile(getWeeklyConfigDateToServe());
    const filePath = path.join(
      __dirname,
      "..",
      "puzzles",
      "weekly",
      `${currentWeekStart}.json`
    );

    try {
      await fs.access(filePath, fs.constants.F_OK);
      console.log(
        `Weekly config for week starting ${currentWeekStart} already exists.`
      );
    } catch (err) {
      if (err.code === "ENOENT") {
        console.log(
          `Weekly config for week starting ${currentWeekStart} not found. Generating now...`
        );
        await generateWeeklyConfig(currentWeekStart);
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error("Error initializing weekly config:", err);
  }
}

/**
 * Schedule the weekly puzzle config generation job via cron.
 * Cancels any existing job before rescheduling.
 *
 * @returns {void}
 */
function scheduleNextWeeklyConfigGeneration() {
  if (weeklyConfigGenerationTask) {
    weeklyConfigGenerationTask.stop();
    console.log("Previous weekly config generation task stopped.");
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
  ).padStart(2, "0")} ${String(genHour).padStart(
    2,
    "0"
  )} * * ${WEEK_START_DAY}`;

  console.log(
    `Scheduling weekly config generation: ${cronExpression} (${TIMEZONE})`
  );

  weeklyConfigGenerationTask = cron.schedule(
    cronExpression,
    async () => {
      try {
        console.log(
          "Weekly cron job triggered: generating config for upcoming week..."
        );
        await generateWeeklyConfig();
        console.log("Weekly config generation completed.");
      } catch (err) {
        console.error("Error during scheduled weekly config generation:", err);
      }
    },
    { timezone: TIMEZONE }
  );
}

module.exports = {
  getWeeklyConfigDateToServe,
  generateWeeklyConfig,
  initializeWeeklyConfig,
  scheduleNextWeeklyConfigGeneration,
};
