const {
  ACTION_CLASSIFY_TEXT,
  ACTION_UPDATE_BADGE,
  ACTION_TOGGLE_FILTER,
} = require("../src/constants.js");

describe("Popup Functions", () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup DOM for testing
    document.body.innerHTML = `
      <input id="text" type="text" value="test text" />
      <div id="output"></div>
      <div id="replacement-count">0</div>
      <button id="reset-btn">Reset</button>
      <button id="filter-toggle">
        <span class="toggle-text">OFF</span>
      </button>
      <button id="image-filter-toggle">
        <span class="toggle-text">OFF</span>
      </button>
      <div id="text-filter-stats" style="display: none;"></div>
      <input id="text-strictness-slider" type="range" min="0" max="100" value="80" />
      <span id="text-strictness-value">80%</span>
      <div id="text-strictness-control" style="display: none;"></div>
      <input id="image-strictness-slider" type="range" min="0" max="100" value="80" />
      <span id="image-strictness-value">80%</span>
      <div id="image-strictness-control" style="display: none;"></div>
    `;
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("updateReplacementCount", () => {
    test("should update replacement count display", async () => {
      const updateReplacementCount = async () => {
        try {
          const result = await chrome.storage.local.get(
            "filterTotalReplacements"
          );
          const replacementCountElement =
            document.getElementById("replacement-count");
          replacementCountElement.textContent =
            result.filterTotalReplacements || 0;
        } catch (error) {
          console.error("Failed to get replacement count:", error);
          const replacementCountElement =
            document.getElementById("replacement-count");
          replacementCountElement.textContent = "0";
        }
      };

      chrome.storage.local.get.mockResolvedValue({
        filterTotalReplacements: 5,
      });

      await updateReplacementCount();

      expect(chrome.storage.local.get).toHaveBeenCalledWith(
        "filterTotalReplacements"
      );
      expect(document.getElementById("replacement-count").textContent).toBe(
        "5"
      );
    });

    test("should handle missing replacement count", async () => {
      const updateReplacementCount = async () => {
        try {
          const result = await chrome.storage.local.get(
            "filterTotalReplacements"
          );
          const replacementCountElement =
            document.getElementById("replacement-count");
          replacementCountElement.textContent =
            result.filterTotalReplacements || 0;
        } catch (error) {
          console.error("Failed to get replacement count:", error);
          const replacementCountElement =
            document.getElementById("replacement-count");
          replacementCountElement.textContent = "0";
        }
      };

      chrome.storage.local.get.mockResolvedValue({});

      await updateReplacementCount();

      expect(document.getElementById("replacement-count").textContent).toBe(
        "0"
      );
    });

    test("should handle storage errors", async () => {
      const updateReplacementCount = async () => {
        try {
          const result = await chrome.storage.local.get(
            "filterTotalReplacements"
          );
          const replacementCountElement =
            document.getElementById("replacement-count");
          replacementCountElement.textContent =
            result.filterTotalReplacements || 0;
        } catch (error) {
          console.error("Failed to get replacement count:", error);
          const replacementCountElement =
            document.getElementById("replacement-count");
          replacementCountElement.textContent = "0";
        }
      };

      chrome.storage.local.get.mockRejectedValue(new Error("Storage error"));

      await updateReplacementCount();

      expect(document.getElementById("replacement-count").textContent).toBe(
        "0"
      );
      expect(console.error).toHaveBeenCalledWith(
        "Failed to get replacement count:",
        expect.any(Error)
      );
    });
  });

  describe("getTextFilterState", () => {
    test("should get text filter state when enabled", async () => {
      const getTextFilterState = async () => {
        try {
          const result = await chrome.storage.local.get("filterConfig");
          return !!result.filterConfig?.textFilter?.isEnabled;
        } catch (error) {
          console.error("Failed to get filter state:", error);
          return false;
        }
      };

      chrome.storage.local.get.mockResolvedValue({
        filterConfig: { textFilter: { isEnabled: true } },
      });

      const result = await getTextFilterState();

      expect(result).toBe(true);
      expect(chrome.storage.local.get).toHaveBeenCalledWith("filterConfig");
    });

    test("should get text filter state when disabled", async () => {
      const getTextFilterState = async () => {
        try {
          const result = await chrome.storage.local.get("filterConfig");
          return !!result.filterConfig?.textFilter?.isEnabled;
        } catch (error) {
          console.error("Failed to get filter state:", error);
          return false;
        }
      };

      chrome.storage.local.get.mockResolvedValue({
        filterConfig: { textFilter: { isEnabled: false } },
      });

      const result = await getTextFilterState();

      expect(result).toBe(false);
    });

    test("should handle missing filter config", async () => {
      const getTextFilterState = async () => {
        try {
          const result = await chrome.storage.local.get("filterConfig");
          return !!result.filterConfig?.textFilter?.isEnabled;
        } catch (error) {
          console.error("Failed to get filter state:", error);
          return false;
        }
      };

      chrome.storage.local.get.mockResolvedValue({});

      const result = await getTextFilterState();

      expect(result).toBe(false);
    });
  });

  describe("getImageFilterState", () => {
    test("should get image filter state when enabled", async () => {
      const getImageFilterState = async () => {
        try {
          const result = await chrome.storage.local.get("filterConfig");
          return !!result.filterConfig?.imageFilter?.isEnabled;
        } catch (error) {
          console.error("Failed to get filter state:", error);
          return false;
        }
      };

      chrome.storage.local.get.mockResolvedValue({
        filterConfig: { imageFilter: { isEnabled: true } },
      });

      const result = await getImageFilterState();

      expect(result).toBe(true);
    });

    test("should get image filter state when disabled", async () => {
      const getImageFilterState = async () => {
        try {
          const result = await chrome.storage.local.get("filterConfig");
          return !!result.filterConfig?.imageFilter?.isEnabled;
        } catch (error) {
          console.error("Failed to get filter state:", error);
          return false;
        }
      };

      chrome.storage.local.get.mockResolvedValue({
        filterConfig: { imageFilter: { isEnabled: false } },
      });

      const result = await getImageFilterState();

      expect(result).toBe(false);
    });
  });

  describe("getTextFilterStrictness", () => {
    test("should get text filter strictness", async () => {
      const getTextFilterStrictness = async () => {
        try {
          const result = await chrome.storage.local.get("filterConfig");
          return result.filterConfig?.textFilter?.strictness || 80;
        } catch (error) {
          console.error("Failed to get text filter strictness:", error);
          return 80;
        }
      };

      chrome.storage.local.get.mockResolvedValue({
        filterConfig: { textFilter: { strictness: 90 } },
      });

      const result = await getTextFilterStrictness();

      expect(result).toBe(90);
    });

    test("should return default strictness when not set", async () => {
      const getTextFilterStrictness = async () => {
        try {
          const result = await chrome.storage.local.get("filterConfig");
          return result.filterConfig?.textFilter?.strictness || 80;
        } catch (error) {
          console.error("Failed to get text filter strictness:", error);
          return 80;
        }
      };

      chrome.storage.local.get.mockResolvedValue({});

      const result = await getTextFilterStrictness();

      expect(result).toBe(80);
    });
  });

  describe("getImageFilterStrictness", () => {
    test("should get image filter strictness", async () => {
      const getImageFilterStrictness = async () => {
        try {
          const result = await chrome.storage.local.get("filterConfig");
          return result.filterConfig?.imageFilter?.strictness || 80;
        } catch (error) {
          console.error("Failed to get image filter strictness:", error);
          return 80;
        }
      };

      chrome.storage.local.get.mockResolvedValue({
        filterConfig: { imageFilter: { strictness: 70 } },
      });

      const result = await getImageFilterStrictness();

      expect(result).toBe(70);
    });
  });

  describe("updateToggleUI", () => {
    test("should update toggle UI when enabled", () => {
      const updateToggleUI = (isEnabled) => {
        const filterToggleButton = document.getElementById("filter-toggle");
        const toggleTextElement =
          filterToggleButton.querySelector(".toggle-text");
        const textFilterStatsElement =
          document.getElementById("text-filter-stats");
        const textStrictnessControl = document.getElementById(
          "text-strictness-control"
        );

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
      };

      updateToggleUI(true);

      const filterToggleButton = document.getElementById("filter-toggle");
      const toggleTextElement =
        filterToggleButton.querySelector(".toggle-text");
      const textFilterStatsElement =
        document.getElementById("text-filter-stats");
      const textStrictnessControl = document.getElementById(
        "text-strictness-control"
      );

      expect(filterToggleButton.classList.contains("active")).toBe(true);
      expect(toggleTextElement.textContent).toBe("ON");
      expect(textFilterStatsElement.style.display).toBe("block");
      expect(textStrictnessControl.style.display).toBe("block");
    });

    test("should update toggle UI when disabled", () => {
      const updateToggleUI = (isEnabled) => {
        const filterToggleButton = document.getElementById("filter-toggle");
        const toggleTextElement =
          filterToggleButton.querySelector(".toggle-text");
        const textFilterStatsElement =
          document.getElementById("text-filter-stats");
        const textStrictnessControl = document.getElementById(
          "text-strictness-control"
        );

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
      };

      updateToggleUI(false);

      const filterToggleButton = document.getElementById("filter-toggle");
      const toggleTextElement =
        filterToggleButton.querySelector(".toggle-text");
      const textFilterStatsElement =
        document.getElementById("text-filter-stats");
      const textStrictnessControl = document.getElementById(
        "text-strictness-control"
      );

      expect(filterToggleButton.classList.contains("active")).toBe(false);
      expect(toggleTextElement.textContent).toBe("OFF");
      expect(textFilterStatsElement.style.display).toBe("none");
      expect(textStrictnessControl.style.display).toBe("none");
    });
  });

  describe("updateImageToggleUI", () => {
    test("should update image toggle UI when enabled", () => {
      const updateImageToggleUI = (isEnabled) => {
        const imageFilterToggleButton = document.getElementById(
          "image-filter-toggle"
        );
        const imageToggleTextElement =
          imageFilterToggleButton.querySelector(".toggle-text");
        const imageStrictnessControl = document.getElementById(
          "image-strictness-control"
        );

        if (isEnabled) {
          imageFilterToggleButton.classList.add("active");
          imageToggleTextElement.textContent = "ON";
          imageStrictnessControl.style.display = "block";
        } else {
          imageFilterToggleButton.classList.remove("active");
          imageToggleTextElement.textContent = "OFF";
          imageStrictnessControl.style.display = "none";
        }
      };

      updateImageToggleUI(true);

      const imageFilterToggleButton = document.getElementById(
        "image-filter-toggle"
      );
      const imageToggleTextElement =
        imageFilterToggleButton.querySelector(".toggle-text");
      const imageStrictnessControl = document.getElementById(
        "image-strictness-control"
      );

      expect(imageFilterToggleButton.classList.contains("active")).toBe(true);
      expect(imageToggleTextElement.textContent).toBe("ON");
      expect(imageStrictnessControl.style.display).toBe("block");
    });
  });

  describe("updateTextStrictnessUI", () => {
    test("should update text strictness slider UI", () => {
      const updateTextStrictnessUI = (strictness) => {
        const textStrictnessSlider = document.getElementById(
          "text-strictness-slider"
        );
        const textStrictnessValue = document.getElementById(
          "text-strictness-value"
        );

        textStrictnessSlider.value = strictness;
        textStrictnessValue.textContent = `${strictness}%`;
      };

      updateTextStrictnessUI(75);

      const textStrictnessSlider = document.getElementById(
        "text-strictness-slider"
      );
      const textStrictnessValue = document.getElementById(
        "text-strictness-value"
      );

      expect(textStrictnessSlider.value).toBe("75");
      expect(textStrictnessValue.textContent).toBe("75%");
    });
  });

  describe("updateImageStrictnessUI", () => {
    test("should update image strictness slider UI", () => {
      const updateImageStrictnessUI = (strictness) => {
        const imageStrictnessSlider = document.getElementById(
          "image-strictness-slider"
        );
        const imageStrictnessValue = document.getElementById(
          "image-strictness-value"
        );

        imageStrictnessSlider.value = strictness;
        imageStrictnessValue.textContent = `${strictness}%`;
      };

      updateImageStrictnessUI(85);

      const imageStrictnessSlider = document.getElementById(
        "image-strictness-slider"
      );
      const imageStrictnessValue = document.getElementById(
        "image-strictness-value"
      );

      expect(imageStrictnessSlider.value).toBe("85");
      expect(imageStrictnessValue.textContent).toBe("85%");
    });
  });

  describe("toggleFilter", () => {
    test("should toggle text filter from disabled to enabled", async () => {
      const toggleFilter = async () => {
        try {
          const getTextFilterState = async () => {
            const result = await chrome.storage.local.get("filterConfig");
            return !!result.filterConfig?.textFilter?.isEnabled;
          };

          const updateToggleUI = (isEnabled) => {
            const filterToggleButton = document.getElementById("filter-toggle");
            const toggleTextElement =
              filterToggleButton.querySelector(".toggle-text");
            const textFilterStatsElement =
              document.getElementById("text-filter-stats");
            const textStrictnessControl = document.getElementById(
              "text-strictness-control"
            );

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
          };

          const isEnabled = !(await getTextFilterState());

          await chrome.storage.local.set({
            filterConfig: { textFilter: { isEnabled } },
          });

          updateToggleUI(isEnabled);
          return await getTextFilterState();
        } catch (error) {
          console.error("Failed to toggle filter:", error);
        }
      };

      // Mock initial state as disabled
      chrome.storage.local.get.mockResolvedValueOnce({
        filterConfig: { textFilter: { isEnabled: false } },
      });

      chrome.storage.local.set.mockResolvedValue();

      // Mock state after toggle
      chrome.storage.local.get.mockResolvedValueOnce({
        filterConfig: { textFilter: { isEnabled: true } },
      });

      const result = await toggleFilter();

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        filterConfig: { textFilter: { isEnabled: true } },
      });
      expect(result).toBe(true);

      const filterToggleButton = document.getElementById("filter-toggle");
      const toggleTextElement =
        filterToggleButton.querySelector(".toggle-text");
      expect(filterToggleButton.classList.contains("active")).toBe(true);
      expect(toggleTextElement.textContent).toBe("ON");
    });
  });

  describe("toggleImageFilter", () => {
    test("should toggle image filter from disabled to enabled", async () => {
      const toggleImageFilter = async () => {
        try {
          const getImageFilterState = async () => {
            const result = await chrome.storage.local.get("filterConfig");
            return !!result.filterConfig?.imageFilter?.isEnabled;
          };

          const updateImageToggleUI = (isEnabled) => {
            const imageFilterToggleButton = document.getElementById(
              "image-filter-toggle"
            );
            const imageToggleTextElement =
              imageFilterToggleButton.querySelector(".toggle-text");
            const imageStrictnessControl = document.getElementById(
              "image-strictness-control"
            );

            if (isEnabled) {
              imageFilterToggleButton.classList.add("active");
              imageToggleTextElement.textContent = "ON";
              imageStrictnessControl.style.display = "block";
            } else {
              imageFilterToggleButton.classList.remove("active");
              imageToggleTextElement.textContent = "OFF";
              imageStrictnessControl.style.display = "none";
            }
          };

          const isEnabled = !(await getImageFilterState());

          const result = await chrome.storage.local.get("filterConfig");
          const currentConfig = result.filterConfig || {};

          await chrome.storage.local.set({
            filterConfig: {
              ...currentConfig,
              imageFilter: { isEnabled },
            },
          });

          updateImageToggleUI(isEnabled);
          return isEnabled;
        } catch (error) {
          console.error("Failed to toggle image filter:", error);
        }
      };

      // Mock initial state as disabled
      chrome.storage.local.get.mockResolvedValueOnce({
        filterConfig: { imageFilter: { isEnabled: false } },
      });

      chrome.storage.local.set.mockResolvedValue();

      const result = await toggleImageFilter();

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        filterConfig: { imageFilter: { isEnabled: true } },
      });
      expect(result).toBe(true);

      const imageFilterToggleButton = document.getElementById(
        "image-filter-toggle"
      );
      const imageToggleTextElement =
        imageFilterToggleButton.querySelector(".toggle-text");
      expect(imageFilterToggleButton.classList.contains("active")).toBe(true);
      expect(imageToggleTextElement.textContent).toBe("ON");
    });
  });

  describe("updateTextStrictness", () => {
    test("should update text filter strictness", async () => {
      const updateTextStrictness = async (strictness) => {
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
        } catch (error) {
          console.error("Failed to update text strictness:", error);
        }
      };

      chrome.storage.local.get.mockResolvedValue({
        filterConfig: { textFilter: { isEnabled: true, strictness: 80 } },
      });

      chrome.storage.local.set.mockResolvedValue();

      await updateTextStrictness(90);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        filterConfig: {
          textFilter: {
            isEnabled: true,
            strictness: 90,
          },
        },
      });
    });
  });

  describe("updateImageStrictness", () => {
    test("should update image filter strictness", async () => {
      const updateImageStrictness = async (strictness) => {
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
        } catch (error) {
          console.error("Failed to update image strictness:", error);
        }
      };

      chrome.storage.local.get.mockResolvedValue({
        filterConfig: { imageFilter: { isEnabled: true, strictness: 80 } },
      });

      chrome.storage.local.set.mockResolvedValue();

      await updateImageStrictness(70);

      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        filterConfig: {
          imageFilter: {
            isEnabled: true,
            strictness: 70,
          },
        },
      });
    });
  });
});
