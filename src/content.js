// content.js - the content scripts which is run in the context of web pages, and has access
// to the DOM and other web APIs.
//
// Example usage:
//
import { ACTION_NAME } from "./constants.js";
const message = {
    action: ACTION_NAME,
    text: 'Hello, how are you?',
}
const response = await chrome.runtime.sendMessage(message);
console.log('received user data', response)

const classifyText = async (text) => {
  const message = {
    action: ACTION_NAME,
    text: text,
  }
  const response = await chrome.runtime.sendMessage(message);
  return response;
}

// Function to check if an element is visible to the user
function isElementVisible(element) {
  if (!element || element.nodeType !== Node.ELEMENT_NODE) {
    return false;
  }

  const style = window.getComputedStyle(element);
  
  // Check if element is hidden by CSS
  if (style.display === 'none' || 
      style.visibility === 'hidden' || 
      style.opacity === '0' ||
      style.position === 'absolute' && (style.left === '-9999px' || style.top === '-9999px')) {
    return false;
  }

  // Check if element has zero dimensions
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) {
    return false;
  }

  // Check if element is outside the viewport
  if (rect.bottom < 0 || rect.top > window.innerHeight || 
      rect.right < 0 || rect.left > window.innerWidth) {
    return false;
  }

  return true;
}

// Function to get visible text content from a node
function getVisibleTextContent(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent.trim();
  }
  
  if (node.nodeType === Node.ELEMENT_NODE) {
    // Skip hidden elements
    if (!isElementVisible(node)) {
      return '';
    }
    
    // Skip script, style, and other non-content elements
    if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'META', 'LINK',].includes(node.tagName)) {
      return '';
    }
    
    // For elements with visible text, collect text from all child nodes
    let text = '';
    for (const child of node.childNodes) {
      text += getVisibleTextContent(child) + ' ';
    }
    return text.trim();
  }
  
  return '';
}

// Function to replace text in DOM nodes
function replaceTextInNode(node, originalText, replacementText) {
  if (node.nodeType === Node.TEXT_NODE) {
    if (node.textContent.includes(originalText)) {
      node.textContent = node.textContent.replace(originalText, replacementText);
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    // Skip script and style tags
    if (node.tagName === 'SCRIPT' || node.tagName === 'STYLE') {
      return;
    }
    
    // Recursively process child nodes
    for (let child of node.childNodes) {
      replaceTextInNode(child, originalText, replacementText);
    }
  }
}

// Function to extract and log all sentences from the page
async function extractAndLogSentences(node = document.body) {
  // Get only visible text content
  const textContent = getVisibleTextContent(node);
  
  if (!textContent) {
    console.log("No visible text content found in the specified node");
    return [];
  }
  
  const sentences = textContent
    .split(/[.!?]+\n*|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0 && sentence.length > 10); // Filter out very short fragments

  console.log("=== ALL VISIBLE SENTENCES FROM CURRENT PAGE ===");
  sentences.forEach((sentence, index) => {
    console.log(`${index + 1}. ${sentence}`);
  });
  console.log(`Total visible sentences found: ${sentences.length}`);
  console.log("=== END SENTENCES ===");

  // Classify each sentence and replace high-scoring ones
  console.log("=== CLASSIFICATION RESULTS ===");
  const sentencesToReplace = [];
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    console.log(
      `\nClassifying sentence ${i + 1}: "${sentence.substring(0, 100)}${
        sentence.length > 100 ? "..." : ""
      }"`
    );

    const classification = await classifyText(sentence);
    console.log(`Classification result:`, classification);
    
    // Check if any classification score is above 0.8
    if (classification && Array.isArray(classification)) {
      const hasHighScore = classification.some(result => 
        result.score && result.score > 0.8
      );
      
      if (hasHighScore) {
        console.log(`⚠️  High score detected for sentence ${i + 1}, will be replaced with "***"`);
        sentencesToReplace.push(sentence);
      }
    }
  }
  console.log("=== END CLASSIFICATION RESULTS ===");

  // Replace high-scoring sentences in the DOM
  console.log("=== REPLACING HIGH-SCORING SENTENCES ===");
  sentencesToReplace.forEach((sentence, index) => {
    console.log(`Replacing sentence ${index + 1}: "${sentence.substring(0, 50)}..."`);
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

