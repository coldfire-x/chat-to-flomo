import PlatformInterface from '../../utils/platform-interface.js';
import * as UIUtils from '../../utils/ui-utils.js';

/**
 * Claude Platform Implementation
 */
class ClaudePlatform extends PlatformInterface {
  /**
   * Check if the current URL matches Claude's platform
   * @param {string} url - The URL to check
   * @returns {boolean} - True if this is a Claude platform
   */
  static isMatch(url) {
    return url.includes('claude.ai');
  }

  /**
   * Get the platform name
   * @returns {string} - The platform name
   */
  static getPlatformName() {
    return 'claude';
  }

  /**
   * Extract the chat title from the page
   * @param {string} userProvidedTitle - Optional title provided by the user
   * @returns {string} - The extracted title
   */
  extractTitle(userProvidedTitle = '') {
    console.log("Extracting Claude title");
    
    // Get chat title
    if (userProvidedTitle) {
      return userProvidedTitle;
    }
    
    try {
      // Try to get title using the exact XPath provided
      const titleElement = document.evaluate('/html/body/div[2]/div/div/header/div[2]/div[1]/div/button/div/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      
      if (titleElement && titleElement.textContent) {
        const title = titleElement.textContent.trim();
        console.log("Found Claude chat title using XPath:", title);
        return title;
      } else {
        // Fallback options if XPath doesn't work
        const titleFromDocument = document.querySelector('title');
        if (titleFromDocument && titleFromDocument.textContent && !titleFromDocument.textContent.includes('Claude')) {
          return titleFromDocument.textContent.trim();
        } else {
          // Try to get from conversation history using various selectors
          const conversationTitle = document.querySelector('div[aria-label="conversation history"] button span') ||
                                  document.querySelector('.conversation-title') ||
                                  document.querySelector('header button div div');
          if (conversationTitle) {
            return conversationTitle.textContent.trim();
          }
        }
      }
    } catch (error) {
      console.error("Error extracting Claude chat title:", error);
    }
    
    return 'Claude Conversation';
  }

  /**
   * Extract the chat content from the page
   * @returns {string} - The extracted content
   */
  extractContent() {
    console.log("Extracting Claude content");
    
    // Get chat content
    let messages = [];
    
    try {
      // Using XPath to find messages based on the pattern we know
      // The messages appear to be in divs with incrementing indices
      
      // Check if the first message exists at the provided XPath
      const firstUserMessage = document.evaluate('/html/body/div[2]/div/div/div/div[1]/div[1]/div[1]/div/div/div[1]/div[2]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
      
      if (firstUserMessage) {
        console.log("Found first Claude message using specific XPath");
        
        // Add the first user message
        messages.push(`### 👤 You\n${firstUserMessage.textContent.trim()}`);
        
        // Now look for the Claude response and subsequent messages
        // The second message (Claude's response) has a different XPath structure
        const firstClaudeResponse = document.evaluate('/html/body/div[2]/div/div/div/div[1]/div[1]/div[2]/div/div/div[1]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        
        if (firstClaudeResponse) {
          console.log("Found Claude's response");
          messages.push(`### 🤖 Claude\n${firstClaudeResponse.textContent.trim()}`);
          
          // Try to find additional messages by incrementing the div index
          let messageIndex = 3; // Start with the third message (second user message)
          let foundMessages = 2; // Already found 2 messages
          
          while (messageIndex <= 30) { // Limit to 30 messages for safety
            let nextMessage;
            
            // For even indices, it's a user message (div index is odd)
            if (messageIndex % 2 === 1) {
              nextMessage = document.evaluate(`/html/body/div[2]/div/div/div/div[1]/div[1]/div[${messageIndex}]/div/div/div[1]/div[2]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
              if (nextMessage) {
                messages.push(`### 👤 You\n${nextMessage.textContent.trim()}`);
                foundMessages++;
              }
            } 
            // For odd indices, it's a Claude message (div index is even)
            else {
              nextMessage = document.evaluate(`/html/body/div[2]/div/div/div/div[1]/div[1]/div[${messageIndex}]/div/div/div[1]`, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
              if (nextMessage) {
                messages.push(`### 🤖 Claude\n${nextMessage.textContent.trim()}`);
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
    if (messages.length === 0) {
      try {
        console.log("Trying alternative method for Claude content extraction");
        
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
            
            // Get the text content
            const textContent = container.textContent.trim();
            if (textContent) {
              console.log(`Adding ${isUserMessage ? 'User' : 'Claude'} message #${index+1}`);
              if (isUserMessage) {
                messages.push(`### 👤 You\n${textContent}`);
              } else {
                messages.push(`### 🤖 Claude\n${textContent}`);
              }
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
                if (userTurn) {
                  messages.push(`### 👤 You\n${content}`);
                } else {
                  messages.push(`### 🤖 Claude\n${content}`);
                }
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
    
    // Format the final result
    let chatContent = "# Claude Conversation\n\n";
    
    if (messages.length > 0) {
      chatContent += messages.join('\n\n---\n\n');
    } else {
      chatContent = "Could not extract conversation content from Claude. Try selecting and copying the content manually.";
    }
    
    console.log("Final Claude content length:", chatContent.length);
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
        onSyncClick(chatTitle, chatContent, 'claude', 
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

export default ClaudePlatform; 