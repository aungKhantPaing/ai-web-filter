# Transformers.js - Sample browser extension

An example project to show how to run 🤗 Transformers in a browser extension. Although we only provide instructions for running in Chrome, it should be similar for other browsers.

## Features

This extension provides two main functionalities:

### 1. Text Classification
- Automatically scans web pages for text content
- Classifies sentences using a toxic content detection model
- Replaces high-scoring sentences with "***" to mask potentially inappropriate content
- Updates the extension badge with the count of replaced sentences

### 2. Image Classification
- Automatically extracts all images from web pages
- Classifies images using a zero-shot image classification model (CLIP)
- Logs detailed classification results to the browser console
- Supports dynamic content - new images added to the page are automatically classified
- Uses candidate labels: "safe", "unsafe", "inappropriate", "adult content"

### Backend and retry logic
- **Primary**: WebGPU (hardware acceleration) for faster performance
- **Retry Logic**: Up to 3 attempts per backend with exponential backoff

#### Testing Backend Availability
You can test which backends are available by running this in the browser console:
```javascript
// Test backend availability
chrome.runtime.sendMessage({action: "check-backend-availability"})
  .then(response => console.log(response));

// Test image classification
chrome.runtime.sendMessage({
  action: "classify-image",
  imageUrl: "https://example.com/image.jpg",
  candidateLabels: ["safe", "unsafe"]
}).then(response => console.log(response));
```

#### Manual Testing
Use the provided test script (`test-backend.js`) to verify functionality:
1. Open browser console on any page
2. Copy and paste the contents of `test-backend.js`
3. Run `runTests()` to test both backend availability and image classification

### Performance Notes
- **WebGPU**: Faster inference, requires compatible hardware/browser
- **CPU**: Slower but more reliable, works on all devices
- The extension automatically chooses the best available backend

## Getting Started

1. Clone the repo and enter the project directory:
   ```bash
   git clone https://github.com/huggingface/transformers.js-examples.git
   cd transformers.js-examples/browser-extension/
   ```
1. Install the necessary dependencies:

   ```bash
   npm install
   ```

1. Build the project:

   ```bash
   npm run build
   ```

1. Add the extension to your browser. To do this, go to `chrome://extensions/`, enable developer mode (top right), and click "Load unpacked". Select the `build` directory from the dialog which appears and click "Select Folder".

1. That's it! You should now be able to open the extension's popup and use the model in your browser!

## Usage

### Text Classification
- The extension automatically runs on every page you visit
- Open the browser console (F12) to see detailed logs of the classification process
- The extension badge will show the number of sentences that were replaced
- Click the extension icon to reset the replacement count

### Image Classification
- Images are automatically extracted and classified when you visit a page
- Open the browser console (F12) to see detailed classification results
- Each image classification includes:
  - Image source URL
  - Dimensions
  - Alt text and title
  - Classification scores for each candidate label
- New images added dynamically to the page are also automatically classified

## Console Output

The extension provides detailed logging in the browser console:

```
=== EXTRACTING AND CLASSIFYING IMAGES ===
Found 5 images on the page

🔍 Classifying image 1/5:
  📍 Source: https://example.com/image1.jpg
  📏 Dimensions: 800x600
  🏷️  Alt text: "Example image"
  📝 Title: "Example"
  ⏳ Sending to background script for classification...
  ✅ Classification result: [{"label": "safe", "score": 0.85}]
  🏆 Top classification: "safe" (score: 85.00%)

=== 📊 IMAGE CLASSIFICATION SUMMARY ===
Total images processed: 5
Successful classifications: 5
Failed classifications: 0
  Image 1: "safe" (85.00%)
  Image 2: "safe" (92.30%)
  Image 3: "unsafe" (67.50%)
  Image 4: "safe" (78.90%)
  Image 5: "safe" (88.20%)
=== END IMAGE CLASSIFICATION ===
```

## Editing the template

We recommend running `npm run dev` while editing the template as it will rebuild the project when changes are made.

All source code can be found in the `./src/` directory:

- `background.js` ([service worker](https://developer.chrome.com/docs/extensions/mv3/service_workers/)) - handles all the requests from the UI, does processing in the background, then returns the result. You will need to reload the extension (by visiting `chrome://extensions/` and clicking the refresh button) after editing this file for changes to be visible in the extension.

- `content.js` ([content script](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)) - contains the code which is injected into every page the user visits. You can use the `sendMessage` api to make requests to the background script. Similarly, you will need to reload the extension after editing this file for changes to be visible in the extension.

- `popup.html`, `popup.css`, `popup.js` ([toolbar action](https://developer.chrome.com/docs/extensions/reference/action/)) - contains the code for the popup which is visible to the user when they click the extension's icon from the extensions bar. For development, we recommend opening the `popup.html` file in its own tab by visiting `chrome-extension://<ext_id>/popup.html` (remember to replace `<ext_id>` with the extension's ID). You will need to refresh the page while you develop to see the changes you make.
