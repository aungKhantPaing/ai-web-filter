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
const imageFilterToggleButton = document.getElementById("image-filter-toggle");
const imageToggleTextElement =
  imageFilterToggleButton.querySelector(".toggle-text");
const textFilterStatsElement = document.getElementById("text-filter-stats");

// Strictness slider elements
const textStrictnessSlider = document.getElementById("text-strictness-slider");
const textStrictnessValue = document.getElementById("text-strictness-value");
const imageStrictnessSlider = document.getElementById(
  "image-strictness-slider"
);
const imageStrictnessValue = document.getElementById("image-strictness-value");

// Strictness control elements
const textStrictnessControl = document.getElementById(
  "text-strictness-control"
);
const imageStrictnessControl = document.getElementById(
  "image-strictness-control"
);

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

// Function to get the current image filter state
async function getImageFilterState() {
  try {
    const result = await chrome.storage.local.get("filterConfig");
    return !!result.filterConfig?.imageFilter?.isEnabled;
  } catch (error) {
    console.error("Failed to get image filter state:", error);
    return false;
  }
}

// Function to get text filter strictness
async function getTextFilterStrictness() {
  try {
    const result = await chrome.storage.local.get("filterConfig");
    return result.filterConfig?.textFilter?.strictness || 80;
  } catch (error) {
    console.error("Failed to get text filter strictness:", error);
    return 80;
  }
}

// Function to get image filter strictness
async function getImageFilterStrictness() {
  try {
    const result = await chrome.storage.local.get("filterConfig");
    return result.filterConfig?.imageFilter?.strictness || 80;
  } catch (error) {
    console.error("Failed to get image filter strictness:", error);
    return 80;
  }
}

// Function to update the toggle button UI
function updateToggleUI(isEnabled) {
  if (isEnabled) {
    filterToggleButton.classList.add("active");
    toggleTextElement.textContent = "ON";
    textFilterStatsElement.style.display = "block";
    textStrictnessControl.style.display = "block";
  } else {
    filterToggleButton.classList.remove("active");
    toggleTextElement.textContent = "OFF";
    textFilterStatsElement.style.display = "none";
    textStrictnessControl.style.display = "none";
  }
}

// Function to update the image filter toggle button UI
function updateImageToggleUI(isEnabled) {
  if (isEnabled) {
    imageFilterToggleButton.classList.add("active");
    imageToggleTextElement.textContent = "ON";
    imageStrictnessControl.style.display = "block";
  } else {
    imageFilterToggleButton.classList.remove("active");
    imageToggleTextElement.textContent = "OFF";
    imageStrictnessControl.style.display = "none";
  }
}

// Function to update text strictness slider UI
function updateTextStrictnessUI(strictness) {
  textStrictnessSlider.value = strictness;
  textStrictnessValue.textContent = `${strictness}%`;
}

// Function to update image strictness slider UI
function updateImageStrictnessUI(strictness) {
  imageStrictnessSlider.value = strictness;
  imageStrictnessValue.textContent = `${strictness}%`;
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

// Function to toggle the image filter
async function toggleImageFilter() {
  console.log("toggleImageFilter");
  try {
    const isEnabled = !(await getImageFilterState());

    // Get current filter config and update only the image filter
    const result = await chrome.storage.local.get("filterConfig");
    const currentConfig = result.filterConfig || {};

    await chrome.storage.local.set({
      filterConfig: {
        ...currentConfig,
        imageFilter: { isEnabled },
      },
    });

    updateImageToggleUI(isEnabled);
  } catch (error) {
    console.error("Failed to toggle image filter:", error);
  }
}

// Function to update text filter strictness
async function updateTextStrictness(strictness) {
  try {
    const result = await chrome.storage.local.get("filterConfig");
    const currentConfig = result.filterConfig || {};

    await chrome.storage.local.set({
      filterConfig: {
        ...currentConfig,
        textFilter: {
          ...currentConfig.textFilter,
          strictness: strictness,
        },
      },
    });

    updateTextStrictnessUI(strictness);
  } catch (error) {
    console.error("Failed to update text filter strictness:", error);
  }
}

// Function to update image filter strictness
async function updateImageStrictness(strictness) {
  try {
    const result = await chrome.storage.local.get("filterConfig");
    const currentConfig = result.filterConfig || {};

    await chrome.storage.local.set({
      filterConfig: {
        ...currentConfig,
        imageFilter: {
          ...currentConfig.imageFilter,
          strictness: strictness,
        },
      },
    });

    updateImageStrictnessUI(strictness);
  } catch (error) {
    console.error("Failed to update image filter strictness:", error);
  }
}

// Initialize the popup
document.addEventListener("DOMContentLoaded", async () => {
  updateReplacementCount();

  // Initialize filter toggle state
  const isEnabled = await getTextFilterState();
  updateToggleUI(isEnabled);

  // Initialize image filter toggle state
  const imageIsEnabled = await getImageFilterState();
  updateImageToggleUI(imageIsEnabled);

  // Initialize strictness sliders
  const textStrictness = await getTextFilterStrictness();
  updateTextStrictnessUI(textStrictness);

  const imageStrictness = await getImageFilterStrictness();
  updateImageStrictnessUI(imageStrictness);
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

// Listen for image filter toggle button clicks
imageFilterToggleButton.addEventListener("click", toggleImageFilter);

// Listen for text strictness slider changes
textStrictnessSlider.addEventListener("input", (event) => {
  const strictness = parseInt(event.target.value);
  updateTextStrictnessUI(strictness);
});

textStrictnessSlider.addEventListener("change", (event) => {
  const strictness = parseInt(event.target.value);
  updateTextStrictness(strictness);
});

// Listen for image strictness slider changes
imageStrictnessSlider.addEventListener("input", (event) => {
  const strictness = parseInt(event.target.value);
  updateImageStrictnessUI(strictness);
});

imageStrictnessSlider.addEventListener("change", (event) => {
  const strictness = parseInt(event.target.value);
  updateImageStrictness(strictness);
});
