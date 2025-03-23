// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'syncToFlomo') {
    syncToFlomo(request, sendResponse);
    return true; // Indicates async response
  }
});

// Function to sync chat content to Flomo
async function syncToFlomo(request, sendResponse) {
  try {
    // Get the API key from storage
    const result = await chrome.storage.sync.get(['flomoApi', 'defaultTag']);
    const flomoApi = result.flomoApi;
    const defaultTagPrefix = result.defaultTag || '#ai-chat';
    
    if (!flomoApi) {
      sendResponse({ success: false, message: 'Flomo API key not found. Please set it in the extension settings.' });
      return;
    }
    
    const { chatContent, chatTitle, platform } = request;
    
    // Create tag based on platform and chat title
    let tag = `${defaultTagPrefix}/${platform}`;
    if (chatTitle) {
      tag += `/${chatTitle.replace(/\s+/g, '-')}`;
    }
    
    // Prepare content for Flomo
    let content = '';
    
    // Add title
    if (chatTitle) {
      content += `# ${chatTitle}\n\n`;
    }
    
    // Add tag
    content += `${tag}\n\n`;
    
    // Add chat content
    content += chatContent;
    
    // Send to Flomo API
    const response = await fetch(flomoApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: content
      })
    });
    
    const responseData = await response.json();
    
    if (responseData.code === 0) {
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, message: responseData.message || 'Unknown error from Flomo API' });
    }
  } catch (error) {
    console.error('Error syncing to Flomo:', error);
    sendResponse({ success: false, message: error.message });
  }
} 