const { generatePuzzle } = require("./utils");

// utils/generateCustomPuzzle.js
function generateCustomPuzzle({
  categories,
  winCon,
  pp,
  options,
  maxRepeats,
  userId,
  isGuest,
}) {
  // Keep all your parsing, sorting, and validation exactly as before
  let parsedCategories = [];
  let parsedWinCon = [];
  let parsedPp = false;
  let parsedOptions = false;
  let parsedMaxRepeats = 0;

  try {
    parsedCategories = categories ? JSON.parse(categories) : [];
    parsedWinCon = winCon ? JSON.parse(winCon) : [false, false, 0];
    parsedPp = pp === "true";
    parsedOptions = options === "true";
    parsedMaxRepeats = maxRepeats ? parseInt(maxRepeats, 10) : 0;
  } catch (parseError) {
    throw { status: 400, message: "Invalid parameter format" };
  }

  if (!Array.isArray(parsedCategories) || !Array.isArray(parsedWinCon)) {
    throw { status: 400, message: "Invalid parameter types" };
  }

  parsedCategories.sort((a, b) => a - b);

  // Generate the puzzle using the existing generatePuzzle function
  const customPuzzle = generatePuzzle({
    categories: parsedCategories,
    winCondition: {
      isMinimum: parsedWinCon[0] || false,
      isSecond: parsedWinCon[1] || false,
      targetMetric: parsedWinCon[2] || 0,
    },
    gameOptions: {
      limitedGuesses: parsedPp,
      showAllOptions: parsedOptions,
      maxRepeats: parsedMaxRepeats,
    },
  });

  customPuzzle["type"] = "CUSTOM";
  customPuzzle["userId"] = userId || null;
  customPuzzle["isGuest"] = isGuest || false;
  customPuzzle["id"] = "custompuzzle-" + categories.toString();

  return customPuzzle;
}

module.exports = {
  generateCustomPuzzle,
};
