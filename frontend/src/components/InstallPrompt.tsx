import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { usePWA } from '../hooks/usePWA';

export function InstallPrompt() {
  const { showInstallPrompt, canPromptInstall, promptInstall, dismissInstallPrompt } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show prompt with a slight delay for better UX
    if (showInstallPrompt) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showInstallPrompt]);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      console.log('User accepted the install prompt');
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    dismissInstallPrompt();
    setIsVisible(false);
  };

  if (!isVisible || !showInstallPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96 animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Install SmartQ</CardTitle>
                <CardDescription className="text-sm">
                  Get quick access from your home screen
                </CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 -mt-1 -mr-2"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Instant access to your queues</li>
            <li>• Receive notifications even when closed</li>
            <li>• Works offline</li>
          </ul>
          <div className="flex gap-2">
            {canPromptInstall ? (
              <Button onClick={handleInstall} className="flex-1">
                Install App
              </Button>
            ) : (
              <div className="text-sm text-muted-foreground">
                To install, tap the share button and select "Add to Home Screen"
              </div>
            )}
            <Button variant="outline" onClick={handleDismiss}>
              Not Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
