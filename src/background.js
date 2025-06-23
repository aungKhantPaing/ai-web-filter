// background.js - Handles requests from the UI, runs the model, then sends back a response

import { env, pipeline } from "@huggingface/transformers";

import { CONTEXT_MENU_ITEM_ID } from "./constants.js";

// If you'd like to use a local model instead of loading the model
// from the Hugging Face Hub, you can remove this line.
env.allowLocalModels = false;

/**
 * Enhanced Singleton class for managing the ML pipeline with:
 * - Better error handling and recovery
 * - Performance optimizations
 * - Memory management
 * - Progress tracking
 * - Retry logic for failed operations
 */
class PipelineManager {
  static #instance = null;
  static #loadingPromise = null;
  static #currentPromise = Promise.resolve();
  static #isInitialized = false;
  static #retryCount = 0;
  static #maxRetries = 3;

  /**
   * Get the pipeline instance with enhanced error handling
   * @param {Function} progressCallback - Callback for loading progress
   * @param {Object} options - Configuration options
   * @returns {Promise<Function>} Function that can be called to run inference
   */
  static async getInstance(progressCallback, options = {}) {
    const {
      // modelName = "Xenova/distilbert-base-uncased-finetuned-sst-2-english",
      // modelName = "Xenova/bert-base-multilingual-uncased-sentiment",
      modelName = "Xenova/toxic-bert",
      // modelName = "HuggingFaceTB/SmolLM2-135M-Instruct",
      // modelName = "huantd/distilbert-base-uncased-finetuned-sst-2-english",
      // modelName = "jinaai/jina-reranker-v2-base-multilingual", // Pipeline initialization attempt 3 failed: Error: Unsupported model type: null
      task = "text-classification",
      device = "webgpu",
      dtype = "q4",
      maxRetries = 3,
    } = options;

    // If already initialized, return the existing function
    if (this.#isInitialized && this.#instance) {
      return this.#createInferenceFunction();
    }

    // If currently loading, wait for it to complete
    if (this.#loadingPromise) {
      await this.#loadingPromise;
      return this.#createInferenceFunction();
    }

    // Start loading the pipeline
    this.#loadingPromise = this.#initializePipeline(
      progressCallback,
      { modelName, task, device,  maxRetries }
    );

    try {
      await this.#loadingPromise;
      this.#isInitialized = true;
      return this.#createInferenceFunction();
    } catch (error) {
      this.#loadingPromise = null;
      this.#isInitialized = false;
      throw new Error(`Failed to initialize pipeline: ${error.message}`);
    }
  }

  /**
   * Initialize the pipeline with retry logic
   */
  static async #initializePipeline(progressCallback, config) {
    const { modelName, task, device, dtype, maxRetries } = config;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Initializing pipeline (attempt ${attempt}/${maxRetries})...`);
        
        this.#instance = await pipeline(task, modelName, {
          progress_callback: (data) => {
            if (progressCallback) {
              progressCallback({
                ...data,
                attempt,
                maxRetries
              });
            }
          },
          device,
          dtype,
        });

        console.log('Pipeline initialized successfully');
        this.#retryCount = 0;
        return;
      } catch (error) {
        console.error(`Pipeline initialization attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Create the inference function with proper promise chaining
   */
  static #createInferenceFunction() {
    return async (...args) => {
      if (!this.#instance) {
        throw new Error('Pipeline not initialized');
      }

      // Chain promises to ensure sequential execution
      this.#currentPromise = this.#currentPromise.then(async () => {
        try {
          return await this.#instance(...args);
        } catch (error) {
          console.error('Inference error:', error);
          throw error;
        }
      });

      return this.#currentPromise;
    };
  }

  /**
   * Check if the pipeline is ready
   */
  static isReady() {
    return this.#isInitialized && this.#instance !== null;
  }

  /**
   * Get the current loading status
   */
  static isLoading() {
    return this.#loadingPromise !== null;
  }

  /**
   * Reset the pipeline (useful for testing or recovery)
   */
  static async reset() {
    console.log('Resetting pipeline...');
    
    // Wait for any ongoing operations to complete
    await this.#currentPromise;
    
    // Clear all state
    this.#instance = null;
    this.#loadingPromise = null;
    this.#currentPromise = Promise.resolve();
    this.#isInitialized = false;
    this.#retryCount = 0;
    
    console.log('Pipeline reset complete');
  }

  /**
   * Cleanup resources (call when extension is unloaded)
   */
  static async cleanup() {
    console.log('Cleaning up pipeline...');
    
    try {
      await this.#currentPromise;
      
      if (this.#instance && typeof this.#instance.dispose === 'function') {
        await this.#instance.dispose();
      }
      
      this.reset();
      console.log('Pipeline cleanup complete');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Create generic classify function with improved error handling
const classify = async (text, options = {}) => {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }

  try {
    // Get the pipeline instance with progress tracking
    const classifier = await PipelineManager.getInstance(
      (progressData) => {
        // Enhanced progress tracking
        console.log('Pipeline progress:', progressData);
        
        // You can send progress updates to the UI here
        // chrome.runtime.sendMessage({
        //   action: 'progress',
        //   data: progressData
        // });
      },
      options
    );

    // Run the model on the input text
    const result = await classifier(text);
    return result;
  } catch (error) {
    console.error('Classification failed:', error);
    
    // Provide more specific error messages
    if (error.message.includes('Failed to initialize pipeline')) {
      throw new Error('Model failed to load. Please try again or check your internet connection.');
    } else if (error.message.includes('WebGPU')) {
      throw new Error('WebGPU not available. Please use a compatible browser.');
    } else {
      throw new Error(`Classification failed: ${error.message}`);
    }
  }
};

////////////////////// 1. Context Menus //////////////////////
//
// Add a listener to create the initial context menu items,
// context menu items only need to be created at runtime.onInstalled
chrome.runtime.onInstalled.addListener(function () {
  // Register a context menu item that will only show up for selection text.
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ITEM_ID,
    title: 'Classify "%s"',
    contexts: ["selection"],
  });
});

// Perform inference when the user clicks a context menu
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  // Ignore context menu clicks that are not for classifications (or when there is no input)
  if (info.menuItemId !== CONTEXT_MENU_ITEM_ID || !info.selectionText) return;

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
  if (message.action !== "classify") return; // Ignore messages that are not meant for classification.

  // Run model prediction asynchronously
  (async function () {
    // Perform classification
    const result = await classify(message.text);

    // Send response back to UI
    sendResponse(result);
  })();

  // return true to indicate we will send a response asynchronously
  // see https://stackoverflow.com/a/46628145 for more information
  return true;
});
//////////////////////////////////////////////////////////////

// Cleanup when extension is unloaded
chrome.runtime.onSuspend.addListener(async () => {
  console.log('Extension is being unloaded, cleaning up...');
  await PipelineManager.cleanup();
});
