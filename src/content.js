// content.js - the content scripts which is run in the context of web pages, and has access
// to the DOM and other web APIs.
//
// Example usage:
//
import {
  ACTION_CLASSIFY_TEXT,
  ACTION_UPDATE_BADGE,
  ACTION_CLASSIFY_IMAGE,
} from "./constants.js";

// Cache for classified text to avoid re-classification
const textClassificationCache = new Map();
const imageClassificationCache = new Map();
const replacedSentences = new Set();
// Remove the problematic chrome.tabs.query() call
// Content scripts don't have access to chrome.tabs API

console.log("Content script loaded");
const message = {
  action: ACTION_CLASSIFY_TEXT,
  text: "Hello, how are you?",
};
const response = await chrome.runtime.sendMessage(message);

console.log("received user data", response);

function updateBadge(value) {
  chrome.runtime.sendMessage({
    action: ACTION_UPDATE_BADGE,
    count: value,
  });
}

const classifyText = async (text) => {
  // Check if text is already classified
  if (textClassificationCache.has(text)) {
    console.log(
      "Using cached classification for:",
      text.substring(0, 50) + "..."
    );
    return textClassificationCache.get(text);
  }

  const message = {
    action: ACTION_CLASSIFY_TEXT,
    text: text,
  };
  const response = await chrome.runtime.sendMessage(message);

  // Cache the result
  if (response && Array.isArray(response)) {
    textClassificationCache.set(text, response);
    console.log("Cached classification for:", text.substring(0, 50) + "...");
  }

  return response;
};

const classifyImage = async (
  imageUrl,
  candidateLabels = ["safe", "unsafe", "inappropriate", "adult content"]
) => {
  const message = {
    action: ACTION_CLASSIFY_IMAGE,
    imageUrl: imageUrl,
    candidateLabels: candidateLabels,
  };
  const response = await chrome.runtime.sendMessage(message);

  if (response && Array.isArray(response)) {
    imageClassificationCache.set(imageUrl, response);
    console.log(
      "Cached classification for:",
      imageUrl.substring(0, 50) + "..."
    );
  }

  return response;
};

// Function to get visible text content from a node
/**
 * @param {Node} node
 * @returns {string}
 */
function getVisibleTextContent(node) {
  const textContent = node.innerText?.trim() || "";
  const sentences = textContent
    .split(/[.!?]+\n*|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0 && sentence.length > 10);

  if (sentences.length > 0) {
    console.log("sentences", sentences);
  }

  return sentences;
}

// Function to replace text in DOM nodes
function replaceTextInNode(node, originalText, replacementText) {
  // Escape special regex characters in originalText
  const escapedText = originalText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Create regex that matches whole words only
  const regex = new RegExp(`\\b${escapedText}\\b`, "g");

  const walker = document.createTreeWalker(
    node,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        // Skip script, style, and other non-content nodes
        const parent = node.parentNode;
        if (
          parent &&
          (parent.tagName === "SCRIPT" ||
            parent.tagName === "STYLE" ||
            parent.tagName === "TEXTAREA" ||
            parent.tagName === "INPUT")
        ) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
    false
  );

  const textNodes = [];
  let textNode;
  while ((textNode = walker.nextNode())) {
    // Only process visible text nodes
    if (
      textNode.nodeValue.trim() &&
      textNode.nodeValue.includes(originalText)
    ) {
      const style = window.getComputedStyle(textNode.parentElement);
      if (style.display !== "none" && style.visibility !== "hidden") {
        textNodes.push(textNode);
      }
    }
  }

  // Replace text in each node
  textNodes.forEach((textNode) => {
    const newText = textNode.nodeValue.replace(regex, replacementText);
    if (newText !== textNode.nodeValue) {
      textNode.nodeValue = newText;
    }
  });
}

// Function to extract and log all sentences from the page
async function filterToxicText(node = document.body, threadshold = 0.8) {
  // Get only visible text content
  const sentences = getVisibleTextContent(node);

  if (sentences?.length === 0) {
    return [];
  }

  // Classify each sentence and replace high-scoring ones
  // console.log("=== CLASSIFICATION RESULTS ===");
  const sentencesToReplace = [];

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    // console.log(
    //   `\nClassifying sentence ${i + 1}: "${sentence.substring(0, 100)}${
    //     sentence.length > 100 ? "..." : ""
    //   }"`
    // );

    const classification = await classifyText(sentence);
    // console.log(`Classification result:`, classification);

    if (classification && Array.isArray(classification)) {
      const hasHighScore = classification.some(
        (result) => result.score && result.score > threadshold
      );

      if (hasHighScore) {
        sentencesToReplace.push(sentence);
        replacedSentences.add(sentence);
        // Store the total replacement count for this page
        chrome.storage.local.set({
          filterTotalReplacements: replacedSentences.size,
        });
        // updateBadge(replacedSentences.size);
      }
    }
  }
  console.log("sentencesToReplace", sentencesToReplace);
  // console.log("=== END CLASSIFICATION RESULTS ===");

  // Replace high-scoring sentences in the DOM
  if (sentencesToReplace.length > 0) {
    console.log("=== REPLACING HIGH-SCORING SENTENCES ===");
    sentencesToReplace.forEach((sentence, index) => {
      console.log(
        `Replacing sentence ${index + 1}: "${sentence.substring(0, 50)}..."`
      );
      replaceTextInNode(node, sentence, "*".repeat(sentence.length));
    });
    console.log(`Total sentences replaced: ${sentencesToReplace.length}`);
    console.log("=== END REPLACEMENT ===");
  }

  return sentences;
}

async function blurNSFWImages(node, threadshold = 0.8) {
  const images = node.querySelectorAll("img");
  for (const image of images) {
    const src = image.src;

    // Skip tiny images that are likely icons/decorative
    if (image.width < 50 || image.height < 50) {
      continue;
    }

    // Skip images without valid src
    if (!src || src.includes("placeholder")) {
      continue;
    }

    // Check cache first
    let classification = null;
    if (imageClassificationCache.has(src)) {
      console.log(
        "Using cached classification for:",
        src.substring(0, 50) + "..."
      );
      classification = imageClassificationCache.get(src);
    } else {
      classification = await classifyImage(src);
    }

    if (classification && Array.isArray(classification)) {
      imageClassificationCache.set(src, classification);
      const hasHighScore = classification.find(
        ({ label, score }) =>
          (label === "adult content" ||
            label === "inappropriate" ||
            label === "unsafe") &&
          score >= threadshold
      );
      if (hasHighScore) {
        image.style.filter = "blur(10px)";
      }
    }
  }
}

async function init() {
  console.log("init");

  const storage = await chrome.storage.local.get([
    "filterConfig",
    "filterTotalReplacements",
  ]);
  console.log("storage", storage);

  const textFilterEnabled = storage.filterConfig?.textFilter?.isEnabled;
  const imageFilterEnabled = storage.filterConfig?.imageFilter?.isEnabled;
  const textFilterThreadshold =
    storage.filterConfig?.textFilter?.strictness / 100 || 0.8;
  const imageFilterThreadshold =
    storage.filterConfig?.imageFilter?.strictness / 100 || 0.8;

  if (textFilterEnabled) {
    filterToxicText(document.body, textFilterThreadshold);
  }

  const observer = new MutationObserver((mutations) => {
    for (let i = 0; i < mutations.length; i++) {
      const mutation = mutations[i];
      for (const node of mutation.addedNodes) {
        if (textFilterEnabled) {
          filterToxicText(node, textFilterThreadshold);
        }
        if (imageFilterEnabled) {
          blurNSFWImages(node, imageFilterThreadshold);
        }
        // blurImagesInNode(node);
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

init();
