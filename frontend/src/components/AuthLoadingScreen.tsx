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
    <div 
    className="fixed inset-0 flex items-center justify-center z-50 bg-no-repeat"
    style={{ backgroundImage: "url('/altQ.png')", backgroundSize: "100% 100%", backgroundPosition: "center" }}
  >
   
      
      {/* Content overlay */}
      <div className="relative text-center">
        {/* Loading Message */}
        {/* <div className="flex items-center justify-center space-x-3">
          <CurrentIcon className="h-5 w-5 text-white animate-spin" />
          <p className="text-white text-lg font-medium">
            {messages[currentMessage].text}
          </p>
        </div> */}

        {/* Loading Dots */}
        {/* <div className="flex justify-center space-x-2 mt-8">
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
        </div> */}
      </div>
    </div>
  );
}