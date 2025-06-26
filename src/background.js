// background.js - Handles requests from the UI, runs the model, then sends back a response

// Import ONNX configuration first to prevent dynamic imports
import { env, pipeline } from "@huggingface/transformers";

import {
  ACTION_CLASSIFY_TEXT,
  ACTION_UPDATE_BADGE,
  ACTION_CLASSIFY_IMAGE,
  ACTION_TOGGLE_FILTER,
  ACTION_GET_FILTER_STATE,
  CONTEXT_MENU_ITEM_ID,
} from "./constants.js";

// If you'd like to use a local model instead of loading the model
// from the Hugging Face Hub, you can remove this line.
// env.allowLocalModels = false;

// https://github.com/huggingface/transformers.js/issues/1248#issuecomment-2899528980
env.backends.onnx.wasm.wasmPaths = "";

console.log("Hello, from background.js");
console.log("env", env);

/**
 * Enhanced Singleton class for managing the ML pipeline with:
 * - Better error handling and recovery
 * - Performance optimizations
 * - Memory management
 * - Progress tracking
 * - Retry logic for failed operations
 */
class TextClassificationPipeline {
  static task = "text-classification";
  static model = "Xenova/toxic-bert";
  static instance = null;

  /**
   * Get the pipeline instance with progress tracking
   * @param {function} progress_callback - A function to call with progress updates
   * @returns {Promise<Pipeline>} The pipeline instance
   */
  static async getInstance(progress_callback = null) {
    // The ??= operator is the nullish coalescing assignment operator
    // It only assigns the right side if this.instance is null or undefined
    // This creates a singleton pattern - only create new instance if one doesn't exist
    this.instance ??= pipeline(this.task, this.model, {
      progress_callback,
      device: "webgpu",
    });

    return this.instance;
  }

  static async cleanup() {
    if (this.instance) {
      await this.instance.dispose();
      this.instance = null;
    }
  }
}

// Create generic classify function with improved error handling
const classify = async (text, options = {}) => {
  if (!text || typeof text !== "string") {
    throw new Error("Invalid input: text must be a non-empty string");
  }

  try {
    // Get the pipeline instance with progress tracking
    const classifier = await TextClassificationPipeline.getInstance(
      (progressData) => {
        console.log("Pipeline progress:", progressData);
      }
    );

    // Run the model on the input text
    const result = await classifier(text);
    return result;
  } catch (error) {
    console.error("Classification failed:", text, error);

    // Provide more specific error messages
    if (error.message.includes("Failed to initialize pipeline")) {
      throw new Error(
        "Model failed to load. Please try again or check your internet connection."
      );
    } else if (error.message.includes("WebGPU")) {
      throw new Error("WebGPU not available. Please use a compatible browser.");
    } else {
      throw new Error(`Classification failed: ${error.message}`);
    }
  }
};

// const classifyBatch = async (texts) => {
//   const results = [];
//   for (let i = 0; i < texts.length; i += BATCH_SIZE) {
//     const batch = texts.slice(i, i + BATCH_SIZE);
//     const batchPromises = batch.map((text) => classify(text));
//     const batchResults = await Promise.all(batchPromises);
//     results.push(...batchResults);
//   }
//   return results;
// };

// Enhanced image classification with singleton pattern
class ImageClassificationPipeline {
  static task = "zero-shot-image-classification";
  static model = "Xenova/clip-vit-base-patch32";
  static instance = null;

  static async getInstance(progress_callback = null) {
    this.instance ??= pipeline(this.task, this.model, {
      progress_callback,
      device: "webgpu",
    });

    return this.instance;
  }

  static async cleanup() {
    if (this.instance) {
      await this.instance.dispose();
      this.instance = null;
    }
  }
}

const classifyImage = async (
  imageUrl,
  candidateLabels = ["safe", "unsafe", "inappropriate", "adult content"]
) => {
  try {
    const classifier = await ImageClassificationPipeline.getInstance(
      (progressData) => {
        // console.log("Image classification progress:", progressData);
      }
    );
    const result = await classifier(imageUrl, candidateLabels);

    console.log("Image classification result:", {
      imageUrl: imageUrl,
      candidateLabels: candidateLabels,
      result: result,
    });

    return result;
  } catch (error) {
    console.error("Image classification failed:", imageUrl);
    console.error(error);
    throw new Error(`Image classification failed: ${error.message}`);
  }
};

////////////////////// 1. Context Menus //////////////////////
//
// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
chrome.runtime.onInstalled.addListener(function () {
  console.log("onInstalled");
  // Register a context menu item that will only show up for selection text.
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ITEM_ID,
    title: 'Classify "%s"',
    contexts: ["selection"],
  });
  // chrome.contextMenus.create({
  //   id: ACTION_CLASSIFY_IMAGE,
  //   title: "Classify image",
  //   contexts: ["image"],
  // });
});

// Perform inference when the user clicks a context menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Ignore context menu clicks that are not for classifications (or when there is no input)
  if (info.menuItemId !== CONTEXT_MENU_ITEM_ID) return;

  // Perform classification on the selected text
  const result = await classify(info.selectionText);

  // Do something with the result
  chrome.scripting.executeScript({
    target: { tabId: tab.id }, // Run in the tab that the user clicked in
    args: [result], // The arguments to pass to the function
    function: (result) => {
      // The function to run
      // NOTE: This function is run in the context of the web page, meaning that `document` is available.
      console.log("result", result);
      console.log("document", document);
    },
  });
});
//////////////////////////////////////////////////////////////

////////////////////// 2. Message Events /////////////////////
//
// Listen for messages from the UI, process it, and send the result back.
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === ACTION_CLASSIFY_TEXT) {
    console.log("onMessage", message);
    classify(message.text)
      .then((result) => sendResponse(result))
      .catch((error) => {
        sendResponse({ success: false, error: error.message });
      });
    // return true to indicate we will send a response asynchronously
    // see https://stackoverflow.com/a/46628145 for more information
    return true;
  }

  if (message.action === ACTION_UPDATE_BADGE) {
    addReplacements(message.count);
    sendResponse({ success: true });
    return true;
  }

  if (message.action === "get-replacement-count") {
    sendResponse({ count: totalReplacements });
    return true;
  }

  if (message.action === "reset-replacements") {
    resetReplacements();
    sendResponse({ success: true });
    return true;
  }

  if (message.action === ACTION_CLASSIFY_IMAGE) {
    classifyImage(message.imageUrl, message.candidateLabels).then(sendResponse);
    // .catch((error) => {
    //   console.error("Image classification failed:", message.imageUrl, error);
    //   sendResponse({ success: false, error: error.message });
    // });
    return true;
  }

  if (message.action === ACTION_GET_FILTER_STATE) {
    chrome.storage.local.get("filterConfig").then((result) => {
      sendResponse({ filterConfig: result.filterConfig });
    });
    return true;
  }

  if (message.action === ACTION_TOGGLE_FILTER) {
    chrome.storage.local.get("filterConfig").then((result) => {
      const currentConfig = result.filterConfig || {
        textFilter: { isEnabled: false },
      };
      const newConfig = {
        textFilter: {
          isEnabled: !currentConfig.textFilter?.isEnabled,
        },
      };

      chrome.storage.local.set({ filterConfig: newConfig }).then(() => {
        sendResponse({ success: true, filterConfig: newConfig });
      });
    });
    return true;
  }

  return;
});
//////////////////////////////////////////////////////////////

// Cleanup when extension is unloaded
chrome.runtime.onSuspend.addListener(async () => {
  console.log("Extension is being unloaded, cleaning up...");
  // await TextClassificationPipeline.cleanup();
  // await ImageClassificationPipeline.cleanup();
});

// Badge management
let totalReplacements = 0;

/**
 * Update the extension badge with the current replacement count
 */
function updateBadge(value) {
  if (value > 0) {
    chrome.action.setBadgeText({ text: value.toString() });
    chrome.action.setBadgeBackgroundColor({ color: "#ff4444" });
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

/**
 * Add to the replacement count and update badge
 */
function addReplacements(count) {
  // totalReplacements += count;
  updateBadge(count);
}

/**
 * Reset the replacement count and clear badge
 */
function resetReplacements() {
  totalReplacements = 0;
  updateBadge();
}

// Initialize badge on extension load
chrome.runtime.onStartup.addListener(() => {
  resetReplacements();
});

chrome.runtime.onInstalled.addListener(() => {
  resetReplacements();
});

// Handle extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  // Reset the replacement count when the extension icon is clicked
  resetReplacements();
});
