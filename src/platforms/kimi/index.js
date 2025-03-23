import PlatformInterface from '../../utils/platform-interface.js';
import * as UIUtils from '../../utils/ui-utils.js';

/**
 * Kimi Platform Implementation
 */
class KimiPlatform extends PlatformInterface {
  /**
   * Check if the current URL matches Kimi's platform
   * @param {string} url - The URL to check
   * @returns {boolean} - True if this is a Kimi platform
   */
  static isMatch(url) {
    return url.includes('kimi.moonshot.cn');
  }

  /**
   * Get the platform name
   * @returns {string} - The platform name
   */
  static getPlatformName() {
    return 'kimi';
  }

  /**
   * Extract the chat title from the page
   * @param {string} userProvidedTitle - Optional title provided by the user
   * @returns {string} - The extracted title
   */
  extractTitle(userProvidedTitle = '') {
    console.log("Extracting Kimi title");
    
    // Get chat title
    if (userProvidedTitle) {
      return userProvidedTitle;
    }
    
    try {
      // Try to get title using the exact XPath provided
      const titleElement = document.evaluate(
        '/html/body/div[1]/div/div/div[2]/div/div/div/div[1]/div[1]/header/h2', 
        document, 
        null, 
        XPathResult.FIRST_ORDERED_NODE_TYPE, 
        null
      ).singleNodeValue;
      
      if (titleElement && titleElement.textContent) {
        const title = titleElement.textContent.trim();
        console.log("Found Kimi chat title using XPath:", title);
        return title;
      } else {
        // Fallback options if XPath doesn't work
        const titleFromDocument = document.querySelector('title');
        if (titleFromDocument && titleFromDocument.textContent && !titleFromDocument.textContent.includes('Kimi')) {
          return titleFromDocument.textContent.trim();
        } else {
          return 'Kimi Conversation';
        }
      }
    } catch (error) {
      console.error('Error extracting Kimi title:', error);
      return 'Kimi Conversation';
    }
  }

  /**
   * Extract the chat content from the page
   * @returns {string} - The extracted content
   */
  extractContent() {
    try {
      // Get all messages with their positions for proper ordering
      const messageItems = [];
      
      // First try to extract messages using the specific CSS classes provided
      const segments = Array.from(document.querySelectorAll('.segment.segment-assistant, .segment.segment-user'));
      
      if (segments && segments.length > 0) {
        console.log("Found Kimi messages using specific CSS classes:", segments.length);
        
        // Process all segments and track their position in the DOM
        segments.forEach(segment => {
          const isUser = segment.classList.contains('segment-user');
          const text = segment.textContent.trim();
          
          if (text && text.length > 2) {
            // Get the position of this element in the document
            const position = segment.getBoundingClientRect().top + window.scrollY;
            
            messageItems.push({
              text: isUser ? `### 👤 User\n${text}` : `### 🤖 Kimi\n${text}`,
              position: position,
              element: segment
            });
          }
        });
      }
      
      // If no messages found with specific classes, try alternative selectors
      if (messageItems.length === 0) {
        // Try to find all messages in the chat container using various selectors
        const chatContainer = document.querySelector('.chat-container, .message-list, .conversation, [class*="conversation"], [class*="chat-list"]');
        
        if (chatContainer) {
          // Get all message blocks - more inclusive selector
          const allMessageBlocks = Array.from(chatContainer.querySelectorAll('div[class*="message"], div[class*="chat"], div > div > div[class]'));
          
          allMessageBlocks.forEach(block => {
            // Skip likely non-message elements (too short, navigation elements, etc.)
            if (block.textContent.trim().length < 2) return;
            if (block.querySelector('button, input, textarea')) return;
            
            // Determine if it's a user message based on position, class, or styling
            const isUser = block.classList.contains('right') || 
                           block.classList.contains('user') ||
                           window.getComputedStyle(block).textAlign === 'right' ||
                           block.style.alignSelf === 'flex-end';
            
            const text = block.textContent.trim();
            if (text && text.length > 2 && !messageItems.some(m => m.text.includes(text))) {
              // Get the position of this element in the document
              const position = block.getBoundingClientRect().top + window.scrollY;
              
              messageItems.push({
                text: isUser ? `### 👤 User\n${text}` : `### 🤖 Kimi\n${text}`,
                position: position,
                element: block
              });
            }
          });
        }
        
        // If we still couldn't find messages, try XPath approach
        if (messageItems.length === 0) {
          console.log("Trying to extract Kimi messages using XPath selectors");
          
          // Use the specific XPaths provided for assistant and user messages
          // Get all segments using a more general XPath that will capture both user and assistant segments
          const segmentsXPath = '/html/body/div[1]/div/div/div[2]/div/div/div/div[1]/div[2]/div/div';
          const segmentsResult = document.evaluate(
            segmentsXPath,
            document,
            null,
            XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
            null
          );
          
          // Process all segments
          for (let i = 0; i < segmentsResult.snapshotLength; i++) {
            const node = segmentsResult.snapshotItem(i);
            
            // Skip if this isn't a message segment
            if (!node.classList.contains('segment-assistant') && !node.classList.contains('segment-user')) {
              continue;
            }
            
            const isUser = node.classList.contains('segment-user');
            const text = node.textContent.trim();
            
            if (text && text.length > 2) {
              // Get the position of this element in the document
              const position = node.getBoundingClientRect().top + window.scrollY;
              
              messageItems.push({
                text: isUser ? `### 👤 User\n${text}` : `### 🤖 Kimi\n${text}`,
                position: position,
                element: node
              });
            }
          }
          
          // If still no messages found, try broader XPath selectors
          if (messageItems.length === 0) {
            const xpathResult = document.evaluate(
              '//div[contains(@class, "chat") or contains(@class, "message")]/div', 
              document, 
              null, 
              XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, 
              null
            );
            
            for (let i = 0; i < xpathResult.snapshotLength; i++) {
              const node = xpathResult.snapshotItem(i);
              const text = node.textContent.trim();
              
              if (text && text.length > 2) {
                // Determine if user message (usually appears on right side)
                const position = node.getBoundingClientRect();
                const isRight = position.right > (window.innerWidth / 2);
                
                if (!messageItems.some(m => m.text.includes(text))) {
                  messageItems.push({
                    text: isRight ? `### 👤 User\n${text}` : `### 🤖 Kimi\n${text}`,
                    position: position.top + window.scrollY,
                    element: node
                  });
                }
              }
            }
          }
        }
      }
      
      // If we couldn't extract any messages, return an error message
      if (messageItems.length === 0) {
        return "Could not extract chat content from Kimi. Try selecting and copying the content manually.";
      }
      
      // Sort messages by their vertical position in the document (top to bottom)
      messageItems.sort((a, b) => a.position - b.position);
      
      // Extract just the message texts in the correct order
      const orderedMessages = messageItems.map(item => item.text);
      
      // Add a header with conversation info
      const header = `# Kimi Chat Conversation\n\n`;
      
      // Join messages with horizontal rule for better visual separation
      return header + orderedMessages.join('\n\n---\n\n');
    } catch (error) {
      console.error('Error extracting Kimi content:', error);
      return "Error extracting chat content: " + error.message;
    }
  }

  /**
   * Initialize any platform-specific UI elements
   * @param {Function} onSyncClick - Callback when sync button is clicked
   */
  initUI(onSyncClick) {
    // Create a button for syncing
    const button = UIUtils.createFlomoButton(async () => {
      // Show loading state
      UIUtils.startSyncAnimation(button);
      
      try {
        // Extract content
        const chatTitle = this.extractTitle();
        const chatContent = this.extractContent();
        
        // Call the provided callback
        onSyncClick(chatTitle, chatContent, KimiPlatform.getPlatformName(), (success, errorMsg) => {
          const flomoLogoUrl = chrome.runtime.getURL('images/flomo-logo.png');
          
          if (success) {
            UIUtils.stopSyncAnimation(button, flomoLogoUrl);
            UIUtils.showSyncSuccessAnimation(button, flomoLogoUrl);
            UIUtils.showNotification('Chat synchronized to Flomo successfully', 'success');
          } else {
            UIUtils.stopSyncAnimation(button, flomoLogoUrl);
            UIUtils.showSyncErrorAnimation(button, flomoLogoUrl);
            console.error('Error syncing to Flomo:', errorMsg);
            UIUtils.showNotification('Failed to sync to Flomo: ' + (errorMsg || 'Unknown error'), 'error');
          }
        });
      } catch (error) {
        const flomoLogoUrl = chrome.runtime.getURL('images/flomo-logo.png');
        UIUtils.stopSyncAnimation(button, flomoLogoUrl);
        UIUtils.showSyncErrorAnimation(button, flomoLogoUrl);
        console.error('Error in Kimi sync process:', error);
        UIUtils.showNotification('Error: ' + error.message, 'error');
      }
    });
    
    // Add the button to the page
    document.body.appendChild(button);
  }
}

export default KimiPlatform; 