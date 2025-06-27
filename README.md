# AI Web Filter Browser Extension

A powerful browser extension that uses AI to automatically filter and classify web content for safety and appropriateness. Built with Transformers.js, AI Web Filter provides real-time text and image classification to help create a safer browsing experience.

## Features

This extension provides two main functionalities:

### 1. Text Classification & Filtering
- Automatically scans web pages for text content
- Classifies sentences using a toxic content detection model (Xenova/toxic-bert)
- Replaces high-scoring sentences with "***" to mask potentially inappropriate content
- Configurable strictness levels (0-100%)
- Updates the extension badge with the count of replaced sentences
- Context menu integration for manual text classification

### 2. Image Classification & Filtering
- Automatically extracts all images from web pages
- Classifies images using a zero-shot image classification model (Xenova/clip-vit-base-patch32)
- Configurable strictness levels for image filtering
- Logs detailed classification results to the browser console
- Supports dynamic content - new images added to the page are automatically classified
- Uses candidate labels: "safe", "unsafe", "inappropriate", "adult content"

### Advanced Features
- **WebGPU Acceleration**: Hardware-accelerated inference for faster performance
- **Configurable Filters**: Toggle text and image filtering independently
- **Strictness Controls**: Adjustable sensitivity levels for both text and image classification
- **Real-time Statistics**: Track blocked content counts
- **Context Menu Integration**: Right-click to classify selected text
- **Memory Management**: Efficient pipeline management with singleton patterns

## Getting Started

1. Clone the repository and enter the project directory:
   ```bash
   git clone https://github.com/aungKhantPaing/ai-web-filter.git
   cd ai-web-filter
   ```

2. Install the necessary dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Add the extension to your browser:
   - Go to `chrome://extensions/`
   - Enable developer mode (top right)
   - Click "Load unpacked"
   - Select the `build` directory and click "Select Folder"

5. The extension is now ready to use! Click the extension icon to access the control panel.

## Usage

### Extension Popup Interface
- **Text Filter Toggle**: Enable/disable text content filtering
- **Image Filter Toggle**: Enable/disable image content filtering
- **Strictness Sliders**: Adjust sensitivity levels (0-100%) for both filters
- **Statistics**: View the number of blocked content items
- **Test Input**: Manually test text classification

### Automatic Filtering
- **Text Filtering**: Automatically runs on every page you visit
- **Image Filtering**: Automatically classifies all images on web pages
- **Dynamic Content**: New content added to pages is automatically processed
- **Console Logging**: Detailed logs available in browser console (F12)

### Manual Classification
- **Context Menu**: Right-click selected text to classify it manually
- **Test Interface**: Use the popup's text input to test classification

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

## Technical Details

### Models Used
- **Text Classification**: `Xenova/toxic-bert` - Specialized in detecting toxic content
Model speed: 1,000 sentences per second
Model accuracy:

| Challenge | Current Model Score | Other Models Score |
|-----------|-------------------|-------------------|
| Toxic Comment Classification Challenge | 0.98856 | 0.98636 |
| Jigsaw Unintended Bias in Toxicity Classification | 0.94734 | 0.93639 |
| Jigsaw Multilingual Toxic Comment Classification | 0.9536 | 0.91655 |

- **Image Classification**: `Xenova/clip-vit-base-patch32` - Zero-shot image classification
Model accuracy: Loss: 0.016, Accuracy: 0.984
- **NSFW Image Classification**: `AdamCodd/vit-base-nsfw-detector` - Image classification
Model accuracy: Loss: 0.0937, Accuracy: 0.9654


### Performance Optimization
- **WebGPU Backend**: Hardware acceleration for faster inference
- **Singleton Pipelines**: Efficient memory management
- **Progress Tracking**: Real-time loading progress updates
- **Error Handling**: Robust error recovery and user feedback

### Architecture
- **Background Script**: Handles ML inference and message processing
- **Content Script**: Injects into web pages for content extraction
- **Popup Interface**: User controls and statistics display
- **Context Menus**: Manual classification integration

## Development

### Running in Development Mode
```bash
npm run dev
```
This will watch for changes and rebuild automatically.

### Project Structure
```
src/
├── background.js      # Service worker - ML processing and message handling
├── content.js         # Content script - page injection and content extraction
├── popup.html         # Extension popup interface
├── popup.css          # Popup styling
├── popup.js           # Popup functionality
└── constants.js       # Shared constants and configuration
```

### Key Files
- `background.js` - Handles all ML inference, message processing, and context menu integration
- `content.js` - Injected into web pages to extract and process content
- `popup.html/js/css` - User interface for controlling the extension
- `constants.js` - Shared constants and action definitions

## Contributing

This project is open source. Feel free to submit issues and pull requests to improve the extension.

## License

Apache-2.0 License

## Links

- [GitHub Repository](https://github.com/aungKhantPaing/ai-web-filter)
- [Transformers.js Documentation](https://huggingface.co/docs/transformers.js)
- [Chrome Extension Development Guide](https://developer.chrome.com/docs/extensions/)
