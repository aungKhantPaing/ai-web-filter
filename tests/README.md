# Browser Extension Tests

This directory contains comprehensive unit and integration tests for the browser extension.

## Test Structure

```
tests/
├── README.md                 # This file
├── setup.js                  # Jest setup and global mocks
├── constants.test.js         # Tests for constants module
├── content.test.js           # Tests for content script functions
├── popup.test.js            # Tests for popup script functions
├── background.test.js        # Tests for background script functions
├── integration.test.js       # Integration tests
└── utils/
    └── test-helpers.js       # Test utility functions
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run specific test file
```bash
npm test -- tests/constants.test.js
```

### Run tests matching a pattern
```bash
npm test -- --testNamePattern="should classify text"
```

## Test Categories

### Unit Tests
- **constants.test.js**: Tests for action constants and their uniqueness
- **content.test.js**: Tests for content script functions including:
  - Text classification with caching
  - Image classification
  - DOM text extraction and filtering
  - Text replacement in DOM nodes
- **popup.test.js**: Tests for popup UI functions including:
  - Filter state management
  - UI updates
  - Storage operations
  - Strictness controls
- **background.test.js**: Tests for background script functions including:
  - ML pipeline management (singleton pattern)
  - Text and image classification
  - Context menu handling
  - Message handling

### Integration Tests
- **integration.test.js**: Tests that verify interactions between modules:
  - Complete text classification flow
  - Image classification flow
  - Filter state management
  - Content script and popup communication
  - Error handling scenarios
  - DOM manipulation integration

## Test Utilities

The `utils/test-helpers.js` file provides common utility functions:

- `createMockChromeAPI()`: Creates mock Chrome extension APIs
- `createMockDOM()`: Sets up DOM environment for testing
- `createMockClassification()`: Creates mock classification results
- `createMockTextClassification()`: Creates mock text classification responses
- `createMockImageClassification()`: Creates mock image classification responses
- `createMockFilterConfig()`: Creates mock filter configurations
- `wait()`: Utility for async testing
- `expectToThrow()`: Helper for testing error conditions

## Mocking Strategy

### Chrome Extension APIs
All Chrome extension APIs are mocked in `tests/setup.js`:
- `chrome.runtime` for message passing
- `chrome.storage` for data persistence
- `chrome.contextMenus` for context menu operations
- `chrome.scripting` for script injection
- `chrome.tabs` for tab management

### Transformers.js
The ML library is mocked to avoid loading actual models during testing:
- Pipeline creation is mocked
- Classification results are simulated
- Error conditions can be tested

### DOM APIs
- `document.createTreeWalker` is mocked for DOM traversal tests
- `window.getComputedStyle` is mocked for visibility checks
- `fetch` is mocked for image classification tests

## Test Coverage

The tests cover:

### Functionality
- ✅ Text classification with caching
- ✅ Image classification with custom labels
- ✅ DOM text extraction and filtering
- ✅ Filter state management
- ✅ UI updates and interactions
- ✅ Storage operations
- ✅ Error handling

### Edge Cases
- ✅ Invalid input validation
- ✅ Network errors
- ✅ Storage errors
- ✅ Empty content handling
- ✅ Cache behavior

### Integration Scenarios
- ✅ Content script ↔ Background script communication
- ✅ Popup ↔ Background script communication
- ✅ State persistence across sessions
- ✅ DOM manipulation and text replacement

## Writing New Tests

### Adding Unit Tests
1. Create a new test file in the `tests/` directory
2. Import the module you want to test
3. Use the existing test patterns and utilities
4. Mock external dependencies appropriately

### Adding Integration Tests
1. Add new test cases to `integration.test.js`
2. Test interactions between multiple modules
3. Use the test utilities for consistent mocking
4. Focus on end-to-end scenarios

### Test Naming Convention
- Use descriptive test names that explain the scenario
- Follow the pattern: "should [expected behavior] when [condition]"
- Group related tests using `describe` blocks

### Example Test Structure
```javascript
describe('Module Name', () => {
  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Function Name', () => {
    test('should do something when condition is met', async () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

## Debugging Tests

### Verbose Output
```bash
npm test -- --verbose
```

### Debug Specific Test
```bash
npm test -- --testNamePattern="specific test name" --verbose
```

### Run Tests with Node Inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

## Continuous Integration

The tests are designed to run in CI environments:
- No external dependencies (all APIs mocked)
- Fast execution (no real ML model loading)
- Deterministic results
- Comprehensive coverage reporting 