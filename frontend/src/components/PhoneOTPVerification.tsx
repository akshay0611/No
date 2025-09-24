import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Sparkles, ArrowLeft, RefreshCw, MessageCircle, Edit } from "lucide-react";
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
        description: "Welcome to SmartQ!",
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-20 flex items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-white/20 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-pink-300/10 to-purple-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* App Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            SmartQ
          </h1>
        </div>

        {/* Main Verification Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-purple-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Verify Phone Number
              </h2>
              <p className="text-gray-600 mb-2">
                We sent a 6-digit code to
              </p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-gray-800 font-semibold">
                  {maskPhoneNumber(phoneNumber)}
                </p>
                <button
                  onClick={onBack}
                  className="text-purple-600 hover:text-purple-700 transition-colors"
                  aria-label="Edit phone number"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>

              {/* Debug OTP Display */}
              {currentDebugOTP && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-700 text-center font-medium">
                    🔐 Your verification code: <span className="font-bold text-lg">{currentDebugOTP}</span>
                  </p>
                  <p className="text-xs text-green-600 text-center mt-1">
                    (Development mode - code shown for testing)
                  </p>
                  <button
                    onClick={() => {
                      setOtp(currentDebugOTP);
                      handleVerifyOTP(currentDebugOTP);
                    }}
                    className="mt-2 px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Auto-fill & Verify
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {/* OTP Input */}
              <div className="space-y-4">
                <div className="flex justify-center">
                  <InputOTP
                    ref={otpInputRef}
                    maxLength={6}
                    value={otp}
                    onChange={handleOTPChange}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} className="w-12 h-12 text-lg font-semibold rounded-xl border-2 border-gray-200 focus:border-purple-500" />
                      <InputOTPSlot index={1} className="w-12 h-12 text-lg font-semibold rounded-xl border-2 border-gray-200 focus:border-purple-500" />
                      <InputOTPSlot index={2} className="w-12 h-12 text-lg font-semibold rounded-xl border-2 border-gray-200 focus:border-purple-500" />
                      <InputOTPSlot index={3} className="w-12 h-12 text-lg font-semibold rounded-xl border-2 border-gray-200 focus:border-purple-500" />
                      <InputOTPSlot index={4} className="w-12 h-12 text-lg font-semibold rounded-xl border-2 border-gray-200 focus:border-purple-500" />
                      <InputOTPSlot index={5} className="w-12 h-12 text-lg font-semibold rounded-xl border-2 border-gray-200 focus:border-purple-500" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && (
                  <p className="text-sm text-red-500 text-center">
                    {error}
                  </p>
                )}
              </div>

              {/* Verify Button */}
              <Button
                onClick={() => handleVerifyOTP()}
                disabled={isLoading || otp.length !== 6}
                className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying...
                  </div>
                ) : (
                  "Verify & Continue"
                )}
              </Button>

              {/* Resend Section */}
              <div className="text-center">
                {canResend ? (
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-purple-600 font-medium hover:text-purple-700 transition-colors flex items-center justify-center gap-2 mx-auto"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resend Code
                  </button>
                ) : (
                  <p className="text-gray-500 text-sm">
                    Resend code in {resendCountdown}s
                  </p>
                )}
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-gray-500">
                <p>Didn't receive the code? Check your SMS inbox</p>
                <p className="mt-1">or try resending after the countdown</p>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info (remove in production) */}
        {!currentDebugOTP && (
          <div className="text-center mt-4 text-xs text-gray-400">
            <p>Debug: Use 123456 or 000000 for testing</p>
          </div>
        )}
      </div>
    </div>
  );
}