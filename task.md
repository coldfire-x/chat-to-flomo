# AI Chat to Flomo Sync - Development Tasks

## Project Overview
Create a Google Chrome extension that allows users to sync chat history from various AI platforms (OpenAI, Claude, Kimi, DeepSeek) to Flomo using the Flomo API.

## Requirements
1. Allow users to select which chats to sync
2. Capture all content in chat history (text, images, etc.)
3. Add default tags for organization: `#vendor(openai, kimi, ...)/chat-title`
4. Allow users to configure their Flomo API key

## Development Tasks

### Core Extension Structure
- [x] Create manifest.json
- [x] Setup extension popup (HTML/CSS/JS)
- [x] Create background script
- [x] Create content scripts

### Platform-Specific Content Extractors
- [x] OpenAI ChatGPT extractor
- [x] Claude extractor
- [x] Kimi extractor
- [x] DeepSeek extractor

### Flomo Integration
- [x] Implement Flomo API integration
- [x] Add tagging functionality

### Extension Settings
- [x] Store and retrieve Flomo API key
- [x] Configure default tag prefix

### UI/UX
- [x] Create popup interface
- [x] Create status messages
- [x] Add floating button with animations to ChatGPT
- [ ] Create proper extension icons (currently placeholders)

### Testing and Refinement
- [ ] Test each platform extractor with real conversations
- [ ] Test API integration with Flomo
- [ ] Fix any selector issues for specific platforms
- [ ] Improve error handling

### Documentation
- [x] Create README.md
- [x] Document how to obtain and use Flomo API

## Future Enhancements
- [ ] Add support for more AI chat platforms
- [ ] Add floating button to other platforms
- [ ] Add option to sync all chats in history
- [ ] Add option to sync chat automatically when ended
- [ ] Add better image handling (some platforms may limit access to images)
- [ ] Add option to export to other note-taking platforms
- [ ] Add translation functionality before saving to Flomo

## Resources
- Flomo API documentation: https://help.flomoapp.com/advance/api.html
- Flomo tagging documentation: https://help.flomoapp.com/basic/tag.html 