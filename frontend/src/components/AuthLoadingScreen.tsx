import { useState, useEffect } from 'react';
import { Sparkles, Search, MapPin } from 'lucide-react';

interface AuthLoadingScreenProps {
  onComplete: () => void;
}

export default function AuthLoadingScreen({ onComplete }: AuthLoadingScreenProps) {
  const [currentMessage, setCurrentMessage] = useState(0);

  const messages = [
    { icon: Search, text: "Finding best salons..." },
    { icon: MapPin, text: "Locating nearby services..." },
    { icon: Sparkles, text: "Preparing your experience..." }
  ];

  useEffect(() => {
    // Cycle through messages every 1 second
    const messageInterval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 1000);

    // Complete loading after 3 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => {
      clearInterval(messageInterval);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  const CurrentIcon = messages[currentMessage].icon;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 flex items-center justify-center z-50">
      <div className="text-center">
        {/* Logo */}
        <div className="mb-12">
          <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto shadow-2xl mb-6 animate-pulse">
            <Sparkles className="h-10 w-10 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-white tracking-wide mb-2">
            Smart<span className="text-yellow-300">Q</span>
          </h1>
          <p className="text-purple-100 text-sm font-medium">
            Skip the wait, book your spot
          </p>
        </div>

        {/* Loading Message */}
        <div className="flex items-center justify-center space-x-3">
          <CurrentIcon className="h-5 w-5 text-white animate-spin" />
          <p className="text-white text-lg font-medium">
            {messages[currentMessage].text}
          </p>
        </div>

        {/* Loading Dots */}
        <div className="flex justify-center space-x-2 mt-8">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentMessage 
                  ? 'bg-white scale-125' 
                  : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}