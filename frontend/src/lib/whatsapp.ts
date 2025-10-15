/**
 * WhatsApp utility functions
 */

/**
 * Detect if user is on mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Generate WhatsApp URL based on device type
 * - Mobile: Opens WhatsApp app directly
 * - Desktop: Opens WhatsApp Web
 * 
 * @param phoneNumber - Phone number in international format (e.g., +1234567890)
 * @param message - Pre-filled message text
 * @returns WhatsApp URL
 */
export function getWhatsAppUrl(phoneNumber: string, message: string): string {
  // Format phone number (remove all non-numeric characters)
  const formattedPhone = phoneNumber.replace(/[^0-9]/g, '');
  
  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);
  
  // Detect device and return appropriate URL
  if (isMobileDevice()) {
    // Mobile: Use wa.me (opens WhatsApp app directly)
    return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  } else {
    // Desktop: Use direct WhatsApp Web chat URL (bypasses api.whatsapp.com redirect)
    // This format opens directly in WhatsApp Web without the "Open app" prompt
    return `https://web.whatsapp.com/send/?phone=${formattedPhone}&text=${encodedMessage}&type=phone_number&app_absent=0`;
  }
}

/**
 * Copy message to clipboard
 * Useful as fallback if WhatsApp Web is already open
 */
export async function copyMessageToClipboard(message: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(message);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

/**
 * Open WhatsApp with pre-filled message
 * 
 * @param phoneNumber - Phone number in international format
 * @param message - Pre-filled message text
 * @param options - Additional options
 * @returns Promise that resolves when action is complete
 */
export async function openWhatsApp(
  phoneNumber: string, 
  message: string,
  options?: {
    copyToClipboard?: boolean; // Also copy message to clipboard
    reuseTab?: boolean; // Try to reuse existing WhatsApp tab
  }
): Promise<void> {
  const url = getWhatsAppUrl(phoneNumber, message);
  
  // Copy to clipboard if requested (useful if WhatsApp Web already open)
  if (options?.copyToClipboard) {
    await copyMessageToClipboard(message);
  }
  
  // Open WhatsApp
  if (!isMobileDevice() && options?.reuseTab) {
    // Desktop: Try to reuse existing WhatsApp Web tab
    const whatsappWindow = window.open(url, 'whatsapp_chat');
    
    // If window was blocked or failed, try regular open
    if (!whatsappWindow) {
      window.open(url, '_blank');
    }
  } else {
    // Mobile or new tab: Open in new context
    window.open(url, '_blank');
  }
}
