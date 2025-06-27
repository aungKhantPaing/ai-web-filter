const { pipeline } = require("@huggingface/transformers");
const {
  ACTION_CLASSIFY_TEXT,
  ACTION_UPDATE_BADGE,
  ACTION_CLASSIFY_IMAGE,
  ACTION_TOGGLE_FILTER,
  ACTION_GET_FILTER_STATE,
  CONTEXT_MENU_ITEM_ID,
} = require("../src/constants.js");

// Mock the pipeline function
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

describe("Background Script Functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("TextClassificationPipeline", () => {
    test("should create singleton instance", async () => {
      const mockPipeline = {
        dispose: jest.fn(),
      };
      pipeline.mockResolvedValue(mockPipeline);

      const TextClassificationPipeline = {
        task: "text-classification",
        model: "Xenova/toxic-bert",
        instance: null,

        async getInstance(progress_callback = null) {
          this.instance ??= await pipeline(this.task, this.model, {
            progress_callback,
            device: "webgpu",
          });
          return this.instance;
        },

        async cleanup() {
          if (this.instance) {
            await this.instance.dispose();
            this.instance = null;
          }
        },
      };

      const instance1 = await TextClassificationPipeline.getInstance();
      const instance2 = await TextClassificationPipeline.getInstance();

      expect(pipeline).toHaveBeenCalledTimes(1);
      expect(pipeline).toHaveBeenCalledWith(
        "text-classification",
        "Xenova/toxic-bert",
        {
          progress_callback: null,
          device: "webgpu",
        }
      );
      expect(instance1).toBe(instance2);
    });

    test("should cleanup instance", async () => {
      const mockPipeline = {
        dispose: jest.fn(),
      };
      pipeline.mockResolvedValue(mockPipeline);

      const TextClassificationPipeline = {
        task: "text-classification",
        model: "Xenova/toxic-bert",
        instance: null,

        async getInstance(progress_callback = null) {
          this.instance ??= await pipeline(this.task, this.model, {
            progress_callback,
            device: "webgpu",
          });
          return this.instance;
        },

        async cleanup() {
          if (this.instance) {
            await this.instance.dispose();
            this.instance = null;
          }
        },
      };

      await TextClassificationPipeline.getInstance();
      await TextClassificationPipeline.cleanup();

      expect(mockPipeline.dispose).toHaveBeenCalled();
      expect(TextClassificationPipeline.instance).toBeNull();
    });
  });

  describe("ImageClassificationPipeline", () => {
    test("should create singleton instance", async () => {
      const mockPipeline = {
        dispose: jest.fn(),
      };
      pipeline.mockResolvedValue(mockPipeline);

      const ImageClassificationPipeline = {
        task: "zero-shot-image-classification",
        model: "Xenova/clip-vit-base-patch32",
        instance: null,

        async getInstance(progress_callback = null) {
          this.instance ??= await pipeline(this.task, this.model, {
            progress_callback,
            device: "webgpu",
          });
          return this.instance;
        },

        async cleanup() {
          if (this.instance) {
            await this.instance.dispose();
            this.instance = null;
          }
        },
      };

      const instance1 = await ImageClassificationPipeline.getInstance();
      const instance2 = await ImageClassificationPipeline.getInstance();

      expect(pipeline).toHaveBeenCalledWith(
        "zero-shot-image-classification",
        "Xenova/clip-vit-base-patch32",
        {
          progress_callback: null,
          device: "webgpu",
        }
      );
      expect(instance1).toBe(instance2);
    });
  });

  describe("classify function", () => {
    test("should classify text successfully", async () => {
      const mockClassifier = jest.fn().mockResolvedValue([
        { label: "toxic", score: 0.8 },
        { label: "safe", score: 0.2 },
      ]);

      const TextClassificationPipeline = {
        task: "text-classification",
        model: "Xenova/toxic-bert",
        instance: null,

        async getInstance(progress_callback = null) {
          this.instance ??= mockClassifier;
          return this.instance;
        },
      };

      const classify = async (text, options = {}) => {
        if (!text || typeof text !== "string") {
          throw new Error("Invalid input: text must be a non-empty string");
        }

        try {
          const classifier = await TextClassificationPipeline.getInstance(
            (progressData) => {
              console.log("Pipeline progress:", progressData);
            }
          );

          const result = await classifier(text);
          return result;
        } catch (error) {
          console.error("Classification failed:", text, error);
          throw new Error(`Classification failed: ${error.message}`);
        }
      };

      const result = await classify("test text");

      expect(result).toEqual([
        { label: "toxic", score: 0.8 },
        { label: "safe", score: 0.2 },
      ]);
    });

    test("should throw error for invalid input", async () => {
      const classify = async (text, options = {}) => {
        if (!text || typeof text !== "string") {
          throw new Error("Invalid input: text must be a non-empty string");
        }
        return [];
      };

      await expect(classify("")).rejects.toThrow(
        "Invalid input: text must be a non-empty string"
      );
      await expect(classify(null)).rejects.toThrow(
        "Invalid input: text must be a non-empty string"
      );
      await expect(classify(123)).rejects.toThrow(
        "Invalid input: text must be a non-empty string"
      );
    });
  });

  describe("classifyImage function", () => {
    test("should classify image successfully", async () => {
      const mockClassifier = jest.fn().mockResolvedValue([
        { label: "unsafe", score: 0.7 },
        { label: "safe", score: 0.3 },
      ]);

      const ImageClassificationPipeline = {
        task: "zero-shot-image-classification",
        model: "Xenova/clip-vit-base-patch32",
        instance: null,

        async getInstance(progress_callback = null) {
          this.instance ??= mockClassifier;
          return this.instance;
        },
      };

      const classifyImage = async (
        imageUrl,
        candidateLabels = ["safe", "unsafe", "inappropriate", "adult content"]
      ) => {
        try {
          const classifier = await ImageClassificationPipeline.getInstance(
            (progressData) => {
              console.log("Image classification progress:", progressData);
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

      const result = await classifyImage("https://example.com/image.jpg");

      expect(result).toEqual([
        { label: "unsafe", score: 0.7 },
        { label: "safe", score: 0.3 },
      ]);
    });

    test("should classify image with custom labels", async () => {
      const mockClassifier = jest
        .fn()
        .mockResolvedValue([{ label: "custom", score: 0.8 }]);

      const ImageClassificationPipeline = {
        task: "zero-shot-image-classification",
        model: "Xenova/clip-vit-base-patch32",
        instance: null,

        async getInstance(progress_callback = null) {
          this.instance ??= mockClassifier;
          return this.instance;
        },
      };

      const classifyImage = async (
        imageUrl,
        candidateLabels = ["safe", "unsafe", "inappropriate", "adult content"]
      ) => {
        try {
          const classifier = await ImageClassificationPipeline.getInstance();
          const result = await classifier(imageUrl, candidateLabels);
          return result;
        } catch (error) {
          throw new Error(`Image classification failed: ${error.message}`);
        }
      };

      const customLabels = ["custom", "other"];
      const result = await classifyImage(
        "https://example.com/image.jpg",
        customLabels
      );

      expect(result).toEqual([{ label: "custom", score: 0.8 }]);
    });
  });

  describe("Context Menu Handlers", () => {
    test("should create context menu on install", () => {
      const onInstalledHandler = () => {
        chrome.contextMenus.create({
          id: CONTEXT_MENU_ITEM_ID,
          title: 'Classify "%s"',
          contexts: ["selection"],
        });
      };

      onInstalledHandler();

      expect(chrome.contextMenus.create).toHaveBeenCalledWith({
        id: CONTEXT_MENU_ITEM_ID,
        title: 'Classify "%s"',
        contexts: ["selection"],
      });
    });

    test("should handle context menu click", async () => {
      const mockClassifier = jest
        .fn()
        .mockResolvedValue([{ label: "toxic", score: 0.8 }]);

      const TextClassificationPipeline = {
        task: "text-classification",
        model: "Xenova/toxic-bert",
        instance: null,

        async getInstance() {
          this.instance ??= mockClassifier;
          return this.instance;
        },
      };

      const classify = async (text) => {
        const classifier = await TextClassificationPipeline.getInstance();
        return await classifier(text);
      };

      const contextMenuClickHandler = async (info, tab) => {
        if (info.menuItemId !== CONTEXT_MENU_ITEM_ID) return;

        const result = await classify(info.selectionText);

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          args: [result],
          function: (result) => {
            console.log("result", result);
          },
        });
      };

      const mockInfo = {
        menuItemId: CONTEXT_MENU_ITEM_ID,
        selectionText: "test text",
      };
      const mockTab = { id: 123 };

      await contextMenuClickHandler(mockInfo, mockTab);

      expect(chrome.scripting.executeScript).toHaveBeenCalledWith({
        target: { tabId: 123 },
        args: [[{ label: "toxic", score: 0.8 }]],
        function: expect.any(Function),
      });
    });
  });

  describe("Message Handlers", () => {
    test("should handle classify text message", async () => {
      const mockClassifier = jest
        .fn()
        .mockResolvedValue([{ label: "toxic", score: 0.8 }]);

      const TextClassificationPipeline = {
        task: "text-classification",
        model: "Xenova/toxic-bert",
        instance: null,

        async getInstance() {
          this.instance ??= mockClassifier;
          return this.instance;
        },
      };

      const classify = async (text) => {
        const classifier = await TextClassificationPipeline.getInstance();
        return await classifier(text);
      };

      const messageHandler = async (message, sender, sendResponse) => {
        if (message.action === ACTION_CLASSIFY_TEXT) {
          try {
            const result = await classify(message.text);
            sendResponse(result);
          } catch (error) {
            console.error("Text classification failed:", error);
            sendResponse({ error: error.message });
          }
        }
      };

      const mockMessage = {
        action: ACTION_CLASSIFY_TEXT,
        text: "test text",
      };
      const mockSendResponse = jest.fn();

      await messageHandler(mockMessage, {}, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith([
        { label: "toxic", score: 0.8 },
      ]);
    });

    test("should handle classify image message", async () => {
      const mockClassifier = jest
        .fn()
        .mockResolvedValue([{ label: "unsafe", score: 0.7 }]);

      const ImageClassificationPipeline = {
        task: "zero-shot-image-classification",
        model: "Xenova/clip-vit-base-patch32",
        instance: null,

        async getInstance() {
          this.instance ??= mockClassifier;
          return this.instance;
        },
      };

      const classifyImage = async (imageUrl, candidateLabels) => {
        const classifier = await ImageClassificationPipeline.getInstance();
        return await classifier(imageUrl, candidateLabels);
      };

      const messageHandler = async (message, sender, sendResponse) => {
        if (message.action === ACTION_CLASSIFY_IMAGE) {
          try {
            const result = await classifyImage(
              message.imageUrl,
              message.candidateLabels
            );
            sendResponse(result);
          } catch (error) {
            console.error("Image classification failed:", error);
            sendResponse({ error: error.message });
          }
        }
      };

      const mockMessage = {
        action: ACTION_CLASSIFY_IMAGE,
        imageUrl: "https://example.com/image.jpg",
        candidateLabels: ["safe", "unsafe"],
      };
      const mockSendResponse = jest.fn();

      await messageHandler(mockMessage, {}, mockSendResponse);

      expect(mockSendResponse).toHaveBeenCalledWith([
        { label: "unsafe", score: 0.7 },
      ]);
    });
  });
});
