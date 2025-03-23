// Listen for messages from popup
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getChatContent') {
    const chatTitle = request.chatTitle;
    extractChatContent(chatTitle)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ success: false, message: error.message }));
    return true; // Indicates async response
  }
});

// Add floating button for supported platforms
if (window.location.href.includes('chat.openai.com') || 
    window.location.href.includes('chatgpt.com') || 
    window.location.href.includes('claude.ai')) {
  // Initialize after page loads
  window.addEventListener('load', initializeFlomoButton);
  // Also initialize immediately in case page is already loaded
  initializeFlomoButton();
}

// Function to initialize the floating button for syncing to Flomo
function initializeFlomoButton() {
  // Check if button already exists
  if (document.getElementById('flomo-sync-button')) {
    return;
  }

  // Get the URL to the Flomo logo
  const flomoLogoUrl = chrome.runtime.getURL('images/flomo-logo.png');

  // Create floating button
  const button = document.createElement('div');
  button.id = 'flomo-sync-button';
  button.innerHTML = `
    <img src="${flomoLogoUrl}" alt="Flomo" width="30" height="30" style="border-radius: 50%;" />
  `;
  button.style.cssText = `
    position: fixed;
    bottom: 25px;
    right: 25px;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: 9999;
    transition: all 0.3s ease;
    opacity: 0.8;
  `;

  // Create tooltip
  const tooltip = document.createElement('div');
  tooltip.id = 'flomo-sync-tooltip';
  tooltip.textContent = 'Sync to Flomo';
  tooltip.style.cssText = `
    position: absolute;
    right: 60px;
    top: 50%;
    transform: translateY(-50%);
    background-color: #333;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    pointer-events: none;
    opacity: 0;
    transition: all 0.2s ease;
    white-space: nowrap;
  `;
  button.appendChild(tooltip);

  // Add hover effects
  button.addEventListener('mouseenter', () => {
    button.style.opacity = '1';
    button.style.transform = 'scale(1.1)';
    tooltip.style.opacity = '1';
    tooltip.style.right = '70px';
  });

  button.addEventListener('mouseleave', () => {
    button.style.opacity = '0.8';
    button.style.transform = 'scale(1)';
    tooltip.style.opacity = '0';
    tooltip.style.right = '60px';
  });

  // Add click event
  button.addEventListener('click', () => {
    // Show processing animation
    startSyncAnimation(button);
    
    // Extract the chat content based on the current platform
    try {
      let result;
      if (window.location.href.includes('chat.openai.com') || window.location.href.includes('chatgpt.com')) {
        result = extractOpenAIChat('');
      } else if (window.location.href.includes('claude.ai')) {
        result = extractClaudeChat('');
      } else {
        throw new Error('Unsupported platform');
      }
      
      // Send to background script to sync with Flomo
      chrome.runtime.sendMessage({
        action: 'syncToFlomo',
        chatContent: result.chatContent,
        chatTitle: result.chatTitle,
        platform: window.location.href.includes('claude.ai') ? 'claude' : 'openai'
      }, function(response) {
        // Stop animation
        stopSyncAnimation(button, flomoLogoUrl);
        
        // Show notification
        if (response && response.success) {
          showSyncSuccessAnimation(button);
          showNotification('Chat synchronized to Flomo successfully', 'success');
        } else {
          showSyncErrorAnimation(button);
          showNotification('Failed to sync to Flomo: ' + (response?.message || 'Unknown error'), 'error');
        }
      });
    } catch (error) {
      stopSyncAnimation(button, flomoLogoUrl);
      showSyncErrorAnimation(button);
      showNotification('Error: ' + error.message, 'error');
    }
  });

  // Add to page
  document.body.appendChild(button);
}

// Function to start sync animation
function startSyncAnimation(button) {
  // Replace with loading spinner
  button.innerHTML = `
    <svg class="sync-spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="10" stroke="#10a37f" stroke-width="4" stroke-dasharray="30 30" stroke-dashoffset="0">
        <animateTransform
          attributeName="transform"
          attributeType="XML"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="1s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  `;
  
  // Change background color to white for spinner
  button.style.backgroundColor = 'white';
}

// Function to stop sync animation
function stopSyncAnimation(button, logoUrl) {
  // Restore original image
  button.innerHTML = `
    <img src="${logoUrl}" alt="Flomo" width="30" height="30" style="border-radius: 50%;" />
  `;
  
  // Restore original color
  button.style.backgroundColor = 'white';
  
  // Recreate tooltip
  const tooltip = document.createElement('div');
  tooltip.id = 'flomo-sync-tooltip';
  tooltip.textContent = 'Sync to Flomo';
  tooltip.style.cssText = `
    position: absolute;
    right: 60px;
    top: 50%;
    transform: translateY(-50%);
    background-color: #333;
    color: white;
    padding: 8px 12px;
    border-radius: 4px;
    font-size: 14px;
    pointer-events: none;
    opacity: 0;
    transition: all 0.2s ease;
    white-space: nowrap;
  `;
  button.appendChild(tooltip);
}

// Function to show success animation
function showSyncSuccessAnimation(button) {
  // Temporarily change icon to checkmark
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 13L9 17L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  
  // Change color to success green
  button.style.backgroundColor = '#4CAF50';
  
  // Get logo URL
  const flomoLogoUrl = chrome.runtime.getURL('images/flomo-logo.png');
  
  // Restore original after animation
  setTimeout(() => {
    stopSyncAnimation(button, flomoLogoUrl);
  }, 2000);
}

// Function to show error animation
function showSyncErrorAnimation(button) {
  // Temporarily change icon to X
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6 6L18 18" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  
  // Change color to error red
  button.style.backgroundColor = '#F44336';
  
  // Get logo URL
  const flomoLogoUrl = chrome.runtime.getURL('images/flomo-logo.png');
  
  // Restore original after animation
  setTimeout(() => {
    stopSyncAnimation(button, flomoLogoUrl);
  }, 2000);
}

// Function to show a notification in ChatGPT
function showNotification(message, type) {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.bottom = '85px';
  notification.style.right = '25px';
  notification.style.padding = '12px 16px';
  notification.style.borderRadius = '6px';
  notification.style.zIndex = '10000';
  notification.style.fontSize = '14px';
  notification.style.fontWeight = 'bold';
  notification.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
  notification.style.transition = 'all 0.3s ease';
  notification.style.transform = 'translateY(20px)';
  notification.style.opacity = '0';
  
  if (type === 'success') {
    notification.style.backgroundColor = '#d4edda';
    notification.style.color = '#155724';
  } else {
    notification.style.backgroundColor = '#f8d7da';
    notification.style.color = '#721c24';
  }
  
  notification.textContent = message;
  
  // Add to DOM
  document.body.appendChild(notification);
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateY(0)';
    notification.style.opacity = '1';
  }, 10);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = 'translateY(20px)';
    notification.style.opacity = '0';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Function to extract chat content based on the current platform
async function extractChatContent(userProvidedTitle) {
  try {
    const url = window.location.href;
    let platform, chatTitle, chatContent;
    
    // Determine which platform we're on
    if (url.includes('chat.openai.com') || url.includes('chatgpt.com')) {
      platform = 'openai';
      const result = extractOpenAIChat(userProvidedTitle);
      chatTitle = result.chatTitle;
      chatContent = result.chatContent;
    } else if (url.includes('claude.ai')) {
      platform = 'claude';
      const result = extractClaudeChat(userProvidedTitle);
      chatTitle = result.chatTitle;
      chatContent = result.chatContent;
    } else if (url.includes('kimi.moonshot.cn')) {
      platform = 'kimi';
      const result = extractKimiChat(userProvidedTitle);
      chatTitle = result.chatTitle;
      chatContent = result.chatContent;
    } else if (url.includes('deepseek.com')) {
      platform = 'deepseek';
      const result = extractDeepseekChat(userProvidedTitle);
      chatTitle = result.chatTitle;
      chatContent = result.chatContent;
    } else {
      throw new Error('Unsupported platform');
    }
    
    return {
      success: true,
      platform,
      chatTitle,
      chatContent
    };
  } catch (error) {
    console.error('Error extracting chat content:', error);
    throw error;
  }
}

// Extract chat content from OpenAI's ChatGPT
function extractOpenAIChat(userProvidedTitle) {
  // Get chat title
  let chatTitle = userProvidedTitle;
  if (!chatTitle) {
    // Try to get the chat title from the page
    const titleElement = document.querySelector('title');
    if (titleElement && titleElement.textContent && !titleElement.textContent.includes('ChatGPT')) {
      chatTitle = titleElement.textContent.trim();
    } else {
      // Try to get from nav element
      const navTitleElement = document.querySelector('nav a.flex h3');
      if (navTitleElement) {
        chatTitle = navTitleElement.textContent.trim();
      } else {
        chatTitle = 'ChatGPT Conversation';
      }
    }
  }
  
  console.log("Extracting ChatGPT content, title:", chatTitle);
  
  // Get chat content
  let chatContent = '';
  
  // Try multiple selectors to find the thread container
  const threadContainer = 
    document.querySelector('main div[class*="thread"]') || 
    document.querySelector('main div div div:nth-child(2)') ||
    document.querySelector('main');
  
  if (!threadContainer) {
    throw new Error('Could not find chat thread container');
  }
  
  console.log("Found thread container:", threadContainer);
  
  // Try multiple selectors for message elements
  let messageElements = threadContainer.querySelectorAll('div[data-message-author-role]');
  
  // If the above selector doesn't find any messages, try alternative selectors
  if (!messageElements || messageElements.length === 0) {
    messageElements = threadContainer.querySelectorAll('article') || 
                      threadContainer.querySelectorAll('.message') ||
                      threadContainer.querySelectorAll('div > div > div > div > div');
                      
    console.log("Using alternative selector, found messages:", messageElements.length);
  }
  
  if (!messageElements || messageElements.length === 0) {
    throw new Error('Could not find any chat messages');
  }
  
  // Process each message
  messageElements.forEach((message, index) => {
    console.log("Processing message", index);
    
    // Determine message role (user or assistant)
    let role = message.getAttribute('data-message-author-role');
    let isUser = false;
    
    if (!role) {
      // If data-message-author-role is not available, try to determine role by structure or class
      isUser = message.classList.contains('user') || 
              message.querySelector('.user-avatar') !== null ||
              message.querySelector('[data-user-message]') !== null;
      role = isUser ? 'user' : 'assistant';
    } else {
      isUser = role === 'user';
    }
    
    const roleName = isUser ? 'You' : 'ChatGPT';
    
    // Find the message content - try multiple possible selectors
    const contentElement = 
      message.querySelector('div[data-message-text-content="true"]') ||
      message.querySelector('.markdown') ||
      message.querySelector('.content') ||
      message;
    
    if (contentElement) {
      // Clone it to avoid modifying the page
      const contentClone = contentElement.cloneNode(true);
      
      // Handle code blocks, replace with markdown backticks
      const codeBlocks = contentClone.querySelectorAll('pre');
      codeBlocks.forEach(codeBlock => {
        const codeElement = codeBlock.querySelector('code');
        if (codeElement) {
          const language = codeElement.className.match(/language-(\w+)/)?.[1] || '';
          const codeText = codeElement.textContent;
          const markdownCode = '```' + language + '\n' + codeText + '\n```';
          // Replace code block with markdown code
          const placeholder = document.createElement('div');
          placeholder.innerHTML = markdownCode;
          codeBlock.replaceWith(placeholder);
        }
      });
      
      const plainText = contentElement.textContent.trim();
      console.log(`Message ${index} (${roleName}) content:`, plainText.substring(0, 50) + '...');
      
      // Add the message to chat content
      chatContent += `**${roleName}**:\n${contentClone.innerHTML}\n\n`;
    } else {
      console.log(`No content found for message ${index}`);
    }
    
    // Check for images
    const imageElements = message.querySelectorAll('img:not([aria-hidden="true"])');
    imageElements.forEach(img => {
      if (img.src && !img.src.includes('data:image/svg+xml')) {
        chatContent += `![Image](${img.src})\n\n`;
      }
    });
  });
  
  // Convert HTML to plain text while preserving basic formatting
  chatContent = chatContent
    .replace(/<br>/g, '\n')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<li>/g, '- ')
    .replace(/<\/li>/g, '\n')
    .replace(/<\/ul>/g, '\n')
    .replace(/<\/ol>/g, '\n')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<code>(.*?)<\/code>/g, '`$1`')
    .replace(/<[^>]*>/g, ''); // Remove any remaining HTML tags
  
  console.log("Final extracted content length:", chatContent.length);
  
  if (!chatContent.trim()) {
    try {
      // Last resort: try a more direct approach using the XPath provided
      const firstMessage = document.evaluate('/html/body/div[1]/div/div[1]/div[2]/main/div[1]/div/div[2]/div/div/div[2]/article[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      
      if (firstMessage) {
        console.log("Found message using XPath");
        chatContent = "**Conversation with ChatGPT**:\n\n";
        
        // Find all sibling articles
        let currentArticle = firstMessage;
        let messageIndex = 1;
        
        while (currentArticle) {
          const isUserArticle = messageIndex % 2 === 1; // Assuming alternating pattern
          const roleName = isUserArticle ? 'You' : 'ChatGPT';
          
          chatContent += `**${roleName}**:\n${currentArticle.textContent.trim()}\n\n`;
          
          // Move to next article
          currentArticle = currentArticle.nextElementSibling;
          messageIndex++;
        }
      }
    } catch (error) {
      console.error("XPath fallback failed:", error);
    }
  }
  
  return { chatTitle, chatContent };
}

// Extract chat content from Claude
function extractClaudeChat(userProvidedTitle) {
  console.log("Extracting Claude content");
  
  // Get chat title
  let chatTitle = userProvidedTitle;
  if (!chatTitle) {
    try {
      // Try to get title using the exact XPath provided
      const titleElement = document.evaluate('/html/body/div[2]/div/div/header/div[2]/div[1]/div/button/div/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      
      if (titleElement && titleElement.textContent) {
        chatTitle = titleElement.textContent.trim();
        console.log("Found Claude chat title using XPath:", chatTitle);
      } else {
        // Fallback options if XPath doesn't work
        const titleFromDocument = document.querySelector('title');
        if (titleFromDocument && titleFromDocument.textContent && !titleFromDocument.textContent.includes('Claude')) {
          chatTitle = titleFromDocument.textContent.trim();
        } else {
          // Try to get from conversation history using various selectors
          const conversationTitle = document.querySelector('div[aria-label="conversation history"] button span') ||
                                  document.querySelector('.conversation-title') ||
                                  document.querySelector('header button div div');
          if (conversationTitle) {
            chatTitle = conversationTitle.textContent.trim();
          } else {
            chatTitle = 'Claude Conversation';
          }
        }
      }
    } catch (error) {
      console.error("Error extracting Claude chat title:", error);
      chatTitle = 'Claude Conversation';
    }
  }
  
  console.log("Claude chat title:", chatTitle);
  
  // Get chat content
  let chatContent = '';
  
  try {
    // Using XPath to find messages based on the pattern we know
    // The messages appear to be in divs with incrementing indices
    chatContent = "**Conversation with Claude**:\n\n";
    
    // Check if the first message exists at the provided XPath
    const firstUserMessage = document.evaluate('/html/body/div[2]/div/div/div/div[1]/div[1]/div[1]/div/div/div[1]/div[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    
    if (firstUserMessage) {
      console.log("Found first Claude message using specific XPath");
      
      // Add the first user message
      chatContent += `**You**:\n${firstUserMessage.textContent.trim()}\n\n`;
      
      // Now look for the Claude response and subsequent messages
      // The second message (Claude's response) has a different XPath structure
      const firstClaudeResponse = document.evaluate('/html/body/div[2]/div/div/div/div[1]/div[1]/div[2]/div/div/div[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      
      if (firstClaudeResponse) {
        console.log("Found Claude's response");
        chatContent += `**Claude**:\n${firstClaudeResponse.textContent.trim()}\n\n`;
        
        // Try to find additional messages by incrementing the div index
        let messageIndex = 3; // Start with the third message (second user message)
        let foundMessages = 2; // Already found 2 messages
        
        while (messageIndex <= 30) { // Limit to 30 messages for safety
          let nextMessage;
          
          // For even indices, it's a user message (div index is odd)
          if (messageIndex % 2 === 1) {
            nextMessage = document.evaluate(`/html/body/div[2]/div/div/div/div[1]/div[1]/div[${messageIndex}]/div/div/div[1]/div[2]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (nextMessage) {
              chatContent += `**You**:\n${nextMessage.textContent.trim()}\n\n`;
              foundMessages++;
            }
          } 
          // For odd indices, it's a Claude message (div index is even)
          else {
            nextMessage = document.evaluate(`/html/body/div[2]/div/div/div/div[1]/div[1]/div[${messageIndex}]/div/div/div[1]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (nextMessage) {
              chatContent += `**Claude**:\n${nextMessage.textContent.trim()}\n\n`;
              foundMessages++;
            }
          }
          
          // If we didn't find a message at this index, we're probably done
          if (!nextMessage) {
            console.log(`No more messages found after ${foundMessages} messages`);
            break;
          }
          
          messageIndex++;
        }
      } else {
        console.log("Could not find Claude's response using XPath");
      }
    }
  } catch (error) {
    console.error("Error extracting Claude chat content using XPaths:", error);
  }
  
  // If direct XPath approach didn't work or found no messages, try alternative approaches
  if (!chatContent.trim() || chatContent === "**Conversation with Claude**:\n\n") {
    try {
      console.log("Trying alternative method for Claude content extraction");
      chatContent = "**Conversation with Claude**:\n\n";
      
      // Look for message containers by class pattern
      const messageContainers = document.querySelectorAll('div[class*="message-container"], div[class*="Message"], div[class*="chat-message"]');
      console.log(`Found ${messageContainers.length} message containers by class`);
      
      if (messageContainers.length > 0) {
        messageContainers.forEach((container, index) => {
          // Determine if this is a user or Claude message
          const isUserMessage = 
            container.classList.contains('user-message') || 
            container.querySelector('div[class*="UserMessage"]') || 
            container.getAttribute('data-author') === 'user' ||
            container.getAttribute('data-role') === 'user';
          
          const roleName = isUserMessage ? 'You' : 'Claude';
          
          // Get the text content
          const textContent = container.textContent.trim();
          if (textContent) {
            console.log(`Adding ${roleName} message #${index+1}`);
            chatContent += `**${roleName}**:\n${textContent}\n\n`;
          }
        });
      } else {
        // If still no luck, try a more general approach
        console.log("Trying more general approach for Claude content");
        const mainContainer = document.querySelector('div[class*="ConversationContent"], main');
        
        if (mainContainer) {
          // Find text blocks that are likely messages
          const textBlocks = mainContainer.querySelectorAll('div[class*="content"], div[class*="text"], div > p, div > div > div > div');
          
          let lastContent = '';
          let userTurn = true; // Assume first message is from user
          
          textBlocks.forEach((block, index) => {
            const content = block.textContent.trim();
            
            // Skip empty blocks, duplicates, or very short blocks that are likely UI elements
            if (content && content !== lastContent && content.length > 20) {
              const roleName = userTurn ? 'You' : 'Claude';
              chatContent += `**${roleName}**:\n${content}\n\n`;
              lastContent = content;
              userTurn = !userTurn; // Alternate between user and Claude
            }
          });
        }
      }
    } catch (error) {
      console.error("Error in alternative Claude extraction:", error);
    }
  }
  
  console.log("Final Claude content length:", chatContent.length);
  
  if (!chatContent.trim() || chatContent === "**Conversation with Claude**:\n\n") {
    chatContent = "Could not extract conversation content from Claude.";
  }
  
  return { chatTitle, chatContent };
}

// Extract chat content from Kimi
function extractKimiChat(userProvidedTitle) {
  // Get chat title
  let chatTitle = userProvidedTitle;
  if (!chatTitle) {
    const titleElement = document.querySelector('title');
    if (titleElement && titleElement.textContent && !titleElement.textContent.includes('Kimi')) {
      chatTitle = titleElement.textContent.trim();
    } else {
      // Try to find the chat title in the sidebar
      const chatTitleElement = document.querySelector('.conversation-item.active .conversation-item-title');
      if (chatTitleElement) {
        chatTitle = chatTitleElement.textContent.trim();
      } else {
        chatTitle = 'Kimi Conversation';
      }
    }
  }
  
  // Get chat content
  let chatContent = '';
  
  // Find the messages container - this selector might need adjustment based on Kimi's actual DOM structure
  const messagesContainer = document.querySelector('.chat-content') || 
                           document.querySelector('main') ||
                           document.querySelector('div[class*="conversation"]');
  
  if (!messagesContainer) {
    throw new Error('Could not find messages container for Kimi');
  }
  
  // Process messages - selectors might need adjustment
  const messageElements = messagesContainer.querySelectorAll('.message, .chat-item');
  messageElements.forEach(message => {
    // Determine if user or assistant message
    const isUserMessage = message.classList.contains('user-message') || 
                          message.classList.contains('user') ||
                          message.querySelector('.user-avatar');
    
    const roleName = isUserMessage ? 'You' : 'Kimi';
    
    // Get message content
    const contentElement = message.querySelector('.message-content') || 
                          message.querySelector('.content');
    
    if (contentElement) {
      // Clone to avoid modifying the page
      const contentClone = contentElement.cloneNode(true);
      
      // Handle code blocks if present
      const codeBlocks = contentClone.querySelectorAll('pre, code-block');
      codeBlocks.forEach(codeBlock => {
        const codeText = codeBlock.textContent;
        const markdownCode = '```\n' + codeText + '\n```';
        const placeholder = document.createElement('div');
        placeholder.innerHTML = markdownCode;
        codeBlock.replaceWith(placeholder);
      });
      
      chatContent += `**${roleName}**:\n${contentClone.innerHTML}\n\n`;
    }
    
    // Check for images
    const imageElements = message.querySelectorAll('img');
    imageElements.forEach(img => {
      if (img.src && !img.src.includes('data:image/svg+xml') && !img.src.includes('avatar')) {
        chatContent += `![Image](${img.src})\n\n`;
      }
    });
  });
  
  // Convert HTML to plain text while preserving basic formatting
  chatContent = chatContent
    .replace(/<br>/g, '\n')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<li>/g, '- ')
    .replace(/<\/li>/g, '\n')
    .replace(/<\/ul>/g, '\n')
    .replace(/<\/ol>/g, '\n')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<code>(.*?)<\/code>/g, '`$1`')
    .replace(/<[^>]*>/g, ''); // Remove any remaining HTML tags
  
  return { chatTitle, chatContent };
}

// Extract chat content from DeepSeek
function extractDeepseekChat(userProvidedTitle) {
  // Get chat title
  let chatTitle = userProvidedTitle;
  if (!chatTitle) {
    const titleElement = document.querySelector('title');
    if (titleElement && titleElement.textContent && !titleElement.textContent.includes('DeepSeek')) {
      chatTitle = titleElement.textContent.trim();
    } else {
      // Look for chat title in the UI
      const chatTitleElement = document.querySelector('.chat-title, .conversation-title');
      if (chatTitleElement) {
        chatTitle = chatTitleElement.textContent.trim();
      } else {
        chatTitle = 'DeepSeek Conversation';
      }
    }
  }
  
  // Get chat content
  let chatContent = '';
  
  // Find the messages container - selectors might need adjustment based on DeepSeek's actual DOM structure
  const messagesContainer = document.querySelector('.chat-messages') || 
                           document.querySelector('.conversation-container') ||
                           document.querySelector('main');
  
  if (!messagesContainer) {
    throw new Error('Could not find messages container for DeepSeek');
  }
  
  // Process messages - selectors might need adjustment
  const messageElements = messagesContainer.querySelectorAll('.message, .chat-item, .conversation-item');
  messageElements.forEach(message => {
    // Determine if user or assistant message
    const isUserMessage = message.classList.contains('user-message') || 
                          message.classList.contains('user') ||
                          message.getAttribute('data-role') === 'user';
    
    const roleName = isUserMessage ? 'You' : 'DeepSeek';
    
    // Get message content
    const contentElement = message.querySelector('.message-content') || 
                          message.querySelector('.content');
    
    if (contentElement) {
      // Clone to avoid modifying the page
      const contentClone = contentElement.cloneNode(true);
      
      // Handle code blocks if present
      const codeBlocks = contentClone.querySelectorAll('pre');
      codeBlocks.forEach(codeBlock => {
        const codeText = codeBlock.textContent;
        const language = codeBlock.getAttribute('data-language') || '';
        const markdownCode = '```' + language + '\n' + codeText + '\n```';
        const placeholder = document.createElement('div');
        placeholder.innerHTML = markdownCode;
        codeBlock.replaceWith(placeholder);
      });
      
      chatContent += `**${roleName}**:\n${contentClone.innerHTML}\n\n`;
    }
    
    // Check for images
    const imageElements = message.querySelectorAll('img:not(.avatar)');
    imageElements.forEach(img => {
      if (img.src && !img.src.includes('data:image/svg+xml')) {
        chatContent += `![Image](${img.src})\n\n`;
      }
    });
  });
  
  // Convert HTML to plain text while preserving basic formatting
  chatContent = chatContent
    .replace(/<br>/g, '\n')
    .replace(/<p>/g, '')
    .replace(/<\/p>/g, '\n\n')
    .replace(/<li>/g, '- ')
    .replace(/<\/li>/g, '\n')
    .replace(/<\/ul>/g, '\n')
    .replace(/<\/ol>/g, '\n')
    .replace(/<strong>(.*?)<\/strong>/g, '**$1**')
    .replace(/<em>(.*?)<\/em>/g, '*$1*')
    .replace(/<code>(.*?)<\/code>/g, '`$1`')
    .replace(/<[^>]*>/g, ''); // Remove any remaining HTML tags
  
  return { chatTitle, chatContent };
} 