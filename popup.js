document.addEventListener('DOMContentLoaded', function() {
  const flomoApiInput = document.getElementById('flomoApi');
  const defaultTagInput = document.getElementById('defaultTag');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const syncChatBtn = document.getElementById('syncChat');
  const chatTitleInput = document.getElementById('chatTitle');
  const syncSection = document.getElementById('syncSection');
  const statusMessage = document.getElementById('statusMessage');
  
  // Load saved settings
  chrome.storage.sync.get(['flomoApi', 'defaultTag'], function(result) {
    if (result.flomoApi) {
      flomoApiInput.value = result.flomoApi;
      syncSection.classList.remove('hidden');
    }
    if (result.defaultTag) {
      defaultTagInput.value = result.defaultTag;
    }
  });
  
  // Save settings
  saveSettingsBtn.addEventListener('click', function() {
    const flomoApi = flomoApiInput.value.trim();
    const defaultTag = defaultTagInput.value.trim();
    
    if (!flomoApi) {
      showStatus('Please enter your Flomo API key', 'error');
      return;
    }
    
    chrome.storage.sync.set({
      flomoApi: flomoApi,
      defaultTag: defaultTag
    }, function() {
      showStatus('Settings saved successfully', 'success');
      syncSection.classList.remove('hidden');
    });
  });
  
  // Sync current chat
  syncChatBtn.addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentTab = tabs[0];
      
      // Check if the current tab is a supported chat platform
      const supportedPlatforms = [
        'chat.openai.com',
        'chatgpt.com',
        'claude.ai',
        'kimi.moonshot.cn',
        'deepseek.com'
      ];
      
      const url = new URL(currentTab.url);
      const hostname = url.hostname;
      
      if (!supportedPlatforms.some(platform => hostname.includes(platform))) {
        showStatus('Not a supported AI chat platform', 'error');
        return;
      }
      
      // Get the chat title provided by user or extract from page
      const userChatTitle = chatTitleInput.value.trim();
      
      // Send message to content script to get chat content
      chrome.tabs.sendMessage(
        currentTab.id,
        { action: 'getChatContent', chatTitle: userChatTitle },
        function(response) {
          if (chrome.runtime.lastError) {
            showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
            return;
          }
          
          if (!response || !response.success) {
            showStatus('Failed to get chat content: ' + (response?.message || 'Unknown error'), 'error');
            return;
          }
          
          // Send to background script to sync with Flomo
          chrome.runtime.sendMessage({
            action: 'syncToFlomo',
            chatContent: response.chatContent,
            chatTitle: response.chatTitle,
            platform: response.platform
          }, function(syncResponse) {
            if (chrome.runtime.lastError) {
              showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
              return;
            }
            
            if (syncResponse.success) {
              showStatus('Chat synchronized to Flomo successfully', 'success');
            } else {
              showStatus('Failed to sync to Flomo: ' + syncResponse.message, 'error');
            }
          });
        }
      );
    });
  });
  
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status ' + type;
    statusMessage.classList.remove('hidden');
    
    // Hide status after 3 seconds
    setTimeout(() => {
      statusMessage.classList.add('hidden');
    }, 3000);
  }
}); 