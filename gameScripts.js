const modal = document.getElementById("myModal");
const closeModalBtn = document.querySelector(".close");
const pokePickerInput = document.getElementById("poke-picker");
const suggestionsList = document.getElementById("suggestions-list");

let keywords = [];
let currentIndex = -1; // This will track the currently selected suggestion
let selectedKeyword = null; // This will track the selected keyword (either typed or clicked)
let id = -1;
let categories = [];
let numbersLeft = [1, 2, 3, 4, 5, 6, 7, 8, 9];
let overallPercentage = 0;
let legalCategories;
let winCon;
let pp;
let currPP = 9;
let currDictOfLists;
let categoryList;
let pokemonData;
let dictoflists;

fetch("keywords.json")
  .then((response) => response.json())
  .then((data) => {
    // Populate the keywords array from the JSON file
    keywords = data["keywords"];
  })
  .catch((error) => console.error("Error loading the JSON file:", error));
fetch("categoryList.json")
  .then((response) => response.json())
  .then((data) => {
    // Populate the keywords array from the JSON file
    categoryList = data["categoryList"];
  })
  .catch((error) => console.error("Error loading the JSON file:", error));
fetch("pokemonData.json")
  .then((response) => response.json())
  .then((data) => {
    // Populate the keywords array from the JSON file
    pokemonData = data;
  })
  .catch((error) => console.error("Error loading the JSON file:", error));
fetch("dictoflists.json")
  .then((response) => response.json())
  .then((data) => {
    const params = getURLParams();

    if (!validateParams(params)) {
      // Redirect to index.html if parameters are invalid
      //console.log("Param issue");
      window.location.href = "index.html";
      return;
    }
    if (!pp) document.getElementById("headerPP").style.display = "none";
    // Populate the keywords array from the JSON file
    dictoflists = data;
    currDictOfLists = getCurrDictOfLists();
    if (!validateCurrDictOfLists()) return;
    //console.log(dictoflists);
    if (winCon[2] === 0) {
      document.getElementById("headerText").innerText = document.title =
        "PokeFatso";
    } else if (winCon[2] === 1) {
      document.getElementById("headerText").innerText = document.title =
        "PokeShineso";
    } else if (winCon[2] === 2) {
      document.getElementById("headerText").innerText = document.title =
        "PokeSpeedso";
    } else if (winCon[2] === 3) {
      document.getElementById("headerText").innerText = document.title =
        "PokeLearnso";
    } else if (winCon[2] === 4) {
      document.getElementById("headerText").innerText = document.title =
        "PokeHeightso";
    } else if (winCon[2] === 5) {
      document.getElementById("headerText").innerText = document.title =
        "PokeStatso";
    } else if (winCon[2] === 6) {
      document.getElementById("headerText").innerText = document.title =
        "PokeSmashso";
    } else if (winCon[2] === 7) {
      document.getElementById("headerText").innerText = document.title =
        "PokeScrabbleso";
    } else if (winCon[2] === 8) {
      document.getElementById("headerText").innerText = document.title =
        "PokeHPso";
    } else if (winCon[2] === 9) {
      document.getElementById("headerText").innerText = document.title =
        "PokeAttackso";
    } else if (winCon[2] === 10) {
      document.getElementById("headerText").innerText = document.title =
        "PokeDefenseso";
    } else if (winCon[2] === 11) {
      document.getElementById("headerText").innerText = document.title =
        "PokeSpecialAttackso";
    } else if (winCon[2] === 12) {
      document.getElementById("headerText").innerText = document.title =
        "PokeSpecialDefenseso";
    } else if (winCon[2] === 13) {
      document.getElementById("headerText").innerText = document.title =
        "PokeGlickso";
    } else if (winCon[2] === 14) {
      document.getElementById("headerText").innerText = document.title =
        "PokeSmogonso";
    } else if (winCon[2] === 15) {
      document.getElementById("headerText").innerText = document.title =
        "PokeBMIso";
    } else if (winCon[2] === 16) {
      document.getElementById("headerText").innerText = document.title =
        "PokeLebronso";
    } else if (winCon[2] === 17) {
      document.getElementById("headerText").innerText = document.title =
        "PokeMinMaxso";
    } else if (winCon[2] === 18) {
      document.getElementById("headerText").innerText = document.title =
        "PokeChemistryso";
    } else if (winCon[2] === 19) {
      document.getElementById("headerText").innerText = document.title =
        "Poke34so";
    } else if (winCon[2] === 20) {
      document.getElementById("headerText").innerText = document.title =
        "PokeGoatso";
    }
    if (winCon[0] === false) {
      document.getElementById("headerText").innerText = document.title =
        document.getElementById("headerText").innerText.slice(0, 4) +
        "Min" +
        document.getElementById("headerText").innerText.slice(4);
    }
    if (winCon[1] === true) {
      document.getElementById("headerText").innerText = document.title =
        document.getElementById("headerText").innerText.slice(0, 4) +
        "Second" +
        document.getElementById("headerText").innerText.slice(4);
    }

    categories = generateCategories();
    setCategories();
  })
  .catch((error) => console.error("Error loading the JSON file:", error));

function openPicker(identificationNumber) {
  idNum = identificationNumber.slice(-1);
  id = parseInt(idNum);
  modal.style.display = "flex";
  pokePickerInput.focus();
  suggestionsList.innerHTML = "";
  pokePickerInput.value = "";
  document.getElementById("modal-header").innerHTML =
    "Categories: " +
    categoryList[getCategory(id)[0]] +
    " + " +
    categoryList[getCategory(id)[1]];
  if (options) {
    showOptions([getCategory(id)[0], getCategory(id)[1]]);
  }
}

function showOptions(category) {
  let monList = [];
  for (let i = 0; i < keywords.length; i++) {
    if (verify(keywords[i], category)) {
      monList.push(keywords[i]);
    }
  }
  monList.forEach((keyword) => {
    const li = document.createElement("li");

    // Create image element for the suggestion
    const img = document.createElement("img");
    img.src = `images/pokemon/${keyword.toUpperCase()}.png`; // Adjust the path as needed
    img.alt = keyword; // Set alt text as the keyword for accessibility
    img.classList.add("suggestion-image"); // Optional: for styling

    // Create text node for the suggestion
    const text = document.createTextNode(keyword);

    // Append both the image and the text to the list item
    li.appendChild(img);
    li.appendChild(text);

    // Add click event to select the suggestion
    li.onclick = () => selectKeyword(keyword);

    suggestionsList.appendChild(li);
  });
}

document.addEventListener("keydown", function (event) {
  // Check if the key pressed is a number key (0-9)
  //console.log(numbersLeft);
  if (numbersLeft.includes(parseInt(event.key))) {
    event.preventDefault();
    openPicker(event.key);
  }
});

closeModalBtn.addEventListener("click", () => {
  //console.log("HELLO");
  modal.style.display = "none";
});

// Hide the modal when clicking outside the modal content
window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

pokePickerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    // Prevent form submission or other default behavior
    event.preventDefault();

    // If a suggestion is selected, submit it
    if (
      currentIndex >= 0 &&
      currentIndex < suggestionsList.getElementsByTagName("li").length
    ) {
      const selectedItem =
        suggestionsList.getElementsByTagName("li")[currentIndex];
      selectKeyword(selectedItem.textContent);
    } else {
      // Submit the typed value or the selected keyword
      if (
        suggestionsList.getElementsByTagName("li").length > 0 &&
        pokePickerInput.value.toUpperCase() !==
          suggestionsList.getElementsByTagName("li")[0].textContent &&
        pokePickerInput.value.toUpperCase() !==
          suggestionsList.getElementsByTagName("li")[
            suggestionsList.getElementsByTagName("li").length - 1
          ].textContent
      ) {
        selectKeyword(
          suggestionsList.getElementsByTagName("li")[0].textContent
        );
      } else submitPokemon();
    }
  } else if (event.key === "Escape") {
    modal.style.display = "none";
  }
});

pokePickerInput.addEventListener("input", filterKeywords);
pokePickerInput.addEventListener("keydown", navigateSuggestions);

function filterKeywords() {
  const query = pokePickerInput.value.trim().toLowerCase();
  currentIndex = -1;
  suggestionsList.innerHTML = ""; // Clear previous suggestions

  if (query.length >= 3) {
    // Only filter after 3 or more characters are typed
    const filteredKeywords = keywords.filter((keyword) =>
      keyword.toLowerCase().includes(query)
    );

    filteredKeywords.forEach((keyword) => {
      const li = document.createElement("li");

      // Create image element for the suggestion
      const img = document.createElement("img");
      img.src = `images/pokemon/${keyword.toUpperCase()}.png`; // Adjust the path as needed
      img.alt = keyword; // Set alt text as the keyword for accessibility
      img.classList.add("suggestion-image"); // Optional: for styling

      // Create text node for the suggestion
      const text = document.createTextNode(keyword);

      // Append both the image and the text to the list item
      li.appendChild(img);
      li.appendChild(text);

      // Add click event to select the suggestion
      li.onclick = () => selectKeyword(keyword);

      suggestionsList.appendChild(li);
    });
  }
}

function navigateSuggestions(event) {
  const items = suggestionsList.getElementsByTagName("li");

  if (event.key === "ArrowDown") {
    // Move down
    if (currentIndex < items.length - 1) {
      currentIndex++;
      updateSelectedItem(items);
    }
  } else if (event.key === "ArrowUp") {
    // Move up
    if (currentIndex > 0) {
      currentIndex--;
      updateSelectedItem(items);
    }
  }
}

function updateSelectedItem(items) {
  // Remove 'selected' class from all items
  Array.from(items).forEach((item) => item.classList.remove("selected"));

  // Add 'selected' class to the current item
  if (currentIndex >= 0 && currentIndex < items.length) {
    items[currentIndex].classList.add("selected");
  }
}

function selectKeyword(keyword) {
  pokePickerInput.value = keyword;
  suggestionsList.innerHTML = ""; // Clear suggestions after selection
  selectedKeyword = keyword; // Set the selected keyword
  currentIndex = -1; // Reset the currentIndex after selection
  pokePickerInput.focus();
}
function getCategory(id) {
  category = [];
  category.push(categories[(id - 1) % 3]);
  category.push(categories[Math.floor((id - 1) / 3) + 3]);
  return category;
}
function verify(mon, category) {
  pokemon = pokemonData[mon];
  one = category[0];
  //console.log(pokemon);
  //console.log(mon);
  if (one == 0 && pokemon[2] != 0) {
    return false;
  }
  if (one < 19 && !(pokemon[1] == one || pokemon[2] == one)) {
    return false;
  }
  if (one > 18 && one < 23 && one - 18 != pokemon[3]) {
    return false;
  }
  if (one == 23 && pokemon[2] == 0) {
    return false;
  }
  if (one > 23 && one < 28 && one - 24 != pokemon[6]) {
    return false;
  }
  if (one > 27 && one < 38 && one - 27 != pokemon[7]) {
    return false;
  }
  if (one == 38 && pokemon[8] > 1) {
    return false;
  }
  if (one == 39 && (pokemon[8] == 1 || pokemon[8] >= 20)) {
    return false;
  }
  if (one == 40 && (pokemon[8] < 20 || pokemon[8] > 30)) {
    return false;
  }
  if (one == 41 && pokemon[8] <= 30) {
    return false;
  }
  if (one < 51 && one > 41 && one - 41 != pokemon[0]) {
    return false;
  }
  if (one > 50 && one < 970 && !pokemon[9].includes(one - 50)) {
    return false;
  }
  if (one > 969 && one < 983 && pokemon[10] != one - 969) {
    return false;
  }
  if (one > 982 && one < 1290 && !pokemon[11].includes(one - 982)) {
    return false;
  }
  if (one > 1289 && one < 1305 && !pokemon[12].includes(one - 1289)) {
    return false;
  }
  if (one > 1304 && one < 1310 && pokemon[13] != one - 1305) {
    return false;
  }
  if (one > 1309 && one < 1316 && pokemon[14] != one - 1309) {
    return false;
  }
  if (one > 1315 && pokemon[15] != one - 1315) {
    return false;
  }
  one = category[1];

  //console.log(mon);
  if (one == 0 && pokemon[2] != 0) {
    return false;
  }
  if (one < 19 && !(pokemon[1] == one || pokemon[2] == one)) {
    return false;
  }
  if (one > 18 && one < 23 && one - 18 != pokemon[3]) {
    return false;
  }
  if (one == 23 && pokemon[2] == 0) {
    return false;
  }
  if (one > 23 && one < 28 && one - 24 != pokemon[6]) {
    return false;
  }
  if (one > 27 && one < 38 && one - 27 != pokemon[7]) {
    return false;
  }
  if (one == 38 && pokemon[8] > 1) {
    return false;
  }
  if (one == 39 && (pokemon[8] == 1 || pokemon[8] >= 20)) {
    return false;
  }
  if (one == 40 && (pokemon[8] < 20 || pokemon[8] > 30)) {
    return false;
  }
  if (one == 41 && pokemon[8] <= 30) {
    return false;
  }
  if (one < 51 && one > 41 && one - 41 != pokemon[0]) {
    return false;
  }
  if (one > 50 && one < 970 && !pokemon[9].includes(one - 50)) {
    return false;
  }
  if (one > 969 && one < 983 && pokemon[10] != one - 969) {
    return false;
  }
  if (one > 982 && one < 1290 && !pokemon[11].includes(one - 982)) {
    return false;
  }
  if (one > 1289 && one < 1305 && !pokemon[12].includes(one - 1289)) {
    return false;
  }
  if (one > 1304 && one < 1310 && pokemon[13] != one - 1304) {
    return false;
  }
  if (one > 1309 && one < 1316 && pokemon[14] != one - 1309) {
    return false;
  }
  if (one > 1315 && pokemon[15] != one - 1315) {
    return false;
  }
  one = category[1];
  return true;
}
function findCommonNumbers(arr1, arr2, arr3) {
  // Get elements from the 2nd index onwards
  const filteredArr1 = arr1.slice(2);
  const filteredArr2 = arr2.slice(2);
  const filteredArr3 = arr3.slice(2);

  // Create a Set from the first array's filtered elements for quick lookup
  const set1 = new Set(filteredArr1);

  // Find common elements in arr2 and arr3 with the Set
  const commonWithArr2 = filteredArr2.filter((num) => set1.has(num));
  const set2 = new Set(commonWithArr2);

  // Find common elements in arr3 with the Set of common elements from arr2
  const commonWithArr3 = filteredArr3.filter((num) => set2.has(num));

  return commonWithArr3;
}
/*function generateCategories() {
  while (true) {
    let firstCategory =
      Object.keys(dictoflists)[
        Math.floor(Math.random() * Object.keys(dictoflists).length)
      ]; // Primary Index
    listCategory = dictoflists[firstCategory];
    nextThree = [];
    if (listCategory.length < 3) continue;
    for (let x = 0; x < 3; x++) {
      // Gen the 3 Oppos
      mrGuy = Math.floor(Math.random() * listCategory.length);
      if (dictoflists[listCategory[mrGuy]].length < 3) {
        x--;
        continue;
      }
      nextThree.push(listCategory[mrGuy]);
      listCategory.splice(mrGuy, 1);
    }
    const arr1 = dictoflists[nextThree[0]];
    const arr2 = dictoflists[nextThree[1]];
    const arr3 = dictoflists[nextThree[2]];
    yipperskis = findCommonNumbers(arr1, arr2, arr3);
    //console.log(yipperskis);
    if (yipperskis.length < 2) continue;
    category = [];
    category.push(parseInt(firstCategory));
    //console.log(category);
    //console.log("First Category: " + categoryList[firstCategory]);
    //console.log(yipperskis);
    for (let x = 0; x < 2; x++) {
      // Gen the remaining 2
      mrGuy = Math.floor(Math.random() * yipperskis.length);
      //console.log(mrGuy);
      category.push(yipperskis[mrGuy]);
      //console.log("PREV " + yipperskis)
      yipperskis.splice(mrGuy, 1);
      //console.log(yipperskis)
    }
    category.push(nextThree[0]);
    category.push(nextThree[1]);
    category.push(nextThree[2]);
    if (new Set(category).size !== category.length) {
      continue;
    }
    //console.log(category);
    if (category.some((element) => element === undefined)) alert("UNDEFINED");
    //return [1317, 1317, 1317, 301, 301, 301];
    console.log(category);
    return category;
  }
}*/
function generateCategories() {
  //console.log(currDictOfLists);
  while (true) {
    let deepCopy = JSON.parse(JSON.stringify(currDictOfLists));
    let firstCategory =
      Object.keys(deepCopy)[
        Math.floor(Math.random() * Object.keys(deepCopy).length)
      ]; // Primary Index
    //console.log(firstCategory);
    //console.log(firstCategory);
    let listCategory = deepCopy[firstCategory];
    nextThree = [];
    if (listCategory.length < 3) continue;
    //console.log(listCategory);
    for (let x = 0; x < 3; x++) {
      //console.log("eee");
      // Gen the 3 Oppos
      mrGuy = Math.floor(Math.random() * listCategory.length);
      if (deepCopy[listCategory[mrGuy]].length < 3) {
        x--;
        continue;
      }
      nextThree.push(listCategory[mrGuy]);
      listCategory.splice(mrGuy, 1);
    }
    //console.log(nextThree);

    const arr1 = deepCopy[nextThree[0]];
    const arr2 = deepCopy[nextThree[1]];
    const arr3 = deepCopy[nextThree[2]];
    yipperskis = findCommonNumbers(arr1, arr2, arr3);
    //console.log(yipperskis);
    if (yipperskis.length < 2) continue;
    category = [];
    category.push(parseInt(firstCategory));
    //console.log(category);
    //console.log("First Category: " + categoryList[firstCategory]);
    /*console.log(
      "Next Three: " +
        categoryList[nextThree[0]] +
        "," +
        categoryList[nextThree[1]] +
        "," +
        categoryList[nextThree[2]]
    );*/
    //console.log(yipperskis);
    for (let x = 0; x < 2; x++) {
      // Gen the remaining 2
      mrGuy = Math.floor(Math.random() * yipperskis.length);
      //console.log(mrGuy);
      category.push(yipperskis[mrGuy]);
      //console.log("PREV " + yipperskis)
      yipperskis.splice(mrGuy, 1);
      //console.log(yipperskis)
    }
    /*console.log(
      "Other Two: " +
        categoryList[category[1]] +
        "," +
        categoryList[category[2]]
    );*/
    category.push(nextThree[0]);
    category.push(nextThree[1]);
    category.push(nextThree[2]);
    if (new Set(category).size !== category.length) {
      continue;
    }
    //console.log(category);
    if (category.some((element) => element === undefined)) alert("UNDEFINED");
    //return [1317, 1317, 1317, 301, 301, 301];
    console.log(category);
    return category;
  }
}
function hasLeft() {
  if (pp && currPP === 0) return false;
  for (let i = 1; i <= 9; i++) {
    if (numbersLeft[i] > 0) return true;
  }
  return false;
}
function setCategories() {
  //console.log(categoryList[categories[0]]);
  document.getElementById("l1").innerHTML = categoryList[categories[0]];
  document.getElementById("l2").innerHTML = categoryList[categories[1]];
  document.getElementById("l3").innerHTML = categoryList[categories[2]];
  document.getElementById("l4").innerHTML = categoryList[categories[3]];
  document.getElementById("l5").innerHTML = categoryList[categories[4]];
  document.getElementById("l6").innerHTML = categoryList[categories[5]];
}
function getOptimal(category, winConditionIndex, minmax, second) {
  let monList = [];
  for (let i = 0; i < keywords.length; i++) {
    if (verify(keywords[i], category)) {
      monList.push(keywords[i]);
    }
  }
  if (second === false) {
    let maxWeight;
    let maxMon;
    if (minmax === true) {
      maxWeight = -1;
      for (let i = 0; i < monList.length; i++) {
        if (pokemonData[monList[i]][winConditionIndex] > maxWeight) {
          maxMon = monList[i];
          maxWeight = pokemonData[monList[i]][winConditionIndex];
        }
      }
    } else {
      maxWeight = 1000000;
      for (let i = 0; i < monList.length; i++) {
        if (pokemonData[monList[i]][winConditionIndex] < maxWeight) {
          maxMon = monList[i];
          maxWeight = pokemonData[monList[i]][winConditionIndex];
        }
      }
    }
    return maxMon;
  } else {
    let maxWeight;
    let maxMon = null;
    let secondMaxWeight;
    let secondMaxMon = null;
    if (minmax === true) {
      maxWeight = -1;
      secondMaxWeight = -2;
      for (let i = 0; i < monList.length; i++) {
        if (pokemonData[monList[i]][winConditionIndex] > maxWeight) {
          secondMaxMon = maxMon;
          maxMon = monList[i];
          secondMaxWeight = maxWeight;
          maxWeight = pokemonData[monList[i]][winConditionIndex];
        } else if (
          pokemonData[monList[i]][winConditionIndex] > secondMaxWeight
        ) {
          secondMaxMon = monList[i];
          secondMaxWeight = pokemonData[monList[i]][winConditionIndex];
        }
        //console.log("MAX: " + maxMon);
        //console.log("Second: " + secondMaxMon);
      }
    } else {
      maxWeight = 10000000;
      secondMaxWeight = 1000000;
      for (let i = 0; i < monList.length; i++) {
        if (pokemonData[monList[i]][winConditionIndex] < maxWeight) {
          secondMaxMon = maxMon;
          maxMon = monList[i];
          secondMaxWeight = maxWeight;
          maxWeight = pokemonData[monList[i]][winConditionIndex];
        } else if (
          pokemonData[monList[i]][winConditionIndex] < secondMaxWeight
        ) {
          secondMaxMon = monList[i];
          secondMaxWeight = pokemonData[monList[i]][winConditionIndex];
        }
        //console.log("MAX: " + maxMon);
        //console.log("Second: " + secondMaxMon);
      }
    }
    return secondMaxMon;
  }
}
function calculatePercent(pokemon, category) {
  if (winCon[2] === 0) winConditionIndex = 4;
  else winConditionIndex = winCon[2] + 15;
  let maxMon = getOptimal(category, winConditionIndex, winCon[0], winCon[1]);
  let quotient;
  if (winCon[0] === true) {
    if (pokemonData[maxMon][winConditionIndex] === 0) quotient = 100;
    else
      quotient =
        (pokemonData[pokemon][winConditionIndex] /
          pokemonData[maxMon][winConditionIndex]) *
        100;
  } else {
    if (pokemonData[pokemon][winConditionIndex] === 0) quotient = 100;
    else if (pokemonData[maxMon][winConditionIndex] === 0) quotient = 0;
    else
      quotient =
        (1 /
          (pokemonData[pokemon][winConditionIndex] /
            pokemonData[maxMon][winConditionIndex])) *
        100;
  }
  if (quotient > 100) quotient = 10000 / quotient;
  return [`${quotient.toFixed(1)}%`, maxMon];
}
function submitPokemon() {
  currPP--;
  document.getElementById("headerPP").textContent =
    document.getElementById("headerPP").textContent.slice(0, -3) +
    currPP +
    "/9";
  let mon = selectedKeyword || pokePickerInput.value.trim();
  const pokemon = mon.toUpperCase();
  console.log("Submitted Pokémon:", pokemon);
  modal.style.display = "none"; // Close the modal after submission
  pokePickerInput.value = "";
  suggestionsList.innerHTML = "";
  selectedKeyword = null; // Reset selected keyword after submission
  category = getCategory(id);
  if (!pokemon) {
    alert("Please Enter A Pokemon!");
    modal.style.display = "flex";
    currPP++;
    document.getElementById("headerPP").textContent =
      document.getElementById("headerPP").textContent.slice(0, -3) +
      currPP +
      "/9";
    return;
  }
  if (!keywords.includes(pokemon)) {
    alert(pokemon + " is not a pokemon!");
    currPP++;
    document.getElementById("headerPP").textContent =
      document.getElementById("headerPP").textContent.slice(0, -3) +
      currPP +
      "/9";
    modal.style.display = "flex";
    return;
  }
  if (!verify(pokemon, category)) {
    //console.log(pokemon + " " + category);
    alert(pokemon + " is NOT ADEQUATE for the aforementioned requirements!");
    if (!hasLeft()) {
      for (let i = 1; i <= 9; i++) {
        button = document.getElementById("b" + i);
        button.disabled = true;
      }
      confetti({
        particleCount: 5000,
        spread: 10000,
        origin: { y: 0.4 },
      });

      document.getElementById("end-content").style.display = "flex";
      document.getElementById("endScreen").textContent =
        document.getElementById("endScreen").textContent +
        `${(overallPercentage / 9).toFixed(1)}%`;
      return;
    }
    modal.style.display = "flex";
    return;
  }
  for (let i = 0; i < numbersLeft.length; i++) {
    if (numbersLeft[i] === id) {
      numbersLeft[i] = -1;
    }
  }
  document.getElementById(
    "b" + id
  ).style.backgroundImage = `url(images/pokemon/${pokemon.toUpperCase()}.png)`; // Adjust the path as needed
  document.getElementById("b" + id).disabled = "true";
  let [percent, optimal] = calculatePercent(pokemon, category);
  overallPercentage += parseFloat(percent.replace("%", ""));
  document.getElementById("bl" + id).innerHTML = percent;
  //console.log(document.getElementById("bl" + id));
  if (percent !== "100.0%") alert("Optimal: " + optimal);
  //console.log(numbersLeft);
  if (!hasLeft()) {
    for (let i = 1; i <= 9; i++) {
      button = document.getElementById("b" + i);
      button.disabled = true;
    }
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    showModal();
  }
}
function showModal() {
  const modal = document.getElementById("end-modal");
  const endScreenText = document.getElementById("endScreen");

  // Update the modal text with the percentage value
  endScreenText.textContent = `You Won! Percentage: ${(
    overallPercentage / 9
  ).toFixed(1)}%`;

  // Show the modal
  modal.style.display = "flex";
}
window.onload = function () {};
function playAgain() {
  const modal = document.getElementById("end-modal");
  modal.style.display = "none";
  let button;
  for (let i = 1; i <= 9; i++) {
    button = document.getElementById("b" + i);
    button.style.backgroundImage = "";
    document.getElementById("bl" + i).innerHTML = "\u200B";
    button.disabled = false;
  }
  document.getElementById("endScreen").textContent = "You Won! Percentage: ";
  categories = generateCategories();
  setCategories();
  numbersLeft = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  currPP = 9;
  document.getElementById("headerPP").textContent =
    document.getElementById("headerPP").textContent.slice(0, -3) + "9/9";
  overallPercentage = 0;
}
/*
categories
    0 Mono/Dual type
    1 Types
    2 Groups
    3 Evos
    4 Colors
    5 Abil
    6 Generations
    7 Moves
    8 Evolution Trigger
    9 Ability
    10 Egg Group
    11 Gender Rate
    12 Growth Rate
    13 Shape
win con
    Min/Max
    Second?

    0 Weight
    1 Shine
    2 Speed
    3 Learn
    4 Height
    5 Stats
pp?
*/

function validateParams(params) {
  //categories = [int, int, int...];
  //winCon = [bool, bool, int];
  //pp = bool;
  try {
    legalCategories = JSON.parse(params.categories);
    winCon = JSON.parse(params.winCon);
    pp = JSON.parse(params.pp);
    options = JSON.parse(params.options);
    const isCategoriesValid =
      Array.isArray(legalCategories) &&
      legalCategories.every((num) => Number.isInteger(num)) &&
      legalCategories.every((num) => num > -1 && num < 14) &&
      legalCategories.length > 0 &&
      !hasDuplicates(legalCategories);
    const isWinConValid =
      Array.isArray(winCon) &&
      winCon.length === 3 &&
      typeof winCon[0] === "boolean" &&
      typeof winCon[1] === "boolean" &&
      Number.isInteger(winCon[2]) &&
      winCon[2] > -1 &&
      winCon[2] < 21;
    const isPpValid = typeof pp === "boolean";
    const isOptionsValid = typeof options === "boolean";
    return isCategoriesValid && isWinConValid && isPpValid && isOptionsValid;
  } catch (error) {
    return false;
  }
}

function getURLParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    categories: params.get("categories"),
    winCon: params.get("winCon"),
    pp: params.get("pp"),
    options: params.get("options"),
  };
}
function hasDuplicates(array) {
  const uniqueElements = new Set(array);
  return uniqueElements.size !== array.length;
}

function getCurrDictOfLists() {
  let dictionary = JSON.parse(JSON.stringify(dictoflists));
  let purgeList = [];
  if (!legalCategories.includes(0)) {
    purgeList.push(0);
    purgeList.push(23);
  }
  if (!legalCategories.includes(1)) {
    for (let i = 1; i <= 18; i++) {
      purgeList.push(i);
    }
  }
  if (!legalCategories.includes(2)) {
    for (let i = 19; i <= 22; i++) {
      purgeList.push(i);
    }
  }
  if (!legalCategories.includes(3)) {
    for (let i = 24; i <= 27; i++) {
      purgeList.push(i);
    }
  }
  if (!legalCategories.includes(4)) {
    for (let i = 28; i <= 37; i++) {
      purgeList.push(i);
    }
  }
  if (!legalCategories.includes(5)) {
    for (let i = 38; i <= 41; i++) {
      purgeList.push(i);
    }
  }
  if (!legalCategories.includes(6)) {
    for (let i = 42; i <= 50; i++) {
      purgeList.push(i);
    }
  }
  if (!legalCategories.includes(7)) {
    for (let i = 51; i <= 969; i++) {
      purgeList.push(i);
    }
  }
  if (!legalCategories.includes(8)) {
    for (let i = 970; i <= 982; i++) {
      purgeList.push(i);
    }
  }
  if (!legalCategories.includes(9)) {
    for (let i = 983; i <= 1289; i++) {
      purgeList.push(i);
    }
  }
  if (!legalCategories.includes(10)) {
    for (let i = 1290; i <= 1304; i++) {
      purgeList.push(i);
    }
  }
  if (!legalCategories.includes(11)) {
    for (let i = 1305; i <= 1309; i++) {
      purgeList.push(i);
    }
  }
  if (!legalCategories.includes(12)) {
    for (let i = 1310; i <= 1315; i++) {
      purgeList.push(i);
    }
  }
  if (!legalCategories.includes(13)) {
    for (let i = 1316; i <= 1329; i++) {
      purgeList.push(i);
    }
  }
  const purgeSet = new Set(purgeList);
  for (const key of Object.keys(dictionary)) {
    if (purgeSet.has(Number(key))) {
      delete dictionary[key];
    } else {
      // Filter the associated list to remove purgeList values
      dictionary[key] = dictionary[key].filter((value) => !purgeSet.has(value));
    }
  }
  //console.log(purgeList);
  //console.log(dictionary);
  return dictionary;
}

function validateCurrDictOfLists() {
  for (const key in currDictOfLists) {
    //For each key in the current list
    if (currDictOfLists[key].length < 4) continue;
    let valueA;
    let valueB;
    let valueC;
    for (let a = 0; a < currDictOfLists[key].length; a++) {
      valueA = currDictOfLists[key][a];
      if (valueA === parseInt(key, 10)) continue;
      for (let b = a + 1; b < currDictOfLists[key].length; b++) {
        valueB = currDictOfLists[key][b];
        if (valueB === parseInt(key, 10)) continue;
        for (let c = b + 1; c < currDictOfLists[key].length; c++) {
          valueC = currDictOfLists[key][c];
          if (valueC === parseInt(key, 10)) continue;
          //console.log(a + " " + b + " " + c);
          if (threeValuesCommon(valueA, valueB, valueC)) {
            //console.log(true);
            return true;
          }
        }
      }
    }
  }
  //console.log("currDictOfList problem");
  //console.log(currDictOfLists);
  window.location.href = "index.html";
  return false;
}
function threeValuesCommon(a, b, c) {
  // Access the lists using the provided keys
  let listA = currDictOfLists[a];
  let listB = currDictOfLists[b];
  let listC = currDictOfLists[c];

  // Use a Set to store common values
  let commonValues = new Set();

  // Iterate through the first list and check if the value exists in the other two lists
  for (let value of listA) {
    if (listB.includes(value) && listC.includes(value)) {
      commonValues.add(value);
    }

    // Return true if 3 common values are found
    if (commonValues.size >= 3) {
      return true;
    }
  }

  // If fewer than 3 common values are found, return false
  return commonValues.size >= 3;
}
