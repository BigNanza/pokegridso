let keywords;
let categoryList;
let pokemonData;
let dictoflists;
let selectedCategories = new Set(); // Track selected items
let validPokemon = [];
let isReversed = false; // Add this with other global variables at the top

fetch("keywords.json")
  .then((response) => response.json())
  .then((data) => {
    keywords = data["keywords"];
    validPokemon = keywords;
    updateSelectedList();
  })
  .catch((error) => console.error("Error loading the JSON file:", error));

fetch("categoryList.json")
  .then((response) => response.json())
  .then((data) => {
    categoryList = data["categoryList"];
    updateDropdown();
  })
  .catch((error) => console.error("Error loading the JSON file:", error));

fetch("pokemonData.json")
  .then((response) => response.json())
  .then((data) => {
    pokemonData = data;
  })
  .catch((error) => console.error("Error loading the JSON file:", error));

fetch("dictoflists.json")
  .then((response) => response.json())
  .then((data) => {
    dictoflists = data;
  })
  .catch((error) => console.error("Error loading the JSON file:", error));
// Add this after your other fetch calls
let selectedExtraValue = -1; // Initialize the variable to store the selected value

document.getElementById("extra-select").addEventListener("change", (event) => {
  selectedExtraValue = parseInt(event.target.value, 10); // Store the selected value
  updateSelectedList(); // This will trigger the sort and redisplay
  // If isReversed is true, reverse the list
  if (isReversed) {
    const selectedList = document.getElementById("selected-list");
    const listItems = Array.from(selectedList.children);
    // Reverse the DOM elements directly
    if (listItems.length > 1) {
      for (let i = listItems.length - 1; i >= 0; i--) {
        selectedList.appendChild(listItems[i]);
      }
    }
  }
});
// Function to format category names
function formatCategoryName(index, name) {
  // 1-18 : Type
  // 19 - 22 : Group
  // 24 - 27 : Evolution
  // 28-37 : Color
  // 38 : 41 : Abil
  // 42 - 50 : Generation
  // 51 - 969 : Move
  // 970 - 982 : Evolution Trigger
  // 983 - 1289 : Ability
  // 1290 - 1304 : Egg Group
  // 1305 - 1309 : Gender Rate
  // 1310 - 1315 : Growth Rate
  // 1316 - 1329 : Shape
  if (index >= 1 && index <= 18) return `Type: ${name}`;
  if (index >= 19 && index <= 22) return `Group: ${name}`;
  if (index >= 24 && index <= 27) return `Evolution: ${name}`;
  if (index >= 28 && index <= 37) return `Color: ${name}`;
  if (index >= 38 && index <= 41) return `Abil: ${name}`;
  if (index >= 42 && index <= 50) return `Generation: ${name}`;
  if (index >= 51 && index <= 969) return `Move: ${name}`;
  if (index >= 970 && index <= 982) return `Evolution Trigger: ${name}`;
  if (index >= 983 && index <= 1289) return `Ability: ${name}`;
  if (index >= 1290 && index <= 1304) return `Egg Group: ${name}`;
  if (index >= 1305 && index <= 1309) return `Gender Rate: ${name}`;
  if (index >= 1310 && index <= 1315) return `Growth Rate: ${name}`;
  if (index >= 1316 && index <= 1329) return `Shape: ${name}`;
  return name; // Default fallback
}

// Function to update the datalist options (single-line format with category type)
function updateDropdown() {
  const datalist = document.getElementById("categories");
  datalist.innerHTML = ""; // Clear previous options

  categoryList.forEach((category, index) => {
    let formattedName = formatCategoryName(index, category);
    let option = document.createElement("option");
    option.value = formattedName; // Show category type in title
    datalist.appendChild(option);
  });

  document
    .getElementById("dropdown")
    .addEventListener("input", handleInputChange);
}

// Function to handle category selection and deselection
function handleInputChange(event) {
  const selectedValue = event.target.value;

  // Remove the prefix (e.g., "Type: ") before checking against categoryList
  const cleanedValue = selectedValue.split(": ").pop();

  // Check if the value matches a category
  if (categoryList.includes(cleanedValue)) {
    if (selectedCategories.has(cleanedValue)) {
      selectedCategories.delete(cleanedValue); // Remove if already selected
    } else {
      selectedCategories.add(cleanedValue); // Add if not selected
    }

    updateValidPokemon();
    updateSelectedCategoriesList(); // Ensure selected categories are displayed

    // Clear the input field only after selection
    setTimeout(() => {
      event.target.value = ""; // Reset input text to blank
    }, 100); // Delay slightly to allow for selection
  }
}

// Function to update the list of valid Pokemon fitting the selected categories
// Modify the updateValidPokemon function to include sorting
function updateValidPokemon() {
  validPokemon = keywords.filter((pokemon) =>
    Array.from(selectedCategories).every((category) =>
      verify(pokemon, categoryList.indexOf(category))
    )
  );
  sortPokemons(); // Sort before updating display
  updateSelectedList(); // Update displayed Pokémon
  updateSelectedCategoriesList();
}

// Enhance the sort function with your custom logic
function sortPokemons() {
  let selectedExtraValue = parseInt(
    document.getElementById("extra-select").value
  );
  if (selectedExtraValue === -1) {
    validPokemon.sort((a, b) => keywords.indexOf(a) - keywords.indexOf(b));
    return;
  } else if (selectedExtraValue === 0) {
    selectedExtraValue = 4;
  } else selectedExtraValue = selectedExtraValue + 15;
  //console.log(selectedExtraValue);
  validPokemon.sort((a, b) => {
    const valueA = pokemonData[a][selectedExtraValue];
    const valueB = pokemonData[b][selectedExtraValue];

    if (!isReversed) return valueB - valueA;
    else return valueA - valueB;
  });
}
function updateValidPokemon() {
  validPokemon = keywords.filter((pokemon) =>
    Array.from(selectedCategories).every((category) =>
      verify(pokemon, categoryList.indexOf(category))
    )
  );
  updateSelectedList(); // Update displayed Pokémon
  updateSelectedCategoriesList();
}

// Function to verify if a Pokémon fits the selected category
function verify(mon, category) {
  //console.log("Verifying " + mon + " with " + category);
  let pokemon = pokemonData[mon];
  let one = category;

  if (one == 0 && pokemon[2] != 0) return false;
  if (one < 19 && !(pokemon[1] == one || pokemon[2] == one)) return false;
  if (one > 18 && one < 23 && one - 18 != pokemon[3]) return false;
  if (one == 23 && pokemon[2] == 0) return false;
  if (one > 23 && one < 28 && one - 24 != pokemon[6]) return false;
  if (one > 27 && one < 38 && one - 27 != pokemon[7]) return false;
  if (one == 38 && pokemon[8] > 1) return false;
  if (one == 39 && (pokemon[8] == 1 || pokemon[8] >= 20)) return false;
  if (one == 40 && (pokemon[8] < 20 || pokemon[8] > 30)) return false;
  if (one == 41 && pokemon[8] <= 30) return false;
  if (one < 51 && one > 41 && one - 41 != pokemon[0]) return false;
  if (one > 50 && one < 970 && !pokemon[9].includes(one - 50)) return false;
  if (one > 969 && one < 983 && pokemon[10] != one - 969) return false;
  if (one > 982 && one < 1290 && !pokemon[11].includes(one - 982)) return false;
  if (one > 1289 && one < 1305 && !pokemon[12].includes(one - 1289))
    return false;
  if (one > 1304 && one < 1310 && pokemon[13] != one - 1304) return false;
  if (one > 1309 && one < 1316 && pokemon[14] != one - 1309) return false;
  if (one > 1315 && pokemon[15] != one - 1315) return false;

  return true;
}
// Modify the updateSelectedList function
function updateSelectedList() {
  const selectedList = document.getElementById("selected-list");

  // Sort the Pokemon list right before display
  sortPokemons();

  let displayPokemon = [...validPokemon]; // Create a copy of the sorted array

  // Preserve the reversed state
  if (isReversed) {
    displayPokemon.reverse();
  }

  // Get the selected extra value
  let selectedExtraValue = parseInt(
    document.getElementById("extra-select").value
  );
  if (selectedExtraValue === -1) {
  } else if (selectedExtraValue === 0) {
    selectedExtraValue = 4;
  } else selectedExtraValue = selectedExtraValue + 15;

  // Clear and rebuild the list
  selectedList.innerHTML = "";

  const fragment = document.createDocumentFragment();
  displayPokemon.forEach((pokemon, index) => {
    const listItem = document.createElement("li");
    // Add ranking to the leftmost side
    listItem.textContent = `${index + 1}. ${pokemon}`;

    // If selectedExtraValue is not -1, display the value on the right
    if (selectedExtraValue !== -1) {
      const extraValue = pokemonData[pokemon][selectedExtraValue];
      const valueSpan = document.createElement("span");
      valueSpan.textContent = ` ${extraValue}`; // Add a space for separation
      switch (selectedExtraValue) {
        case 4:
          valueSpan.textContent = `${(parseInt(extraValue, 10) / 10).toFixed(
            1
          )} kgs`;
          break;
        case 16:
          valueSpan.textContent = extraValue + " spc";
          break;
        case 17:
          valueSpan.textContent = extraValue + " spd";
          break;
        case 18:
          valueSpan.textContent = extraValue + " moves";
          break;
        case 19:
          valueSpan.textContent = `${(parseInt(extraValue, 10) / 10).toFixed(
            1
          )} m`;
          break;
        case 20:
          valueSpan.textContent = extraValue + " bst";
          break;
        case 21:
          valueSpan.textContent = extraValue.toFixed(1) + " smr";
          break;
        case 22:
          valueSpan.textContent = extraValue + " spt";
          break;
        case 23:
          valueSpan.textContent = extraValue + " hp";
          break;
        case 24:
          valueSpan.textContent = extraValue + " atk";
          break;
        case 25:
          valueSpan.textContent = extraValue + " def";
          break;
        case 26:
          valueSpan.textContent = extraValue + " spatk";
          break;
        case 27:
          valueSpan.textContent = extraValue + " spdef";
          break;
        case 28:
          valueSpan.textContent = extraValue + " vgc";
          break;
        case 29:
          valueSpan.textContent = extraValue + " smo";
          break;
        case 30:
          valueSpan.textContent = extraValue.toFixed(1) + " bmi";
          break;
        case 31:
          valueSpan.textContent = extraValue.toFixed(1) + " goat";
          break;
        case 32:
          valueSpan.textContent = extraValue.toFixed(1) + " hwdif";
          break;
        case 33:
          valueSpan.textContent = extraValue + " chem";
          break;
        case 34:
          valueSpan.textContent = extraValue + " r34";
          break;
        case 35:
          valueSpan.textContent = extraValue.toFixed(1) + " rank";
          break;
      }
      valueSpan.style.float = "right"; // Align to the right side
      listItem.appendChild(valueSpan);
    }

    fragment.appendChild(listItem);
  });

  selectedList.appendChild(fragment);
}

// Update the reverse-list click handler
document.getElementById("reverse-list").addEventListener("click", () => {
  isReversed = !isReversed;

  // Update the arrow direction
  const arrow = document.getElementById("sort-arrow");
  if (isReversed) {
    arrow.className = "arrow arrow-up";
  } else {
    arrow.className = "arrow arrow-down";
  }

  // For DOM manipulation optimization, we'll just reverse the existing list
  const selectedList = document.getElementById("selected-list");
  const listItems = Array.from(selectedList.children);

  // Reverse the DOM elements directly
  if (listItems.length > 1) {
    for (let i = listItems.length - 1; i >= 0; i--) {
      selectedList.appendChild(listItems[i]);
    }
  }
});
function updateSelectedCategoriesList() {
  const selectedCategoryList = document.getElementById("selected-categories");
  selectedCategoryList.innerHTML = ""; // Clear previous selections

  selectedCategories.forEach((category) => {
    const listItem = document.createElement("li");
    listItem.textContent = category + " "; // Just the category name, no extra text
    const removeButton = document.createElement("span");
    removeButton.textContent = " ✖"; // Unicode 'x' with spacing
    removeButton.style.cursor = "pointer";
    removeButton.style.marginLeft = "8px";
    removeButton.style.color = "red"; // Make it visually clear
    removeButton.style.fontWeight = "bold";
    removeButton.style.userSelect = "none"; // Prevent text selection
    removeButton.setAttribute("role", "button"); // Accessibility improvement

    removeButton.onclick = () => {
      selectedCategories.delete(category); // Remove the category
      updateValidPokemon(); // Update the Pokémon list
      sortPokemons(); // Sort Pokémon again
      updateSelectedCategoriesList(); // Refresh the list
    };

    listItem.appendChild(removeButton);

    selectedCategoryList.appendChild(listItem);
  });
}
