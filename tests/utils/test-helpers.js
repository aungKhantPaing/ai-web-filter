/**
 * Test utility functions for the browser extension tests
 */

/**
 * Creates a mock Chrome extension environment
 * @param {Object} overrides - Override default mock implementations
 * @returns {Object} Mock Chrome API object
 */
function createMockChromeAPI(overrides = {}) {
  const defaultMocks = {
    runtime: {
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn(),
        removeListener: jest.fn(),
      },
      onInstalled: {
        addListener: jest.fn(),
      },
    },
    storage: {
      local: {
        get: jest.fn(),
        set: jest.fn(),
        clear: jest.fn(),
      },
    },
    contextMenus: {
      create: jest.fn(),
      onClicked: {
        addListener: jest.fn(),
      },
    },
    scripting: {
      executeScript: jest.fn(),
    },
    tabs: {
      query: jest.fn(),
      sendMessage: jest.fn(),
    },
  };

  return {
    ...defaultMocks,
    ...overrides,
  };
}

/**
 * Creates a mock DOM environment for testing
 * @param {string} html - HTML string to set as body content
 * @returns {Object} DOM elements for testing
 */
function createMockDOM(html = "") {
  document.body.innerHTML = html;

  return {
    body: document.body,
    getElement: (id) => document.getElementById(id),
    querySelector: (selector) => document.querySelector(selector),
    querySelectorAll: (selector) => document.querySelectorAll(selector),
    createElement: (tag) => document.createElement(tag),
  };
}

/**
 * Creates a mock classification result
 * @param {string} label - Classification label
 * @param {number} score - Classification score
 * @returns {Object} Mock classification result
 */
function createMockClassification(label = "safe", score = 0.5) {
  return {
    label,
    score,
  };
}

/**
 * Creates a mock text classification response
 * @param {Array} classifications - Array of classification results
 * @returns {Array} Mock text classification response
 */
function createMockTextClassification(classifications = []) {
  return classifications.length > 0
    ? classifications
    : [
        { label: "toxic", score: 0.3 },
        { label: "safe", score: 0.7 },
      ];
}

/**
 * Creates a mock image classification response
 * @param {Array} classifications - Array of classification results
 * @returns {Array} Mock image classification response
 */
function createMockImageClassification(classifications = []) {
  return classifications.length > 0
    ? classifications
    : [
        { label: "unsafe", score: 0.4 },
        { label: "safe", score: 0.6 },
      ];
}

/**
 * Waits for a specified number of milliseconds
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after the delay
 */
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Creates a mock pipeline instance
 * @param {Function} mockFn - Mock function to call
 * @returns {Object} Mock pipeline instance
 */
function createMockPipeline(mockFn = jest.fn()) {
  return {
    dispose: jest.fn(),
    mockResolvedValue: (value) => mockFn.mockResolvedValue(value),
    mockRejectedValue: (error) => mockFn.mockRejectedValue(error),
  };
}

/**
 * Asserts that a function throws an error with a specific message
 * @param {Function} fn - Function to test
 * @param {string} expectedMessage - Expected error message
 * @returns {Promise} Promise that resolves if assertion passes
 */
async function expectToThrow(fn, expectedMessage) {
  try {
    await fn();
    throw new Error("Expected function to throw an error");
  } catch (error) {
    expect(error.message).toContain(expectedMessage);
  }
}

/**
 * Creates a mock filter configuration
 * @param {Object} config - Filter configuration overrides
 * @returns {Object} Mock filter configuration
 */
function createMockFilterConfig(config = {}) {
  return {
    textFilter: {
      isEnabled: false,
      strictness: 80,
      ...config.textFilter,
    },
    imageFilter: {
      isEnabled: false,
      strictness: 80,
      ...config.imageFilter,
    },
    ...config,
  };
}

/**
 * Simulates a Chrome storage operation
 * @param {Object} chrome - Mock Chrome API
 * @param {string} key - Storage key
 * @param {any} value - Value to store
 */
function simulateStorageSet(chrome, key, value) {
  chrome.storage.local.set.mockImplementation(async (data) => {
    // Simulate storage being set
    return Promise.resolve();
  });
}

/**
 * Simulates a Chrome storage retrieval
 * @param {Object} chrome - Mock Chrome API
 * @param {string} key - Storage key
 * @param {any} value - Value to retrieve
 */
function simulateStorageGet(chrome, key, value) {
  chrome.storage.local.get.mockImplementation(async (keys) => {
    if (Array.isArray(keys)) {
      const result = {};
      keys.forEach((key) => {
        result[key] = value[key] || null;
      });
      return result;
    }
    return { [keys]: value };
  });
}

module.exports = {
  createMockChromeAPI,
  createMockDOM,
  createMockClassification,
  createMockTextClassification,
  createMockImageClassification,
  wait,
  createMockPipeline,
  expectToThrow,
  createMockFilterConfig,
  simulateStorageSet,
  simulateStorageGet,
};
