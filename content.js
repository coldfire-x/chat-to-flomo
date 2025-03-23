import { detectPlatform } from './src/utils/platform-registry.js';
import * as UIUtils from './src/utils/ui-utils.js';

/**
 * Initialize the platform-specific functionality
 */
function initializePlatform() {
  const url = window.location.href;
  const PlatformClass = detectPlatform(url);
  
  if (PlatformClass) {
    console.log(`Detected platform: ${PlatformClass.getPlatformName()}`);
    
    // Create an instance of the platform
    const platform = new PlatformClass();
    
    // Initialize the UI with a callback for when the sync button is clicked
    platform.initUI((chatTitle, chatContent, platformName, responseCallback) => {
      syncToFlomo(chatTitle, chatContent, platformName, responseCallback);
    });
  } else {
    console.log('No supported platform detected');
  }
}

/**
 * Handle the request to get chat content
 * @param {string} userProvidedTitle - Optional title provided by the user
 * @returns {Promise<Object>} - The chat content and metadata
 */
async function handleGetChatContent(userProvidedTitle) {
  try {
    const url = window.location.href;
    const PlatformClass = detectPlatform(url);
    
    if (!PlatformClass) {
      return { success: false, message: 'Unsupported platform' };
    }
    
    const platform = new PlatformClass();
    const chatTitle = platform.extractTitle(userProvidedTitle);
    const chatContent = platform.extractContent();
    
    return {
      success: true,
      platform: PlatformClass.getPlatformName(),
      chatTitle,
      chatContent
    };
  } catch (error) {
    console.error('Error extracting chat content:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Sync chat content to Flomo
 * @param {string} chatTitle - The title of the chat
 * @param {string} chatContent - The content of the chat
 * @param {string} platform - The platform name
 * @param {Function} callback - Callback function to handle the response
 */
function syncToFlomo(chatTitle, chatContent, platform, callback) {
  // Send message to background script to handle the sync
  chrome.runtime.sendMessage(
    { 
      action: 'syncToFlomo', 
      data: { 
        title: chatTitle, 
        content: chatContent, 
        platform 
      } 
    },
    (response) => {
      if (response && response.success) {
        callback(true);
      } else {
        callback(false, response?.error || 'Failed to sync to Flomo');
      }
    }
  );
}

// Handle messages from the popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getChatContent') {
    handleGetChatContent(request.chatTitle)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, message: error.message }));
    return true; // Indicates async response
  }
  return false;
});

// Initialize the platform-specific functionality
initializePlatform();
