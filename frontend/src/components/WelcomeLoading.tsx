import { useState, useEffect } from 'react';
import { Sparkles, User, MapPin, Calendar, CheckCircle } from 'lucide-react';

interface WelcomeLoadingProps {
  onComplete: () => void;
  userName?: string;
}

export default function WelcomeLoading({ onComplete, userName }: WelcomeLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const steps = [
    { icon: User, text: "Setting up your account", duration: 1000 },
    { icon: MapPin, text: "Finding nearby salons", duration: 1000 },
    { icon: Calendar, text: "Preparing your dashboard", duration: 1000 },
  ];

  useEffect(() => {
    let stepTimer: NodeJS.Timeout;
    let completeTimer: NodeJS.Timeout;

    const processSteps = () => {
      if (currentStep < steps.length) {
        stepTimer = setTimeout(() => {
          setCompletedSteps(prev => [...prev, currentStep]);
          setCurrentStep(prev => prev + 1);
        }, steps[currentStep].duration);
      } else {
        completeTimer = setTimeout(() => {
          onComplete();
        }, 500);
      }
    };

    processSteps();

    return () => {
      clearTimeout(stepTimer);
      clearTimeout(completeTimer);
    };
  }, [currentStep, onComplete]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center max-w-sm mx-auto px-6">
        {/* Logo */}
        <div className="mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl mb-6">
            <Sparkles className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            Welcome{userName ? ` ${userName}` : ''}!
          </h1>
          <p className="text-gray-600 text-base">
            We're setting up everything for you
          </p>
        </div>

        {/* Progress Steps */}
        <div className="space-y-4 mb-8">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(index);
            const isCurrent = currentStep === index;
            const isPending = currentStep < index;
            const StepIcon = step.icon;

            return (
              <div
                key={index}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 ${
                  isCompleted 
                    ? 'bg-green-50 border-2 border-green-200' 
                    : isCurrent 
                    ? 'bg-purple-50 border-2 border-purple-200' 
                    : 'bg-gray-50 border-2 border-gray-200'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                    isCompleted
                      ? 'bg-green-500'
                      : isCurrent
                      ? 'bg-purple-500'
                      : 'bg-gray-300'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <StepIcon 
                      className={`w-5 h-5 text-white ${
                        isCurrent ? 'animate-pulse' : ''
                      }`} 
                    />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p
                    className={`font-medium transition-colors duration-500 ${
                      isCompleted
                        ? 'text-green-700'
                        : isCurrent
                        ? 'text-purple-700'
                        : 'text-gray-500'
                    }`}
                  >
                    {step.text}
                  </p>
                </div>
                {isCurrent && (
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            );
          })}
        </div>

        {/* Loading Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 h-2 rounded-full transition-all duration-1000 ease-out"
            style={{
              width: `${((completedSteps.length + (currentStep < steps.length ? 0.5 : 0)) / steps.length) * 100}%`
            }}
          />
        </div>

        <p className="text-sm text-gray-500">
          Almost ready...
        </p>
      </div>
    </div>
  );
}