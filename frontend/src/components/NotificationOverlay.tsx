import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, CheckCircle } from "lucide-react";
import type { Service } from "../types";

interface QueueNotification {
  queueId: string;
  salonName: string;
  salonAddress: string;
  estimatedMinutes: number;
  services: Service[];
  salonLocation: {
    latitude: number;
    longitude: number;
  };
}

interface NotificationOverlayProps {
  isOpen: boolean;
  notification: QueueNotification;
  onAccept: () => void;
}

export default function NotificationOverlay({
  isOpen,
  notification,
  onAccept,
}: NotificationOverlayProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Play notification sound
      if (!audioRef.current) {
        audioRef.current = new Audio('/notification.mp3');
      }
      audioRef.current.play().catch((error) => {
        console.log('Failed to play notification sound:', error);
      });

      // Prevent body scroll
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-md my-auto bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-500 px-6 py-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 backdrop-blur-sm">
            <Clock className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Your Turn is Coming!</h2>
          <p className="text-teal-50 text-sm">Please prepare to head to the salon</p>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Salon Info */}
          <div className="space-y-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {notification.salonName}
              </h3>
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{notification.salonAddress}</span>
              </div>
            </div>

            {/* Estimated Time */}
            <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-5 h-5 text-teal-600" />
                <div className="text-center">
                  <p className="text-sm text-gray-600">Estimated arrival time</p>
                  <p className="text-2xl font-bold text-teal-600">
                    {notification.estimatedMinutes} minutes
                  </p>
                </div>
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Your Services</h4>
              <div className="space-y-2">
                {notification.services.map((service) => (
                  <div
                    key={service.id}
                    className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-teal-600" />
                      <span className="text-sm text-gray-700">{service.name}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      ₹{service.price}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="space-y-4">
            <Button
              onClick={onAccept}
              className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg"
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              I'm On My Way
            </Button>

            {/* Guidance Text */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 space-y-2">
              <p className="text-xs sm:text-sm font-medium text-blue-900">
                📍 Next Steps:
              </p>
              <ol className="text-xs text-blue-700 space-y-1 sm:space-y-1.5 ml-4 list-decimal leading-relaxed">
                <li>Click "I'm On My Way" to go to your queue page</li>
                <li>Use the "Show Map" button to get directions</li>
                <li>Click "I've Arrived" when you reach the salon</li>
              </ol>
            </div>
          </div>

          {/* Warning */}
          <p className="text-xs text-center text-amber-600 font-medium pb-2">
            ⚠️ Please arrive within {notification.estimatedMinutes} minutes to avoid being marked as no-show
          </p>
        </div>
      </div>
    </div>
  );
}
