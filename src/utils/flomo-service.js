/**
 * Flomo Service - Handles communication with the Flomo API
 */

/**
 * Sends content to Flomo via the API
 * @param {string} apiKey - The Flomo API key
 * @param {string} content - The content to send
 * @returns {Promise<Object>} - The response from the Flomo API
 */
export async function sendToFlomo(apiKey, content) {
  try {
    const response = await fetch(apiKey, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: content
      })
    });
    
    const responseData = await response.json();
    return responseData;
  } catch (error) {
    console.error('Error sending to Flomo:', error);
    throw error;
  }
}

/**
 * Formats the content for Flomo, including title and tags
 * @param {string} chatTitle - The title of the chat
 * @param {string} chatContent - The content of the chat
 * @param {string} platform - The platform name
 * @param {string} tagPrefix - The tag prefix to use
 * @returns {string} - The formatted content
 */
export function formatFlomoContent(chatTitle, chatContent, platform, tagPrefix = '#ai-chat') {
  let content = '';
  
  // Add title
  if (chatTitle) {
    content += `# ${chatTitle}\n\n`;
  }
  
  // Add tag
  let tag = `${tagPrefix}/${platform}`;
  if (chatTitle) {
    // Format the title to be URL-friendly for tag while preserving Chinese and other characters
    // Only replace spaces with hyphens and remove problematic characters that won't work in tags
    const formattedTitle = chatTitle
      .replace(/\s+/g, '-')
      .replace(/['"!@#$%^&*()+=[\]{};:,.<>/?\\|]/g, ''); // Remove only punctuation and symbols
    tag += `/${formattedTitle}`;
  }
  console.log(tag);
  content += `${tag}\n\n`;
  
  // Add chat content
  content += chatContent;
  
  return content;
} 