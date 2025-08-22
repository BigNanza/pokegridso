const DAILY_PUZZLE_TIME = {
  hour: 6,
  minute: 0,
  second: 0,
};
const DAILY_PUZZLE_GENERATION_OFFSET_MINUTES = 30; // How many minutes before the daily puzzle time to generate the new puzzle
const TIMEZONE = "America/New_York"; // EST timezone
const WEEK_START_DAY = 0; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday. Defaulting to Sunday as requested.

module.exports = {
  DAILY_PUZZLE_TIME,
  TIMEZONE,
  WEEK_START_DAY,
  DAILY_PUZZLE_GENERATION_OFFSET_MINUTES,
};
