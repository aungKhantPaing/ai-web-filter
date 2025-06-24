// content.js - the content scripts which is run in the context of web pages, and has access
// to the DOM and other web APIs.
//
// Example usage:
//
import { ACTION_CLASSIFY_TEXT } from "./constants.js";
const message = {
  action: ACTION_CLASSIFY_TEXT,
  text: "Hello, how are you?",
};
const response = await chrome.runtime.sendMessage(message);
console.log("received user data", response);

const classifyText = async (text) => {
  const message = {
    action: ACTION_CLASSIFY_TEXT,
    text: text,
  };
  const response = await chrome.runtime.sendMessage(message);
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

  console.log("sentences", sentences);

  return sentences;
}

// Function to replace text in DOM nodes
function replaceTextInNode(n, searchText, replacementText) {
  const walker = document.createTreeWalker(
    n,
    NodeFilter.SHOW_TEXT,
    null,
    false
  );

  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue.includes(searchText)) {
      textNodes.push(node);
    }
  }

  // Replace text in each node
  textNodes.forEach((textNode) => {
    textNode.nodeValue = textNode.nodeValue.replace(
      new RegExp(searchText, "g"),
      replacementText
    );
  });
  // if (node.nodeType === Node.TEXT_NODE) {
  //   if (node.textContent.includes(originalText)) {
  //     node.textContent = node.textContent.replace(
  //       originalText,
  //       replacementText
  //     );
  //   }
  // } else if (node.nodeType === Node.ELEMENT_NODE) {
  //   // Skip script and style tags
  //   if (node.tagName === "SCRIPT" || node.tagName === "STYLE") {
  //     return;
  //   }

  //   // Recursively process child nodes
  //   for (let child of node.childNodes) {
  //     replaceTextInNode(child, originalText, replacementText);
  //   }
  // }
}

// Function to extract and log all sentences from the page
async function extractAndLogSentences(node = document.body) {
  // Get only visible text content
  const sentences = getVisibleTextContent(node);

  if (!sentences) {
    console.log("No visible text content found in the specified node");
    return [];
  }

  // Classify each sentence and replace high-scoring ones
  console.log("=== CLASSIFICATION RESULTS ===");
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

    // Check if any classification score is above 0.8
    if (classification && Array.isArray(classification)) {
      const hasHighScore = classification.some(
        (result) => result.score && result.score > 0.8
      );

      if (hasHighScore) {
        console.log(
          `⚠️  High score detected for sentence ${
            i + 1
          }, will be replaced with "***"`
        );
        sentencesToReplace.push(sentence);
      }
    }
  }
  console.log("=== END CLASSIFICATION RESULTS ===");

  // Replace high-scoring sentences in the DOM
  console.log("=== REPLACING HIGH-SCORING SENTENCES ===");
  sentencesToReplace.forEach((sentence, index) => {
    console.log(
      `Replacing sentence ${index + 1}: "${sentence.substring(0, 50)}..."`
    );
    replaceTextInNode(document.body, sentence, "*".repeat(sentence.length));
  });
  console.log(`Total sentences replaced: ${sentencesToReplace.length}`);
  console.log("=== END REPLACEMENT ===");

  return sentences;
}

extractAndLogSentences();

// Observe DOM changes for dynamically added elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    for (const node of mutation.addedNodes) {
      extractAndLogSentences(node);
      // blurImagesInNode(node);
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });
