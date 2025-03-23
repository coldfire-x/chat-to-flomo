import * as FlomoService from './src/utils/flomo-service.js';

// Create a context menu option for syncing
chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  
  // Initialize storage
  chrome.storage.local.get(['flomoWebhook', 'defaultTag', 'platformSettings'], (result) => {
    if (!result.flomoWebhook) {
      chrome.storage.local.set({ flomoWebhook: '' });
    }
    
    if (!result.defaultTag) {
      chrome.storage.local.set({ defaultTag: '#ai-chat' });
    }
    
    if (!result.platformSettings) {
      const defaultSettings = {
        openai: { enabled: true, tags: ['#openai', '#chatgpt'] },
        claude: { enabled: true, tags: ['#claude'] },
        kimi: { enabled: true, tags: ['#kimi'] },
        deepseek: { enabled: true, tags: ['#deepseek'] },
      };
      chrome.storage.local.set({ platformSettings: defaultSettings });
    }
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'syncToFlomo') {
    // Handle sync to Flomo
    console.log('Syncing to Flomo:', message.data);
    
    chrome.storage.local.get(['flomoWebhook', 'defaultTag'], (result) => {
      if (!result.flomoWebhook) {
        sendResponse({ success: false, error: 'Flomo webhook not configured' });
        return;
      }
      
      const { content, title, platform } = message.data;
      const defaultTag = result.defaultTag || '#ai-chat';
      
      // Format content with tags using the format #ai-chat/{platform}/{chat title}
      const formattedContent = FlomoService.formatFlomoContent(
        title, 
        content, 
        platform, 
        defaultTag
      );
      
      // Send to Flomo
      FlomoService.sendToFlomo(result.flomoWebhook, formattedContent)
        .then(data => {
          sendResponse({ success: true, data });
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
    });
    
    return true; // Keep the message channel open for async response
  }
}); 