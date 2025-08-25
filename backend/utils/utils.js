const fsSync = require("fs");
const path = require("path");
const { TIMEZONE } = require("../config/constants");

// Function to generate custom puzzle
function generatePuzzle(config) {
  // ... (keep your existing generatePuzzle logic) ...
  console.log(config);
  let game = {};

  try {
    const { categories, winCondition, gameOptions } = config;
    const { isMinimum, isSecond, targetMetric } = winCondition;
    const { limitedGuesses, showAllOptions, maxRepeats } = gameOptions;
    const dolFilePath = path.join(__dirname, "..", "data", "dictoflists.json");
    const dolFileContent = fsSync.readFileSync(dolFilePath, "utf8");
    const dictoflists = JSON.parse(dolFileContent);

    const clFilePath = path.join(__dirname, "..", "data", "categoryList.json");
    const clFileContent = fsSync.readFileSync(clFilePath, "utf8");
    const categoryList = JSON.parse(clFileContent);

    const cutDownDictOfLists = getCutDownDictOfLists(dictoflists, categories);

    if (!validateCutDownDictOfLists(cutDownDictOfLists)) {
      throw new Error(
        "The selected categories cannot make any possible boards. Please select different categories."
      );
    }

    game["date"] = new Date().toISOString();
    game["completed"] = false;
    game["method"] = "AUTOMATIC";
    game["winCondition"] = targetMetric;
    game["second"] = isSecond;
    game["minimum"] = isMinimum;
    game["pp"] = limitedGuesses ? 9 : null;
    game["options"] = showAllOptions;
    game["config"] = config;
    // Initialize a 3x3 grid of boxes
    game["boxes"] = Array(3)
      .fill(null)
      .map(() =>
        Array(3)
          .fill(null)
          .map(() => ({
            guess: null,
            sprite: null,
            percentage: null,
          }))
      );

    Object.assign(
      game,
      generateCategories(cutDownDictOfLists, categoryList, maxRepeats)
    );

    return game;
  } catch (error) {
    console.error("Error generating custom puzzle:", error);
    throw error;
  }
}

function generateCategories(cutDownDictOfLists, categoryList, maxRepeats) {
  // ... (keep your existing generateCategories logic) ...
  const findCommonNumbers = (arr1, arr2, arr3) => {
    const filteredArr1 = arr1.slice(2);
    const filteredArr2 = arr2.slice(2);
    const filteredArr3 = arr3.slice(2);

    const set1 = new Set(filteredArr1);
    const commonWithArr2 = filteredArr2.filter((num) => set1.has(num));
    const set2 = new Set(commonWithArr2);
    const commonWithArr3 = filteredArr3.filter((num) => set2.has(num));

    return commonWithArr3;
  };

  // Add maxRepeats validation
  const isValidWithMaxRepeats = (categories) => {
    // If maxRepeats is 0 or not set, skip validation
    if (!maxRepeats || maxRepeats <= 0) return true;

    // Count category types
    const typeCounts = {};
    for (const category of categories) {
      const type = getCategoryType(category);
      typeCounts[type] = (typeCounts[type] || 0) + 1;

      // If any type exceeds maxRepeats, return false
      if (typeCounts[type] > maxRepeats) {
        return false;
      }
    }
    return true;
  };

  let attempts = 0;
  const maxAttempts = 1000; // Prevent infinite loops

  while (attempts < maxAttempts) {
    attempts++;

    // Create a deep copy to avoid modifying the original data
    let workingCopy = JSON.parse(JSON.stringify(cutDownDictOfLists));

    // Select a random primary category (key) from the dictionary
    let primaryCategoryKeys = Object.keys(workingCopy);
    let primaryCategoryKey =
      primaryCategoryKeys[
        Math.floor(Math.random() * primaryCategoryKeys.length)
      ];

    // Get the list of associated values for the primary category
    let primaryCategoryList = workingCopy[primaryCategoryKey];

    // Skip if the list doesn't have enough items
    if (primaryCategoryList.length < 3) continue;

    // Generate 3 opposing categories from the primary list
    let opposingCategories = [];
    let tempList = [...primaryCategoryList];

    for (let i = 0; i < 3; i++) {
      // Select a random item from the temporary list
      let randomIndex = Math.floor(Math.random() * tempList.length);
      let selectedCategory = tempList[randomIndex];

      // Verify the selected category has enough associated items
      if (workingCopy[selectedCategory].length < 3) {
        i--;
        tempList.splice(randomIndex, 1);
        continue;
      }

      opposingCategories.push(selectedCategory);
      tempList.splice(randomIndex, 1);
    }

    // Find common numbers among the three opposing categories
    const firstOpposingList = workingCopy[opposingCategories[0]];
    const secondOpposingList = workingCopy[opposingCategories[1]];
    const thirdOpposingList = workingCopy[opposingCategories[2]];
    let commonNumbers = findCommonNumbers(
      firstOpposingList,
      secondOpposingList,
      thirdOpposingList
    );

    // Need at least 2 common numbers to proceed
    if (commonNumbers.length < 2) continue;

    // Build the final category set
    let finalCategories = [];

    // Add the primary category
    finalCategories.push(parseInt(primaryCategoryKey));

    // Add 2 random common numbers
    for (let i = 0; i < 2; i++) {
      let randomIndex = Math.floor(Math.random() * commonNumbers.length);
      finalCategories.push(commonNumbers[randomIndex]);
      commonNumbers.splice(randomIndex, 1);
    }

    // Add the three opposing categories
    finalCategories.push(opposingCategories[0]);
    finalCategories.push(opposingCategories[1]);
    finalCategories.push(opposingCategories[2]);

    // Validate uniqueness of all categories
    if (new Set(finalCategories).size !== finalCategories.length) {
      continue;
    }

    // Check for undefined values
    if (finalCategories.some((element) => element === undefined)) {
      console.error("UNDEFINED VALUE DETECTED IN CATEGORIES");
      continue;
    }

    // Check maxRepeats constraint
    if (!isValidWithMaxRepeats(finalCategories)) {
      continue; // Restart if maxRepeats constraint is violated
    }

    // Return the structured category set
    return {
      xCategories: [
        getRealCategory(finalCategories[0], categoryList),
        getRealCategory(finalCategories[1], categoryList),
        getRealCategory(finalCategories[2], categoryList),
      ],
      yCategories: [
        getRealCategory(finalCategories[3], categoryList),
        getRealCategory(finalCategories[4], categoryList),
        getRealCategory(finalCategories[5], categoryList),
      ],
    };
  }

  // If we've exceeded max attempts, throw an error
  throw new Error(
    "Unable to generate categories within maxRepeats constraint after " +
      maxAttempts +
      " attempts"
  );
}

function getRealCategory(category, categoryList) {
  // ... (keep your existing getRealCategory logic) ...
  return {
    type: getCategoryType(category),
    name: categoryList["categoryList"][category] || "Unknown",
  };
}

function getCategoryType(category) {
  // ... (keep your existing getCategoryType logic) ...
  if (category === 0 || category === 23) return "Mono/Dual Type";
  if (category >= 1 && category <= 18) return "Types";
  if (category >= 19 && category <= 22) return "Groups";
  if (category >= 24 && category <= 27) return "Evos";
  if (category >= 28 && category <= 37) return "Colors";
  if (category >= 38 && category <= 41) return "Abil";
  if (category >= 42 && category <= 50) return "Generations";
  if (category >= 51 && category <= 969) return "Moves";
  if (category >= 970 && category <= 982) return "Evolution Triggers";
  if (category >= 983 && category <= 1289) return "Abilities";
  if (category >= 1290 && category <= 1304) return "Egg Groups";
  if (category >= 1305 && category <= 1309) return "Gender Rates";
  if (category >= 1310 && category <= 1315) return "Growth Rates";
  if (category >= 1316 && category <= 1329) return "Shapes";
  return "Unknown";
}

function getCutDownDictOfLists(dictoflists, categories) {
  // ... (keep your existing getCutDownDictOfLists logic) ...
  // Deep clone the dictionary to avoid modifying the original
  let dictionary = JSON.parse(JSON.stringify(dictoflists));

  // Build purge list based on categories
  let purgeList = [];

  if (!categories.includes(0)) {
    purgeList.push(0);
    purgeList.push(23);
  }
  if (!categories.includes(1)) {
    for (let i = 1; i <= 18; i++) {
      purgeList.push(i);
    }
  }
  if (!categories.includes(2)) {
    for (let i = 19; i <= 22; i++) {
      purgeList.push(i);
    }
  }
  if (!categories.includes(3)) {
    for (let i = 24; i <= 27; i++) {
      purgeList.push(i);
    }
  }
  if (!categories.includes(4)) {
    for (let i = 28; i <= 37; i++) {
      purgeList.push(i);
    }
  }
  if (!categories.includes(5)) {
    for (let i = 38; i <= 41; i++) {
      purgeList.push(i);
    }
  }
  if (!categories.includes(6)) {
    for (let i = 42; i <= 50; i++) {
      purgeList.push(i);
    }
  }
  if (!categories.includes(7)) {
    for (let i = 51; i <= 969; i++) {
      purgeList.push(i);
    }
  }
  if (!categories.includes(8)) {
    for (let i = 970; i <= 982; i++) {
      purgeList.push(i);
    }
  }
  if (!categories.includes(9)) {
    for (let i = 983; i <= 1289; i++) {
      purgeList.push(i);
    }
  }
  if (!categories.includes(10)) {
    for (let i = 1290; i <= 1304; i++) {
      purgeList.push(i);
    }
  }
  if (!categories.includes(11)) {
    for (let i = 1305; i <= 1309; i++) {
      purgeList.push(i);
    }
  }
  if (!categories.includes(12)) {
    for (let i = 1310; i <= 1315; i++) {
      purgeList.push(i);
    }
  }
  if (!categories.includes(13)) {
    for (let i = 1316; i <= 1329; i++) {
      purgeList.push(i);
    }
  }

  // Convert purgeList to Set for faster lookup
  const purgeSet = new Set(purgeList);

  // Filter the dictionary
  for (const key of Object.keys(dictionary)) {
    if (purgeSet.has(Number(key))) {
      delete dictionary[key];
    } else {
      // Filter the associated list to remove purgeList values
      dictionary[key] = dictionary[key].filter((value) => !purgeSet.has(value));
    }
  }

  return dictionary;
}

function validateCutDownDictOfLists(cutDownDictOfLists) {
  // ... (keep your existing validateCutDownDictOfLists logic) ...
  const threeValuesCommon = (a, b, c) => {
    let listA = cutDownDictOfLists[a];
    let listB = cutDownDictOfLists[b];
    let listC = cutDownDictOfLists[c];

    let commonValues = new Set();

    for (let value of listA) {
      if (listB && listC && listB.includes(value) && listC.includes(value)) {
        commonValues.add(value);
      }

      if (commonValues.size >= 3) {
        return true;
      }
    }

    return commonValues.size >= 3;
  };

  // Iterate through each key-value pair in the dictionary
  for (const [key, valueList] of Object.entries(cutDownDictOfLists)) {
    // Skip lists with fewer than 4 items
    if (valueList.length < 4) continue;

    const keyAsNumber = parseInt(key, 10);

    // Check all combinations of three different values from the list
    for (let i = 0; i < valueList.length; i++) {
      const firstValue = valueList[i];
      if (firstValue === keyAsNumber) continue;

      for (let j = i + 1; j < valueList.length; j++) {
        const secondValue = valueList[j];
        if (secondValue === keyAsNumber) continue;

        for (let k = j + 1; k < valueList.length; k++) {
          const thirdValue = valueList[k];
          if (thirdValue === keyAsNumber) continue;

          if (threeValuesCommon(firstValue, secondValue, thirdValue)) {
            return true;
          }
        }
      }
    }
  }

  return false;
}

function getDatePartsInTimezone(date) {
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
    formatter.formatToParts(date).map((p) => [p.type, p.value])
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parseInt(parts.hour, 10),
    minute: parseInt(parts.minute, 10),
  };
}

function formatDateForFile(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
module.exports = {
  generatePuzzle,
  getDatePartsInTimezone,
  formatDateForFile,
};
