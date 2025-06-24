// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.

import { ACTION_CLASSIFY_TEXT, ACTION_UPDATE_BADGE } from "./constants.js";

const inputElement = document.getElementById("text");
const outputElement = document.getElementById("output");
const replacementCountElement = document.getElementById("replacement-count");
const resetButton = document.getElementById("reset-btn");

// Function to update the replacement count display
async function updateReplacementCount() {
  try {
    const response = await chrome.runtime.sendMessage({
      action: "get-replacement-count",
    });
    replacementCountElement.textContent = response.count || 0;
  } catch (error) {
    console.error("Failed to get replacement count:", error);
    replacementCountElement.textContent = "0";
  }
}

// Function to reset the replacement count
async function resetReplacementCount() {
  try {
    await chrome.runtime.sendMessage({
      action: "reset-replacements",
    });
    replacementCountElement.textContent = "0";
  } catch (error) {
    console.error("Failed to reset replacement count:", error);
  }
}

// Initialize the popup
document.addEventListener("DOMContentLoaded", () => {
  updateReplacementCount();
});

// Listen for changes made to the textbox.
inputElement.addEventListener("input", async (event) => {
  // Bundle the input data into a message.
  const message = {
    action: ACTION_CLASSIFY_TEXT,
    text: event.target.value,
  };

  // Send this message to the service worker.
  const response = await chrome.runtime.sendMessage(message);

  // Handle results returned by the service worker (`background.js`) and update the popup's UI.
  outputElement.innerText = JSON.stringify(response, null, 2);
});

// Listen for reset button clicks
resetButton.addEventListener("click", resetReplacementCount);
