import { useEffect } from "react";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface BookingSuccessAnimationProps {
  onComplete: () => void;
  salonName?: string;
  serviceCount?: number;
}

export default function BookingSuccessAnimation({
  onComplete,
  salonName = "the salon",
  serviceCount = 1
}: BookingSuccessAnimationProps) {

  useEffect(() => {
    // Auto-complete after 3 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
      <div className="text-center px-6 max-w-md w-full">
        {/* Lottie Success Animation */}
        <div className="relative mb-6 flex items-center justify-center">
          <div className="w-72 h-72 md:w-80 md:h-80">
            <DotLottieReact
              src="https://lottie.host/74a25692-4b28-47a0-b0c8-4ff74667f72c/wH4IuK38iW.lottie"
              loop={false}
              autoplay
            />
          </div>
        </div>

        {/* Success Message
        <div className="space-y-4 animate-fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
            Booking Confirmed!
          </h2>
          <p className="text-xl md:text-2xl text-white/90 font-medium">
            You're all set! 🎉
          </p>
          <p className="text-white/80 text-base md:text-lg">
            {serviceCount > 1 ? `${serviceCount} services booked` : 'Service booked'} at <span className="font-semibold">{salonName}</span>
          </p>
          
         
        </div> */}
      </div>

      {/* <style>{`
        @keyframes fade-in {
          0% {
            opacity: 0;
          }
          100% {
            opacity: 1;
          }
        }

        @keyframes fade-in-up {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out 0.5s both;
        }
      `}</style> */}
    </div>
  );
}
