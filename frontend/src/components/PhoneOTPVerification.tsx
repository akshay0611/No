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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex flex-col justify-center p-4 relative overflow-hidden">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="absolute top-6 left-6 z-20 flex items-center justify-center w-12 h-12 bg-white shadow-lg rounded-xl border border-blue-100 hover:bg-blue-50 hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        aria-label="Go back"
      >
        <ArrowLeft className="w-5 h-5 text-blue-600" />
      </button>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/15 to-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-300/15 to-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-blue-200/10 to-blue-400/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-sm mx-auto relative z-10 px-2">
        {/* App Brand */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-blue-700 mb-2">
            AltQ
          </h1>
          <p className="text-blue-600/70 text-sm font-medium">Secure Verification</p>
        </div>

        {/* Main Verification Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-blue-100/50 overflow-hidden backdrop-blur-sm">
          {/* Header Section with Blue Accent */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 sm:p-6 text-center">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Verify Your Phone
            </h2>
            <p className="text-blue-100 text-sm">
              Enter the 6-digit code we sent to
            </p>
            <div className="flex items-center justify-center gap-2 mt-2">
              <p className="text-white font-semibold text-lg">
                {maskPhoneNumber(phoneNumber)}
              </p>
              <button
                onClick={onBack}
                className="text-blue-200 hover:text-white transition-colors ml-2"
                aria-label="Edit phone number"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {/* Debug OTP Display */}
            {currentDebugOTP && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl">
                <p className="text-sm text-blue-700 text-center font-medium">
                  🔐 Your verification code: <span className="font-bold text-xl text-blue-800">{currentDebugOTP}</span>
                </p>
                <p className="text-xs text-blue-600 text-center mt-2">
                  Development mode - code shown for testing
                </p>
                <button
                  onClick={() => {
                    setOtp(currentDebugOTP);
                    handleVerifyOTP(currentDebugOTP);
                  }}
                  className="mt-3 w-full px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  Auto-fill & Verify
                </button>
              </div>
            )}

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
                    <InputOTPGroup className="gap-1 sm:gap-2">
                      <InputOTPSlot index={0} className="w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-bold rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-blue-50/50 text-blue-800" />
                      <InputOTPSlot index={1} className="w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-bold rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-blue-50/50 text-blue-800" />
                      <InputOTPSlot index={2} className="w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-bold rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-blue-50/50 text-blue-800" />
                      <InputOTPSlot index={3} className="w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-bold rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-blue-50/50 text-blue-800" />
                      <InputOTPSlot index={4} className="w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-bold rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-blue-50/50 text-blue-800" />
                      <InputOTPSlot index={5} className="w-10 h-10 sm:w-12 sm:h-12 text-base sm:text-lg font-bold rounded-lg border-2 border-blue-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 bg-blue-50/50 text-blue-800" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                    <p className="text-sm text-red-600 text-center font-medium">
                      {error}
                    </p>
                  </div>
                )}
              </div>

              {/* Verify Button */}
              <Button
                onClick={() => handleVerifyOTP()}
                disabled={isLoading || otp.length !== 6}
                className="w-full h-12 sm:h-16 text-base sm:text-lg font-semibold rounded-xl sm:rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Verifying Code...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Verify & Continue</span>
                    <ArrowLeft className="w-5 h-5 rotate-180" />
                  </div>
                )}
              </Button>

              {/* Resend Section */}
              <div className="text-center">
                {canResend ? (
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-blue-600 font-semibold hover:text-blue-700 transition-colors flex items-center justify-center gap-2 mx-auto p-3 rounded-xl hover:bg-blue-50"
                  >
                    <RefreshCw className="w-5 h-5" />
                    Resend Verification Code
                  </button>
                ) : (
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-blue-600 text-sm font-medium">
                      Resend available in {resendCountdown} seconds
                    </p>
                  </div>
                )}
              </div>

              {/* Help Text */}
              <div className="text-center bg-gray-50 p-4 rounded-2xl">
                <p className="text-gray-600 text-sm font-medium">Didn't receive the code?</p>
                <p className="text-gray-500 text-sm mt-1">Check your SMS inbox or wait for the resend option</p>
              </div>
            </div>
          </div>
        </div>

        {/* Debug Info (remove in production) */}
        {!currentDebugOTP && (
          <div className="text-center mt-6 p-3 bg-white/80 rounded-xl border border-blue-100">
            <p className="text-xs text-blue-500 font-medium">Development Mode: Use 123456 or 000000 for testing</p>
          </div>
        )}
      </div>
    </div>
  );
}