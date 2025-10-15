import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX, Play, Bell, Sparkles } from 'lucide-react';
import { voiceNotificationService } from '../services/voiceNotificationService';

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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/30">
          <Bell className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            Voice Notifications
            {isEnabled && <Sparkles className="w-4 h-4 text-teal-500" />}
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Get spoken notifications when customers join your queue
          </p>
        </div>
      </div>

      {/* Enable Toggle Card */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isEnabled ? (
              <Volume2 className="w-5 h-5 text-teal-600" />
            ) : (
              <VolumeX className="w-5 h-5 text-gray-400" />
            )}
            <div>
              <div className="text-sm font-medium text-gray-900">Enable Voice Alerts</div>
              <div className="text-xs text-gray-500 mt-0.5">
                {isEnabled ? 'Voice notifications are active' : 'Turn on to hear alerts'}
              </div>
            </div>
          </div>
          <Switch
            checked={isEnabled}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-teal-600"
          />
        </div>
      </div>

      {/* Settings Panel */}
      {isEnabled && (
        <div className="space-y-5 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Volume Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-gray-400" />
                Volume
              </label>
              <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <Slider
              value={[volume]}
              onValueChange={handleVolumeChange}
              min={0}
              max={1}
              step={0.1}
              className="w-full [&_[role=slider]]:bg-teal-600 [&_[role=slider]]:border-teal-600"
            />
          </div>

          {/* Speech Speed Control */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Play className="w-4 h-4 text-gray-400" />
                Speech Speed
              </label>
              <span className="text-sm font-semibold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                {rate === 1 ? 'Normal' : rate < 1 ? 'Slow' : 'Fast'}
              </span>
            </div>
            <Slider
              value={[rate]}
              onValueChange={handleRateChange}
              min={0.5}
              max={2}
              step={0.1}
              className="w-full [&_[role=slider]]:bg-teal-600 [&_[role=slider]]:border-teal-600"
            />
          </div>

          {/* Test Button */}
          <Button
            onClick={handleTest}
            disabled={isTesting}
            className="w-full bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg shadow-teal-500/30 rounded-xl h-11 font-medium transition-all duration-200"
          >
            {isTesting ? (
              <>
                <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Playing Test...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Test Voice
              </>
            )}
          </Button>

          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5">
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-blue-900 mb-1">
                  How it works
                </p>
                <p className="text-xs text-blue-700 leading-relaxed">
                  Voice notifications work when the app is open. Keep the browser tab active for instant alerts when customers join your queue.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
