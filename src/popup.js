// popup.js - handles interaction with the extension's popup, sends requests to the
// service worker (background.js), and updates the popup's UI (popup.html) on completion.

import {
  ACTION_CLASSIFY_TEXT,
  ACTION_UPDATE_BADGE,
  ACTION_TOGGLE_FILTER,
} from "./constants.js";

const inputElement = document.getElementById("text");
const outputElement = document.getElementById("output");
const replacementCountElement = document.getElementById("replacement-count");
const resetButton = document.getElementById("reset-btn");
const filterToggleButton = document.getElementById("filter-toggle");
const toggleTextElement = filterToggleButton.querySelector(".toggle-text");

// Function to update the replacement count display
async function updateReplacementCount() {
  try {
    const result = await chrome.storage.local.get("filterTotalReplacements");
    console.log("updateReplacementCount", result);
    replacementCountElement.textContent = result.filterTotalReplacements || 0;
  } catch (error) {
    console.error("Failed to get replacement count:", error);
    replacementCountElement.textContent = "0";
  }
}

// Function to get the current filter state
async function getTextFilterState() {
  try {
    const result = await chrome.storage.local.get("filterConfig");
    return !!result.filterConfig?.textFilter?.isEnabled;
  } catch (error) {
    console.error("Failed to get filter state:", error);
    return false;
  }
}

// Function to update the toggle button UI
function updateToggleUI(isEnabled) {
  if (isEnabled) {
    filterToggleButton.classList.add("active");
    toggleTextElement.textContent = "ON";
  } else {
    filterToggleButton.classList.remove("active");
    toggleTextElement.textContent = "OFF";
  }
}

// Function to toggle the filter
async function toggleFilter() {
  console.log("toggleFilter");
  try {
    const isEnabled = !(await getTextFilterState());

    await chrome.storage.local.set({
      filterConfig: { textFilter: { isEnabled } },
    });

    updateToggleUI(isEnabled);
    const newIsEnabled = await getTextFilterState();

    // Broadcast the state change to all tabs
    // const tabs = await chrome.tabs.query({});
    // for (const tab of tabs) {
    //   try {
    //     await chrome.tabs.sendMessage(tab.id, {
    //       action: "filter-state-changed",
    //       isEnabled,
    //     });
    //   } catch (error) {
    //     // Ignore errors for tabs that don't have content scripts
    //   }
    // }
  } catch (error) {
    console.error("Failed to toggle filter:", error);
  }
}

// Initialize the popup
document.addEventListener("DOMContentLoaded", async () => {
  updateReplacementCount();

  // Initialize filter toggle state
  const isEnabled = await getTextFilterState();
  updateToggleUI(isEnabled);
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
// resetButton.addEventListener("click", resetReplacementCount);

// Listen for filter toggle button clicks
filterToggleButton.addEventListener("click", toggleFilter);
