import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, TestTube } from 'lucide-react';
import { voiceNotificationService } from '../services/voiceNotificationService';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function VoiceNotificationSettings() {
  const [isEnabled, setIsEnabled] = useState(voiceNotificationService.isVoiceEnabled());
  const [volume, setVolume] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    // Load current settings
    const settings = localStorage.getItem('voice_notification_settings');
    if (settings) {
      try {
        const parsed = JSON.parse(settings);
        setVolume(parsed.volume ?? 1.0);
        setRate(parsed.rate ?? 1.0);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  const handleToggle = (checked: boolean) => {
    setIsEnabled(checked);
    if (checked) {
      voiceNotificationService.enable();
    } else {
      voiceNotificationService.disable();
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    voiceNotificationService.setVolume(newVolume);
  };

  const handleRateChange = (value: number[]) => {
    const newRate = value[0];
    setRate(newRate);
    voiceNotificationService.setRate(newRate);
  };

  const handleTest = () => {
    setIsTesting(true);
    voiceNotificationService.testVoice();
    setTimeout(() => setIsTesting(false), 3000);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          Voice Notifications
        </CardTitle>
        <CardDescription>
          Get spoken notifications when customers join your queue
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-sm font-medium">Enable Voice Notifications</div>
            <div className="text-xs text-gray-500">
              Hear spoken alerts when customers join
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
          />
        </div>

        {isEnabled && (
          <>
            {/* Volume Control - Compact */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Volume</label>
                <span className="text-xs text-gray-500">{Math.round(volume * 100)}%</span>
              </div>
              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                min={0}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Speech Rate Control - Compact */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Speech Speed</label>
                <span className="text-xs text-gray-500">
                  {rate === 1 ? 'Normal' : rate < 1 ? 'Slow' : 'Fast'}
                </span>
              </div>
              <Slider
                value={[rate]}
                onValueChange={handleRateChange}
                min={0.5}
                max={2}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Test Button - Compact */}
            <Button
              onClick={handleTest}
              disabled={isTesting}
              variant="outline"
              size="sm"
              className="w-full"
            >
              <TestTube className="w-4 h-4 mr-2" />
              {isTesting ? 'Playing...' : 'Test Voice'}
            </Button>

            {/* Info - Compact */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
              <p className="text-xs text-blue-900 leading-tight">
                <strong>Note:</strong> Voice notifications work when the app is open. 
                Keep the browser tab active for best results.
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
