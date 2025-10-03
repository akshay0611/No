import { useState, useEffect, useRef } from "react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { ArrowLeft, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhoneOTPVerificationProps {
  phoneNumber: string;
  onVerificationSuccess: (user: any, token: string) => void;
  onBack: () => void;
}

export default function PhoneOTPVerification({
  phoneNumber,
  onVerificationSuccess,
  onBack
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
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-12 relative overflow-hidden">
        <div className="max-w-md mx-auto relative z-10">
          {/* Back Button */}
          

          {/* Logo */}
          <div className="mb-6 ">
            <img
              src="/loadlogo.png"
              alt="YEF Samrat Logo"
              className="h-20 w-auto brightness-0 invert"
            />
          </div>

          {/* Banner Content */}
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-2">Verify Your Phone</h2>
            <h3 className="text-xl font-bold mb-3">Enter Verification Code</h3>
            <p className="text-teal-100 text-sm">We've sent a 6-digit code to your phone</p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-800/20 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Form Section */}
      <div className="px-6 py-8">
        <div className="max-w-md mx-auto">
          {/* Welcome Section */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold font-bricolage text-gray-900 mb-2">Verification Code</h1>
            <p className="text-gray-600 text-sm mb-4">
              We have sent a verification code to
            </p>
            <div className="flex items-center justify-center gap-2 mb-6">
              <p className="text-gray-900 font-semibold text-lg font-bricolage">
                {maskPhoneNumber(phoneNumber)}
              </p>
              <button
                onClick={onBack}
                className="text-teal-600 hover:text-teal-700 transition-colors ml-1"
                aria-label="Edit phone number"
              >
                <Edit className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Debug OTP Display */}
          {currentDebugOTP && (
            <div className="mb-8 p-4 bg-teal-50 border border-teal-200 rounded-xl">
              <p className="text-sm text-teal-700 text-center font-medium">
                🔐 Your verification code: <span className="font-bold text-lg text-teal-800">{currentDebugOTP}</span>
              </p>
              <p className="text-xs text-teal-600 text-center mt-2">
                Development mode - code shown for testing
              </p>
              <button
                onClick={() => {
                  setOtp(currentDebugOTP);
                  handleVerifyOTP(currentDebugOTP);
                }}
                className="mt-3 w-full px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors"
              >
                Auto-fill & Verify
              </button>
            </div>
          )}

          {/* OTP Input */}
          <div className="mb-8">
            <div className="flex justify-center mb-6">
              <InputOTP
                ref={otpInputRef}
                maxLength={6}
                value={otp}
                onChange={handleOTPChange}
                disabled={isLoading}
              >
                <InputOTPGroup className="gap-3">
                  <InputOTPSlot index={0} className="w-12 h-12 text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-teal-500 focus:ring-0 bg-gray-100 text-gray-900" />
                  <InputOTPSlot index={1} className="w-12 h-12 text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-teal-500 focus:ring-0 bg-gray-100 text-gray-900" />
                  <InputOTPSlot index={2} className="w-12 h-12 text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-teal-500 focus:ring-0 bg-gray-100 text-gray-900" />
                  <InputOTPSlot index={3} className="w-12 h-12 text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-teal-500 focus:ring-0 bg-gray-100 text-gray-900" />
                  <InputOTPSlot index={4} className="w-12 h-12 text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-teal-500 focus:ring-0 bg-gray-100 text-gray-900" />
                  <InputOTPSlot index={5} className="w-12 h-12 text-xl font-bold rounded-lg border-2 border-gray-300 focus:border-teal-500 focus:ring-0 bg-gray-100 text-gray-900" />
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
              <p className="text-gray-600 font-medium">
                Didn't get the OTP?{" "}
                {canResend ? (
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-teal-600 hover:text-teal-700 transition-colors font-semibold"
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
              <div className="w-6 h-6 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-teal-600 font-medium">Verifying...</span>
            </div>
          )}

          {/* Back to Login */}
          <div className="text-center mt-8">
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-700 transition-colors font-medium"
            >
              ← Back to phone number
            </button>
          </div>

          {/* Debug Info (remove in production) */}
          {!currentDebugOTP && (
            <div className="text-center mt-6">
              <p className="text-xs text-gray-400">Development Mode: Use 123456 or 000000 for testing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}