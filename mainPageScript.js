function goSingle() {
  const selectedCategories = Array.from(
    document.querySelectorAll('input[name="catOpt"]')
  ).reduce((arr, button) => {
    if (button.checked) arr.push(button.value);
    return arr;
  }, []);

  const minmax = !document.getElementById("minmax").checked;
  const second = document.getElementById("second").checked;

  const winCon = document.querySelector('input[name="winOpt"]:checked') // If there is no selected option, it will return -1
    ? document.querySelector('input[name="winOpt"]:checked').value
    : -1;

  // Determine the value of the final checkbox
  const pp = document.getElementById("pp").checked;

  const options = document.getElementById("options").checked;

  // Log the values (you can replace this with actual game logic)
  window.location.href =
    "game.html?categories=[" +
    selectedCategories +
    "]&winCon=[" +
    minmax +
    "," +
    second +
    "," +
    winCon +
    "]&pp=" +
    pp +
    "&options=" +
    options;
}
