document.addEventListener('DOMContentLoaded', function() {
  // Tab switching functionality
  const tabs = document.querySelectorAll('.tab');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.getAttribute('data-tab');
      
      // Update active tab
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show active content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
          content.classList.add('active');
        }
      });
    });
  });

  // Form elements
  const flomoWebhookInput = document.getElementById('flomoWebhook');
  const defaultTagInput = document.getElementById('defaultTag');
  const saveSettingsBtn = document.getElementById('saveSettings');
  const syncChatBtn = document.getElementById('syncChat');
  const chatTitleInput = document.getElementById('chatTitle');
  const syncStatusMessage = document.getElementById('syncStatusMessage');
  const settingsStatusMessage = document.getElementById('settingsStatusMessage');
  
  // Default platform settings - still kept for backward compatibility
  const defaultPlatformSettings = {
    openai: { enabled: true, tags: ['#openai', '#chatgpt'] },
    claude: { enabled: true, tags: ['#claude'] },
    kimi: { enabled: true, tags: ['#kimi'] },
    deepseek: { enabled: true, tags: ['#deepseek'] },
  };
  
  // Load saved settings
  chrome.storage.local.get(['flomoWebhook', 'defaultTag', 'platformSettings'], function(result) {
    if (result.flomoWebhook) {
      flomoWebhookInput.value = result.flomoWebhook;
    }
    
    if (result.defaultTag) {
      defaultTagInput.value = result.defaultTag;
    }
  });
  
  // Save settings
  saveSettingsBtn.addEventListener('click', function() {
    const flomoWebhook = flomoWebhookInput.value.trim();
    const defaultTag = defaultTagInput.value.trim();
    
    if (!flomoWebhook) {
      showSettingsStatus('Please enter your Flomo webhook URL', 'error');
      return;
    }
    
    // Validate webhook URL format
    if (!flomoWebhook.startsWith('https://flomoapp.com/iwh/') && 
        !flomoWebhook.startsWith('https://v.flomoapp.com/jwh/')) {
      showSettingsStatus('Invalid Flomo webhook URL format', 'error');
      return;
    }
    
    // Save settings, keeping platformSettings for backward compatibility
    chrome.storage.local.set({
      flomoWebhook: flomoWebhook,
      defaultTag: defaultTag,
      platformSettings: defaultPlatformSettings
    }, function() {
      showSettingsStatus('Settings saved successfully', 'success');
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
        showSyncStatus('Not a supported AI chat platform', 'error');
        return;
      }
      
      // First check if webhook is configured
      chrome.storage.local.get(['flomoWebhook'], function(result) {
        if (!result.flomoWebhook) {
          showSyncStatus('Error: Flomo webhook not configured. Please go to Settings tab and configure it.', 'error');
          
          // Switch to settings tab
          document.querySelector('.tab[data-tab="settings"]').click();
          
          return;
        }
        
        // Get the chat title provided by user
        const userChatTitle = chatTitleInput.value.trim();
        
        // Send message to content script to get chat content
        chrome.tabs.sendMessage(
          currentTab.id,
          { action: 'getChatContent', chatTitle: userChatTitle },
          function(response) {
            if (chrome.runtime.lastError) {
              showSyncStatus('Error: ' + chrome.runtime.lastError.message, 'error');
              return;
            }
            
            if (!response || !response.success) {
              showSyncStatus('Failed to get chat content: ' + (response?.message || 'Unknown error'), 'error');
              return;
            }
            
            // Send to background script to sync with Flomo
            chrome.runtime.sendMessage({
              action: 'syncToFlomo',
              data: {
                content: response.chatContent,
                title: response.chatTitle,
                platform: response.platform
              }
            }, function(syncResponse) {
              if (chrome.runtime.lastError) {
                showSyncStatus('Error: ' + chrome.runtime.lastError.message, 'error');
                return;
              }
              
              if (syncResponse && syncResponse.success) {
                showSyncStatus('Chat synchronized to Flomo successfully!', 'success');
              } else {
                showSyncStatus('Failed to sync to Flomo: ' + (syncResponse?.error || 'Unknown error'), 'error');
              }
            });
          }
        );
      });
    });
  });
  
  // Show status in the sync tab
  function showSyncStatus(message, type) {
    showStatus(syncStatusMessage, message, type);
  }
  
  // Show status in the settings tab
  function showSettingsStatus(message, type) {
    showStatus(settingsStatusMessage, message, type);
  }
  
  // Generic function to show status
  function showStatus(element, message, type) {
    element.textContent = message;
    element.className = 'status ' + type;
    element.classList.remove('hidden');
    element.classList.add('visible');
    
    // Hide status after 3 seconds
    setTimeout(() => {
      element.classList.remove('visible');
      setTimeout(() => {
        element.classList.add('hidden');
      }, 300);
    }, 3000);
  }
}); 