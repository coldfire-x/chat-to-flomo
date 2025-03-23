# AI Chat to Flomo Sync

A Chrome extension that allows you to sync chat history from AI platforms (OpenAI, Claude, Kimi, DeepSeek) to Flomo notes.

## Features

- Support for multiple AI chat platforms:
  - OpenAI ChatGPT
  - Anthropic Claude
  - Moonshot Kimi
  - DeepSeek Chat
- Configurable Flomo API key
- Automatically captures text and images from chat history
- Organizes notes with customizable tags in the format: `#tag-prefix/platform/chat-title`
- Elegant floating button in ChatGPT and Claude interfaces with smooth animations and visual feedback

## Installation

1. Clone this repository or download the files
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" and select the directory containing these files
5. The extension should now appear in your extensions list

## Usage

1. Click on the extension icon to open the popup
2. Set your Flomo API key (you can get this from your Flomo account settings)
3. Customize the default tag prefix if desired
4. Visit any supported AI chat platform
5. When you want to save a conversation, you can either:
   - Click on the extension icon and click "Sync Current Chat"
   - In ChatGPT or Claude, hover over the floating button at the bottom right and click to sync instantly
6. Optionally provide a custom title for the chat (when using the extension popup)
7. The chat will be saved to your Flomo account with proper tagging

## Getting Your Flomo API Key

1. Log in to your Flomo account
2. Go to Settings > API
3. Copy your API key (it should look like: `https://flomoapp.com/iwh/xxxxxx/xxxxxxxx`)

## Project Structure

This project is designed with extensibility in mind, using a modular architecture:

```
src/
  ├── content.js        # Main content script
  ├── background.js     # Service worker script
  ├── platforms/        # Platform-specific implementations
  │   ├── openai/       # OpenAI ChatGPT support
  │   ├── claude/       # Anthropic Claude support
  │   ├── kimi/         # Kimi support (placeholder)
  │   └── deepseek/     # DeepSeek support (placeholder)
  └── utils/            # Shared utilities
      ├── platform-interface.js   # Interface all platforms must implement
      ├── platform-registry.js    # Registry for platform discovery
      ├── flomo-service.js        # Handles Flomo API interactions
      └── ui-utils.js             # UI elements and animations
```

## Contributing

### Adding Support for a New Platform

1. Create a new folder in `src/platforms/[platform-name]/`
2. Create an `index.js` file that implements the `PlatformInterface` class
3. Register your platform in `src/utils/platform-registry.js`

See existing platforms for examples.

## Notes

- The extension requires access to read content from supported AI chat platforms
- All data is processed locally and only sent to your Flomo account
- The Flomo API key is stored in your browser's local storage and is not sent to any third parties 