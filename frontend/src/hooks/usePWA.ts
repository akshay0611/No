import { useEffect, useState } from 'react';
import {
  initializePWA,
  isPWAInstalled,
  shouldShowInstallPrompt,
  markInstallPromptShown
} from '../utils/pwa';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWA(userId?: string) {
  const [isInstalled, setIsInstalled] = useState(isPWAInstalled());
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize PWA on mount
    if (!isInitialized) {
      initializePWA(userId).then(() => {
        setIsInitialized(true);
      });
    }
  }, [userId, isInitialized]);

  useEffect(() => {
    // Check if should show install prompt
    if (shouldShowInstallPrompt() && !isInstalled) {
      setShowInstallPrompt(true);
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isInstalled]);

  const promptInstall = async () => {
    if (!deferredPrompt) {
      return false;
    }

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice;

    // Mark as prompted
    markInstallPromptShown();
    setShowInstallPrompt(false);

    // Clear the deferred prompt
    setDeferredPrompt(null);

    return outcome === 'accepted';
  };

  const dismissInstallPrompt = () => {
    markInstallPromptShown();
    setShowInstallPrompt(false);
  };

  return {
    isInstalled,
    showInstallPrompt,
    canPromptInstall: !!deferredPrompt,
    promptInstall,
    dismissInstallPrompt
  };
}
