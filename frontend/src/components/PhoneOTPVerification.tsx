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

  useEffect(() => {
    const storedOTP = localStorage.getItem('debug_otp');
    if (storedOTP) {
      setCurrentDebugOTP(storedOTP);
    }
  }, []);

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

      setResendCountdown(30);
      setCanResend(false);
      setAttempts(0);
      setOtp("");

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
    <div className="fixed inset-0 z-50 bg-black overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/4.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
       
      </div>

      {/* Content */}
      <div className="relative flex flex-col h-full">
        {/* Back Button */}
        <div className="absolute top-6 left-6 z-20">
          <button
            onClick={onBack}
            className="text-white/80 hover:text-white p-2 rounded-full bg-white/10 backdrop-blur-sm transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

       

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-8">
          {/* Logo */}
          <div className="flex justify-center mb-12">
            <img
              src="/loadlogo.png"
              alt="SmartQ Logo"
              className="h-24 w-auto drop-shadow-2xl"
            />
          </div>

          {/* OTP Card */}
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl px-6 py-8 shadow-2xl border border-white/20">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Code</h1>
              <p className="text-gray-500 text-sm leading-relaxed mb-3">
                We've sent a 6-digit code to
              </p>
              <div className="flex items-center justify-center gap-2">
                <p className="text-gray-900 font-semibold">
                  {maskPhoneNumber(phoneNumber)}
                </p>
                <button
                  onClick={onBack}
                  className="text-teal-600 hover:text-teal-700 transition-colors"
                  aria-label="Edit phone number"
                >
                  <Edit className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Debug OTP Display */}
            {currentDebugOTP && (
              <div className="mb-6 p-3 bg-teal-50 border border-teal-200 rounded-xl">
                <p className="text-xs text-teal-700 text-center font-medium">
                  🔐 Code: <span className="font-bold text-base text-teal-800">{currentDebugOTP}</span>
                </p>
                <button
                  onClick={() => {
                    setOtp(currentDebugOTP);
                    handleVerifyOTP(currentDebugOTP);
                  }}
                  className="mt-2 w-full px-3 py-2 bg-teal-600 text-white text-xs font-medium rounded-lg hover:bg-teal-700 transition-colors"
                >
                  Auto-fill & Verify
                </button>
              </div>
            )}

            {/* OTP Input */}
            <div className="mb-6">
              <div className="flex justify-center mb-4">
                <InputOTP
                  ref={otpInputRef}
                  maxLength={6}
                  value={otp}
                  onChange={handleOTPChange}
                  disabled={isLoading}
                >
                  <InputOTPGroup className="gap-2">
                    <InputOTPSlot index={0} className="w-10 h-12 text-lg font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-gray-50 text-gray-900" />
                    <InputOTPSlot index={1} className="w-10 h-12 text-lg font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-gray-50 text-gray-900" />
                    <InputOTPSlot index={2} className="w-10 h-12 text-lg font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-gray-50 text-gray-900" />
                    <InputOTPSlot index={3} className="w-10 h-12 text-lg font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-gray-50 text-gray-900" />
                    <InputOTPSlot index={4} className="w-10 h-12 text-lg font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-gray-50 text-gray-900" />
                    <InputOTPSlot index={5} className="w-10 h-12 text-lg font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-gray-50 text-gray-900" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl mb-4">
                  <p className="text-xs text-red-600 text-center font-medium">
                    {error}
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="flex items-center justify-center py-3">
                  <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-teal-600 font-medium text-sm">Verifying...</span>
                </div>
              )}
            </div>

            {/* Resend Section */}
            <div className="text-center pt-6 border-t border-gray-200">
              <p className="text-gray-500 text-sm">
                Didn't receive code?{" "}
                {canResend ? (
                  <button
                    onClick={handleResendOTP}
                    disabled={isLoading}
                    className="text-teal-600 hover:text-teal-700 transition-colors font-semibold"
                  >
                    Resend
                  </button>
                ) : (
                  <span className="text-gray-400">
                    Resend in {resendCountdown}s
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Trust Badge */}
          <div className="text-center mt-6">
            <p className="text-white/60 text-xs">
              🔒 Your data is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
