/**
 * UI Utilities for all platforms
 */

/**
 * Creates a floating button with the Flomo logo
 * @param {Function} onClick - Callback function when button is clicked
 * @returns {HTMLElement} - The created button element
 */
export function createFlomoButton(onClick) {
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
  button.addEventListener('click', onClick);

  return button;
}

/**
 * Shows a loading animation on the button
 * @param {HTMLElement} button - The button element
 */
export function startSyncAnimation(button) {
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

/**
 * Restores the button to its original state
 * @param {HTMLElement} button - The button element
 * @param {string} logoUrl - URL to the logo image
 */
export function stopSyncAnimation(button, logoUrl) {
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

/**
 * Shows a success animation on the button
 * @param {HTMLElement} button - The button element
 * @param {string} logoUrl - URL to the logo image
 */
export function showSyncSuccessAnimation(button, logoUrl) {
  // Temporarily change icon to checkmark
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 13L9 17L19 7" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  
  // Change color to success green
  button.style.backgroundColor = '#4CAF50';
  
  // Restore original after animation
  setTimeout(() => {
    stopSyncAnimation(button, logoUrl);
  }, 2000);
}

/**
 * Shows an error animation on the button
 * @param {HTMLElement} button - The button element
 * @param {string} logoUrl - URL to the logo image
 */
export function showSyncErrorAnimation(button, logoUrl) {
  // Temporarily change icon to X
  button.innerHTML = `
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 6L6 18" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M6 6L18 18" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  
  // Change color to error red
  button.style.backgroundColor = '#F44336';
  
  // Restore original after animation
  setTimeout(() => {
    stopSyncAnimation(button, logoUrl);
  }, 2000);
}

/**
 * Shows a notification on the page
 * @param {string} message - The message to show
 * @param {string} type - The type of notification ('success' or 'error')
 */
export function showNotification(message, type) {
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