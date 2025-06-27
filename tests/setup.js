// Mock Chrome extension APIs
global.chrome = {
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

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock DOM APIs that might not be available in jsdom
global.document.createTreeWalker = jest.fn();
global.window.getComputedStyle = jest.fn(() => ({
  display: "block",
  visibility: "visible",
}));

// Mock fetch for image classification tests
global.fetch = jest.fn();

// Mock Transformers.js
jest.mock("@huggingface/transformers", () => ({
  env: {
    backends: {
      onnx: {
        wasm: {
          wasmPaths: "",
        },
      },
    },
    allowLocalModels: false,
  },
  pipeline: jest.fn(),
}));
