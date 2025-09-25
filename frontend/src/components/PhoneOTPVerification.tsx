import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft, RefreshCw, MessageCircle, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhoneOTPVerificationProps {
  phoneNumber: string;
  onVerificationSuccess: (user: any, token: string) => void;
  onBack: () => void;
  debugOTP?: string; // For showing OTP in development
}

export default function PhoneOTPVerification({ 
  phoneNumber, 
  onVerificationSuccess, 
  onBack,
  debugOTP 
}: PhoneOTPVerificationProps) {
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [currentDebugOTP, setCurrentDebugOTP] = useState<string>('');
  const { toast } = useToast();
  const otpInputRef = useRef<HTMLInputElement>(null);

  // Get debug OTP from localStorage
  useEffect(() => {
    const storedOTP = localStorage.getItem('debug_otp');
    if (storedOTP) {
      setCurrentDebugOTP(storedOTP);
    }
  }, []);

  // Countdown timer for resend
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  // Auto-focus OTP input
  useEffect(() => {
    if (otpInputRef.current) {
      otpInputRef.current.focus();
    }
  }, []);

  const maskPhoneNumber = (phone: string) => {
    if (phone.length <= 4) return phone;
    const countryCode = phone.slice(0, 3);
    const lastFour = phone.slice(-4);
    const masked = phone.slice(3, -4).replace(/\d/g, '*');
    return `${countryCode}${masked}${lastFour}`;
  };

  const handleOTPChange = (value: string) => {
    setOtp(value);
    setError(null);
    
    // Auto-submit when OTP is complete
    if (value.length === 6) {
      handleVerifyOTP(value);
    }
  };

  const handleVerifyOTP = async (otpValue: string = otp) => {
    if (otpValue.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { api } = await import("../lib/api");
      const response = await api.auth.verifyOTP(phoneNumber, otpValue);
      
      // Clean up debug OTP
      localStorage.removeItem('debug_otp');
      
      toast({
        title: "Phone Verified!",
        description: "Welcome to AltQ!",
      });
      
      onVerificationSuccess(response.user, response.token);
    } catch (err: any) {
      setAttempts(prev => prev + 1);
      
      if (attempts >= 2) {
        setError("Too many failed attempts. Please request a new code.");
        setOtp("");
      } else {
        const errorMessage = err.message || "Invalid code. Please try again.";
        setError(errorMessage);
        setOtp("");
      }
      
      // Focus back to input
      setTimeout(() => {
        if (otpInputRef.current) {
          otpInputRef.current.focus();
        }
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    setIsLoading(true);
    setError(null);

    try {
      const { api } = await import("../lib/api");
      const response = await api.auth.sendOTP(phoneNumber);
      
      // Update debug OTP if available
      if (response.debug?.otp) {
        localStorage.setItem('debug_otp', response.debug.otp);
        setCurrentDebugOTP(response.debug.otp);
        toast({
          title: "OTP Resent!",
          description: `Your new verification code is: ${response.debug.otp}`,
          duration: 10000,
        });
      } else {
        localStorage.removeItem('debug_otp');
        setCurrentDebugOTP('');
        toast({
          title: "OTP Resent!",
          description: `New verification code sent to ${maskPhoneNumber(phoneNumber)}`,
        });
      }
      
      // Reset state
      setResendCountdown(30);
      setCanResend(false);
      setAttempts(0);
      setOtp("");
      
      // Focus input
      if (otpInputRef.current) {
        otpInputRef.current.focus();
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to resend OTP. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center px-4 py-4 border-b border-gray-100">
        <button
          onClick={onBack}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
        <h1 className="ml-4 text-lg font-semibold text-gray-900 font-bricolage">
          OTP Verification
        </h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-sm mx-auto">
          {/* Message */}
          <div className="text-center mb-12">
            <p className="text-gray-700 text-base font-medium font-bricolage mb-2">
              We have sent a verification code to
            </p>
            <div className="flex items-center justify-center gap-2">
              <p className="text-gray-900 font-semibold text-lg font-bricolage">
                {maskPhoneNumber(phoneNumber)}
              </p>
              <button
                onClick={onBack}
                className="text-blue-600 hover:text-blue-700 transition-colors ml-1"
                aria-label="Edit phone number"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Debug OTP Display */}
          {currentDebugOTP && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <p className="text-sm text-blue-700 text-center font-medium">
                🔐 Your verification code: <span className="font-bold text-lg text-blue-800">{currentDebugOTP}</span>
              </p>
              <p className="text-xs text-blue-600 text-center mt-2">
                Development mode - code shown for testing
              </p>
              <button
                onClick={() => {
                  setOtp(currentDebugOTP);
                  handleVerifyOTP(currentDebugOTP);
                }}
                className="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Auto-fill & Verify
              </button>
            </div>
          )}

          {/* OTP Input */}
          <div className="mb-12">
            <div className="flex justify-center mb-6">
              <InputOTP
                ref={otpInputRef}
                maxLength={6}
                value={otp}
                onChange={handleOTPChange}
                disabled={isLoading}
              >
                <InputOTPGroup className="gap-3">
                  <InputOTPSlot index={0} className="w-12 h-12 text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-0 bg-white text-gray-900" />
                  <InputOTPSlot index={1} className="w-12 h-12 text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-0 bg-white text-gray-900" />
                  <InputOTPSlot index={2} className="w-12 h-12 text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-0 bg-white text-gray-900" />
                  <InputOTPSlot index={3} className="w-12 h-12 text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-0 bg-white text-gray-900" />
                  <InputOTPSlot index={4} className="w-12 h-12 text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-0 bg-white text-gray-900" />
                  <InputOTPSlot index={5} className="w-12 h-12 text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:ring-0 bg-white text-gray-900" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <p className="text-sm text-red-600 text-center font-medium">
                  {error}
                </p>
              </div>
            )}

            {/* Resend Section */}
            <div className="text-center">
              <p className="text-gray-700 font-medium font-bricolage">
                Didn't get the OTP?{" "}
                {canResend ? (
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-blue-600 hover:text-blue-700 transition-colors font-semibold"
                  >
                    Resend SMS
                  </button>
                ) : (
                  <span className="text-gray-500">
                    Resend SMS in {resendCountdown}s
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Auto-verify when OTP is complete - no manual button needed */}
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-blue-600 font-medium">Verifying...</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-6 pb-8">
        <div className="max-w-sm mx-auto text-center">
          <button
            onClick={onBack}
            className="text-red-500 hover:text-red-600 transition-colors font-medium font-bricolage"
          >
            Go back to login methods
          </button>
        </div>

        {/* Debug Info (remove in production) */}
        {!currentDebugOTP && (
          <div className="text-center mt-4">
            <p className="text-xs text-gray-400">Development Mode: Use 123456 or 000000 for testing</p>
          </div>
        )}
      </div>
    </div>
  );
}