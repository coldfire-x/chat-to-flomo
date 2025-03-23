/**
 * Platform Registry - Manages all platform implementations
 */

import OpenAIPlatform from '../platforms/openai/index.js';
import ClaudePlatform from '../platforms/claude/index.js';
import KimiPlatform from '../platforms/kimi/index.js';

// Array of all available platform classes
const platforms = [
  OpenAIPlatform,
  ClaudePlatform,
  KimiPlatform
  // Add more platforms here as they are implemented
];

/**
 * Detects the current platform based on the URL
 * @param {string} url - The URL to check
 * @returns {class|null} - The platform class that matches the URL, or null if none match
 */
export function detectPlatform(url) {
  for (const PlatformClass of platforms) {
    if (PlatformClass.isMatch(url)) {
      return PlatformClass;
    }
  }
  return null;
}

/**
 * Returns all available platforms
 * @returns {Array} - Array of platform classes
 */
export function getAllPlatforms() {
  return platforms;
}

/**
 * Add a new platform to the registry
 * @param {class} PlatformClass - The platform class to add
 */
export function registerPlatform(PlatformClass) {
  if (!platforms.includes(PlatformClass)) {
    platforms.push(PlatformClass);
  }
} 