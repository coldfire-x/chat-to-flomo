/**
 * Platform Interface - Base class for all platform implementations
 * This defines the interface that all platform implementations must adhere to
 */
class PlatformInterface {
  /**
   * Check if the current URL matches this platform
   * @param {string} url - The URL to check
   * @returns {boolean} - True if this platform supports the URL
   */
  static isMatch(url) {
    throw new Error('isMatch must be implemented by platform class');
  }

  /**
   * Get the name of the platform
   * @returns {string} - The platform name
   */
  static getPlatformName() {
    throw new Error('getPlatformName must be implemented by platform class');
  }

  /**
   * Extract the chat title from the page
   * @param {string} userProvidedTitle - Optional title provided by the user
   * @returns {string} - The extracted title
   */
  extractTitle(userProvidedTitle = '') {
    throw new Error('extractTitle must be implemented by platform class');
  }

  /**
   * Extract the chat content from the page
   * @returns {string} - The extracted content
   */
  extractContent() {
    throw new Error('extractContent must be implemented by platform class');
  }

  /**
   * Initialize any platform-specific UI elements
   * @param {Function} onSyncClick - Callback when sync button is clicked
   */
  initUI(onSyncClick) {
    throw new Error('initUI must be implemented by platform class');
  }
}

export default PlatformInterface; 