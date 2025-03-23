import PlatformInterface from '../../utils/platform-interface.js';
import * as UIUtils from '../../utils/ui-utils.js';

/**
 * OpenAI Platform Implementation
 */
class OpenAIPlatform extends PlatformInterface {
  /**
   * Check if the current URL matches OpenAI's platforms
   * @param {string} url - The URL to check
   * @returns {boolean} - True if this is an OpenAI platform
   */
  static isMatch(url) {
    return url.includes('chat.openai.com') || url.includes('chatgpt.com');
  }

  /**
   * Get the platform name
   * @returns {string} - The platform name
   */
  static getPlatformName() {
    return 'openai';
  }

  /**
   * Extract the chat title from the page
   * @param {string} userProvidedTitle - Optional title provided by the user
   * @returns {string} - The extracted title
   */
  extractTitle(userProvidedTitle = '') {
    // Get chat title
    if (userProvidedTitle) {
      return userProvidedTitle;
    }
    
    // Try to get the chat title from the page
    const titleElement = document.querySelector('title');
    if (titleElement && titleElement.textContent && !titleElement.textContent.includes('ChatGPT')) {
      return titleElement.textContent.trim();
    }
    
    // Try to get from nav element
    const navTitleElement = document.querySelector('nav a.flex h3');
    if (navTitleElement) {
      return navTitleElement.textContent.trim();
    }
    
    return 'ChatGPT Conversation';
  }

  /**
   * Extract the chat content from the page
   * @returns {string} - The extracted content
   */
  extractContent() {
    console.log("Extracting ChatGPT content");
    
    // Get chat content
    let messages = [];
    
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
        console.log(`Message ${index} (${isUser ? 'User' : 'ChatGPT'}) content:`, plainText.substring(0, 50) + '...');
        
        // Format the message with improved styling
        let formattedMessage = isUser ? 
          `### 👤 You\n${contentClone.innerHTML}` : 
          `### 🤖 ChatGPT\n${contentClone.innerHTML}`;
        
        messages.push(formattedMessage);
      } else {
        console.log(`No content found for message ${index}`);
      }
      
      // Check for images
      const imageElements = message.querySelectorAll('img:not([aria-hidden="true"])');
      imageElements.forEach(img => {
        if (img.src && !img.src.includes('data:image/svg+xml')) {
          messages.push(`![Image](${img.src})`);
        }
      });
    });
    
    // Convert HTML in each message to plain text while preserving basic formatting
    for (let i = 0; i < messages.length; i++) {
      messages[i] = messages[i]
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
    }
    
    // Add a header and join messages with separators
    let chatContent = "# ChatGPT Conversation\n\n" + messages.join('\n\n---\n\n');
    
    console.log("Final extracted content length:", chatContent.length);
    
    if (!chatContent.trim() || chatContent === "# ChatGPT Conversation\n\n") {
      try {
        // Last resort: try a more direct approach using XPath
        const firstMessage = document.evaluate('/html/body/div[1]/div/div[1]/div[2]/main/div[1]/div/div[2]/div/div/div[2]/article[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        if (firstMessage) {
          console.log("Found message using XPath");
          messages = [];
          
          // Find all sibling articles
          let currentArticle = firstMessage;
          let messageIndex = 1;
          
          while (currentArticle) {
            const isUserArticle = messageIndex % 2 === 1; // Assuming alternating pattern
            
            const text = currentArticle.textContent.trim();
            if (text) {
              const formattedMessage = isUserArticle ? 
                `### 👤 You\n${text}` : 
                `### 🤖 ChatGPT\n${text}`;
              
              messages.push(formattedMessage);
            }
            
            // Move to next article
            currentArticle = currentArticle.nextElementSibling;
            messageIndex++;
          }
          
          chatContent = "# ChatGPT Conversation\n\n" + messages.join('\n\n---\n\n');
        }
      } catch (error) {
        console.error("XPath fallback failed:", error);
        chatContent = "Could not extract chat content from ChatGPT. Try selecting and copying the content manually.";
      }
    }
    
    return chatContent;
  }

  /**
   * Initialize platform-specific UI elements
   * @param {Function} onSyncClick - Callback when sync button is clicked
   */
  initUI(onSyncClick) {
    // Check if button already exists
    if (document.getElementById('flomo-sync-button')) {
      return;
    }

    const flomoLogoUrl = chrome.runtime.getURL('images/flomo-logo.png');
    const button = UIUtils.createFlomoButton(() => {
      // Show processing animation
      UIUtils.startSyncAnimation(button);
      
      try {
        const chatTitle = this.extractTitle('');
        const chatContent = this.extractContent();
        
        // Call the provided callback with the extracted data
        onSyncClick(chatTitle, chatContent, 'openai', 
          (success, message) => {
            // Handle response
            if (success) {
              UIUtils.stopSyncAnimation(button, flomoLogoUrl);
              UIUtils.showSyncSuccessAnimation(button, flomoLogoUrl);
              UIUtils.showNotification('Chat synchronized to Flomo successfully', 'success');
            } else {
              UIUtils.stopSyncAnimation(button, flomoLogoUrl);
              UIUtils.showSyncErrorAnimation(button, flomoLogoUrl);
              UIUtils.showNotification('Failed to sync to Flomo: ' + message, 'error');
            }
          }
        );
      } catch (error) {
        UIUtils.stopSyncAnimation(button, flomoLogoUrl);
        UIUtils.showSyncErrorAnimation(button, flomoLogoUrl);
        UIUtils.showNotification('Error: ' + error.message, 'error');
      }
    });
    
    // Add to page
    document.body.appendChild(button);
  }
}

export default OpenAIPlatform; 