// content.js - the content scripts which is run in the context of web pages, and has access
// to the DOM and other web APIs.
//
// Example usage:
//

// Configuration for image filtering
const IMAGE_FILTER_CONFIG = {
  // Minimum dimensions for relevant images
  minWidth: 50,
  minHeight: 50,

  // Maximum dimensions for relevant images
  maxWidth: 2000,
  maxHeight: 2000,

  // Aspect ratio limits (width/height)
  maxAspectRatio: 5,
  minAspectRatio: 0.2,

  // File extensions to filter out
  excludedExtensions: ["ico", "svg"],

  // URL patterns to filter out
  excludedPatterns: [
    // "logo",
    // "icon",
    // "button",
    // "banner",
    // "ad",
    // "spacer",
    // "pixel",
    // "analytics",
    // "tracking",
    // "placeholder",
    // "loading",
    // "avatar",
    // "thumb",
    // "emoji",
    // "favicon",
  ],

  // Generic alt text patterns to filter out
  genericAltTexts: [
    "",
    "image",
    "img",
    "photo",
    "picture",
    "icon",
    "logo",
    "button",
    "click here",
    "learn more",
    "read more",
    "download",
    "play",
    "pause",
  ],

  // Whether to filter out data URLs
  filterDataUrls: true,
};

// Utility function to update image filtering configuration
function updateImageFilterConfig(newConfig) {
  Object.assign(IMAGE_FILTER_CONFIG, newConfig);
  console.log("🔄 Updated image filter configuration:", IMAGE_FILTER_CONFIG);
}

// Example usage for customizing filters:
// updateImageFilterConfig({
//   minWidth: 100,  // Only process images wider than 100px
//   minHeight: 100, // Only process images taller than 100px
//   excludedPatterns: [...IMAGE_FILTER_CONFIG.excludedPatterns, 'social', 'share'], // Add more patterns
//   genericAltTexts: [...IMAGE_FILTER_CONFIG.genericAltTexts, 'social media', 'share button'] // Add more generic texts
// });

// Test function to verify filtering logic
function testImageFiltering() {
  console.log("🧪 Testing image filtering logic...");

  const testImages = [
    { src: "logo.png", width: 30, height: 30, alt: "Company Logo", title: "" },
    {
      src: "cat.jpg",
      width: 800,
      height: 600,
      alt: "A cute cat",
      title: "Cat photo",
    },
    {
      src: "banner.svg",
      width: 1200,
      height: 100,
      alt: "Advertisement banner",
      title: "",
    },
    {
      src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
      width: 1,
      height: 1,
      alt: "",
      title: "",
    },
    { src: "photo.jpg", width: 500, height: 300, alt: "image", title: "" },
    {
      src: "content.jpg",
      width: 800,
      height: 600,
      alt: "Beautiful landscape",
      title: "Nature photo",
    },
  ];

  testImages.forEach((img, index) => {
    const result = isImageIrrelevant(img);
    console.log(
      `Test ${index + 1}: ${
        result.isIrrelevant ? "❌ Filtered" : "✅ Relevant"
      } - ${result.reason || "Passed all filters"}`
    );
    console.log(
      `   Source: ${img.src}, Size: ${img.width}x${img.height}, Alt: "${img.alt}"`
    );
  });
}

// Uncomment to run test:
// testImageFiltering();

import {
  ACTION_CLASSIFY_TEXT,
  ACTION_UPDATE_BADGE,
  ACTION_CLASSIFY_IMAGE,
} from "./constants.js";

const response = await chrome.runtime.sendMessage({
  action: ACTION_CLASSIFY_TEXT,
  text: "Hello, how are you?",
});
console.log("received text data", response);
const responseImage = await chrome.runtime.sendMessage({
  action: ACTION_CLASSIFY_IMAGE,
  imageUrl:
    "https://encrypted-tbn2.gstatic.com/images?q=tbn:ANd9GcR1C0XX0G2NSOp5mmXPK6gwcRaZdCdmm3AQopYkwtzWCqfsv_VN06S8YeJZKyT7CnEmqo286gVeCHSUI2T3h7Z3zA",
  candidateLabels: ["cat", "not cat"],
});
console.log("received image data", responseImage);

const classifyText = async (text) => {
  const message = {
    action: ACTION_CLASSIFY_TEXT,
    text: text,
  };
  const response = await chrome.runtime.sendMessage(message);
  return response;
};

const classifyImage = async (
  imageUrl,
  // candidateLabels = ["safe", "unsafe", "inappropriate", "adult content", "cat"]
  candidateLabels = ["cat", "not cat"]
) => {
  const message = {
    action: ACTION_CLASSIFY_IMAGE,
    imageUrl: imageUrl,
    candidateLabels: candidateLabels,
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
  // Skip nodes that already contain mark elements created by this extension
  if (
    node.querySelector &&
    node.querySelector('mark[data-proso-marked="true"]')
  ) {
    return [];
  }

  const textContent = node.innerText?.trim() || "";
  const sentences = textContent
    .split(/[.!?]+\n*|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length > 0 && sentence.length > 10);

  console.log("sentences", sentences);

  return sentences;
}

// Function to wrap text in mark elements in DOM nodes
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

  // Replace text in each node by wrapping in mark elements
  textNodes.forEach((textNode) => {
    const parent = textNode.parentNode;
    const text = textNode.nodeValue;
    const regex = new RegExp(searchText, "g");

    // Split the text by the search pattern
    const parts = text.split(regex);
    const matches = text.match(regex) || [];

    // Clear the text node
    textNode.nodeValue = parts[0];

    // Insert mark elements for each match
    for (let i = 0; i < matches.length; i++) {
      const markElement = document.createElement("mark");
      markElement.textContent = matches[i];
      markElement.setAttribute("data-proso-marked", "true");
      parent.insertBefore(markElement, textNode.nextSibling);

      // Insert the next text part
      if (parts[i + 1]) {
        const nextTextNode = document.createTextNode(parts[i + 1]);
        parent.insertBefore(nextTextNode, markElement.nextSibling);
        textNode = nextTextNode;
      }
    }
  });
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
        (result) => result.score && result.score > 0.5
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
    replaceTextInNode(document.body, sentence, sentence);
  });
  console.log(`Total sentences replaced: ${sentencesToReplace.length}`);
  console.log("=== END REPLACEMENT ===");

  // Update badge with replacement count
  if (sentencesToReplace.length > 0) {
    try {
      await chrome.runtime.sendMessage({
        action: ACTION_UPDATE_BADGE,
        count: sentencesToReplace.length,
      });
    } catch (error) {
      console.error("Failed to update badge:", error);
    }
  }

  return sentences;
}

// Function to check if an image is likely irrelevant
function isImageIrrelevant(image) {
  const { src, width, height, alt, title } = image;

  // Filter out very small images (likely icons, buttons, etc.)
  if (
    width < IMAGE_FILTER_CONFIG.minWidth ||
    height < IMAGE_FILTER_CONFIG.minHeight
  ) {
    return { isIrrelevant: true, reason: `Too small (${width}x${height})` };
  }

  // Filter out very large images (likely backgrounds or banners)
  if (
    width > IMAGE_FILTER_CONFIG.maxWidth ||
    height > IMAGE_FILTER_CONFIG.maxHeight
  ) {
    return { isIrrelevant: true, reason: `Too large (${width}x${height})` };
  }

  // Filter out images with excluded file extensions
  const fileExtension = src.split(".").pop()?.toLowerCase();
  if (IMAGE_FILTER_CONFIG.excludedExtensions.includes(fileExtension)) {
    return {
      isIrrelevant: true,
      reason: `Excluded file extension: ${fileExtension}`,
    };
  }

  // Filter out images with common irrelevant URL patterns
  // for (const pattern of IMAGE_FILTER_CONFIG.excludedPatterns) {
  //   const regex = new RegExp(pattern, "i");
  //   if (regex.test(src) || regex.test(alt) || regex.test(title)) {
  //     return { isIrrelevant: true, reason: `Matches pattern: ${pattern}` };
  //   }
  // }

  // Filter out images with empty or generic alt text
  // const altLower = alt.toLowerCase();
  // if (
  //   IMAGE_FILTER_CONFIG.genericAltTexts.some((generic) =>
  //     altLower.includes(generic)
  //   )
  // ) {
  //   return { isIrrelevant: true, reason: `Generic alt text: "${alt}"` };
  // }

  // Filter out data URLs (usually small icons or placeholders)
  // if (IMAGE_FILTER_CONFIG.filterDataUrls && src.startsWith("data:")) {
  //   return { isIrrelevant: true, reason: "Data URL (likely small icon)" };
  // }

  // Filter out images with aspect ratios that suggest they're not content images
  const aspectRatio = width / height;
  if (
    aspectRatio > IMAGE_FILTER_CONFIG.maxAspectRatio ||
    aspectRatio < IMAGE_FILTER_CONFIG.minAspectRatio
  ) {
    return {
      isIrrelevant: true,
      reason: `Extreme aspect ratio: ${aspectRatio.toFixed(2)}`,
    };
  }

  return { isIrrelevant: false, reason: null };
}

// Function to extract all images from the page
function extractImages() {
  const images = document.querySelectorAll("img");
  const imageData = [];

  images.forEach((img, index) => {
    // Get image source URL
    const src = img.src || img.dataset.src || img.getAttribute("data-src");

    if (src && src.trim() !== "") {
      // Get image dimensions
      const width = img.naturalWidth || img.width || 0;
      const height = img.naturalHeight || img.height || 0;

      // Get alt text
      const alt = img.alt || "";

      // Get image title
      const title = img.title || "";

      const imageInfo = {
        index: index,
        src: src,
        width: width,
        height: height,
        alt: alt,
        title: title,
        element: img,
      };

      // Check if image is irrelevant
      const relevanceCheck = isImageIrrelevant(imageInfo);
      if (!relevanceCheck.isIrrelevant) {
        imageData.push(imageInfo);
      } else {
        console.log(
          `🚫 Filtered out irrelevant image ${index + 1}: ${
            relevanceCheck.reason
          }`
        );
        console.log(`   Source: ${src}`);
        console.log(`   Alt: "${alt}"`);
        console.log(`   Dimensions: ${width}x${height}`);
      }
    }
  });

  return imageData;
}

// Function to classify all images on the page
async function classifyAllImages() {
  console.log("=== EXTRACTING AND CLASSIFYING IMAGES ===");

  const allImages = document.querySelectorAll("img");
  console.log(`Found ${allImages.length} total images on the page`);

  const images = extractImages();
  const filteredCount = allImages.length - images.length;

  console.log(`📊 Image filtering results:`);
  console.log(`   Total images found: ${allImages.length}`);
  console.log(`   Irrelevant images filtered: ${filteredCount}`);
  console.log(`   Relevant images to classify: ${images.length}`);

  if (images.length === 0) {
    console.log("No relevant images found on the page after filtering");
    return [];
  }

  const classificationResults = [];

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    console.log(`\n🔍 Classifying relevant image ${i + 1}/${images.length}:`);
    console.log(`  📍 Source: ${image.src}`);
    console.log(`  📏 Dimensions: ${image.width}x${image.height}`);
    console.log(`  🏷️  Alt text: "${image.alt}"`);
    console.log(`  📝 Title: "${image.title}"`);

    try {
      console.log(`  ⏳ Sending to background script for classification...`);
      const result = await classifyImage(image.src);
      console.log(`  ✅ Classification result:`, result);

      // Log the top classification result
      if (result && Array.isArray(result) && result.length > 0) {
        const catLabel = result.find((r) => r.label === "cat");
        const notCatLabel = result.find((r) => r.label === "not cat");
        // const topResult = result[0];
        // console.log(
        //   `  🏆 Top classification: "${topResult.label}" (score: ${(
        //     topResult.score * 100
        //   ).toFixed(2)}%)`
        // );

        // Apply red color filter for images with classification score above 0.9
        if (catLabel.score > notCatLabel.score) {
          console.log(
            `  🔴 Applying red filter to image with score ${(
              catLabel.score * 100
            ).toFixed(2)}%`
          );
          image.element.style.filter =
            "hue-rotate(0deg) saturate(2) brightness(1.2) sepia(0.3)";
          image.element.style.border = "3px solid red";
          image.element.style.borderRadius = "5px";
          image.element.setAttribute("data-proso-filtered", "true");
        }
      }

      classificationResults.push({
        image: image,
        classification: result,
      });

      // Add a small delay to avoid overwhelming the background script
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ❌ Error classifying image ${i + 1}:`, error);
      classificationResults.push({
        image: image,
        classification: null,
        error: error.message,
      });
    }
  }

  console.log("\n=== 📊 IMAGE CLASSIFICATION SUMMARY ===");
  console.log(`Total images found: ${allImages.length}`);
  console.log(`Irrelevant images filtered: ${filteredCount}`);
  console.log(`Relevant images processed: ${classificationResults.length}`);
  console.log(
    `Successful classifications: ${
      classificationResults.filter((r) => r.classification).length
    }`
  );
  console.log(
    `Failed classifications: ${
      classificationResults.filter((r) => r.error).length
    }`
  );

  // Log summary of results
  classificationResults.forEach((result, index) => {
    if (
      result.classification &&
      Array.isArray(result.classification) &&
      result.classification.length > 0
    ) {
      const topResult = result.classification[0];
      console.log(
        `  Image ${index + 1}: "${topResult.label}" (${(
          topResult.score * 100
        ).toFixed(2)}%)`,
        result.image
      );
    } else if (result.error) {
      console.log(`  Image ${index + 1}: ❌ Error - ${result.error}`);
    }
  });

  console.log("=== END IMAGE CLASSIFICATION ===\n");

  return classificationResults;
}

// extractAndLogSentences();
classifyAllImages();

// Observe DOM changes for dynamically added elements
const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    console.log("Mutation detected", mutation);
    console.log("Added nodes");
    for (const node of mutation.addedNodes) {
      // Skip nodes that already contain mark elements created by this extension
      if (
        node.tagName === "MARK" &&
        node.getAttribute("data-proso-marked") === "true"
        // node.nodeType === Node.ELEMENT_NODE &&
        // node.querySelector &&
        // node.querySelector("mark")
      ) {
        continue;
      }
      // extractAndLogSentences(node);
      // classifyAllImages();

      // Check if the added node contains images and classify them
      // if (node.nodeType === Node.ELEMENT_NODE) {
      //   const images = node.querySelectorAll
      //     ? node.querySelectorAll("img")
      //     : [];
      //   if (images.length > 0) {
      //     console.log(
      //       `Found ${images.length} new images in added node, classifying...`
      //     );
      //     classifyAllImages();
      //   }
      // }
    }
  }
});
observer.observe(document.body, { childList: true, subtree: true });
