const bulb = document.getElementById("bulbon");

// Load saved state
let bulbState = localStorage.getItem("bulb") || "on";

function applyBulbState(state) {
  if (state === "on") {
    // Light mode: white background, bulb off
    document.body.style.backgroundImage = "none";
    document.body.style.backgroundColor = "white";
    bulb.src = "bulboff.png";
  } else {
    // Dark mode: background image, bulb on
    document.body.style.backgroundImage = "url('pimg1.png')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    bulb.src = "bulbon.png";
  }
}

applyBulbState(bulbState); // Apply on page load

// Toggle on click
bulb.onclick = () => {
  bulbState = bulbState === "on" ? "off" : "on";
  localStorage.setItem("bulb", bulbState);
  applyBulbState(bulbState);
};
