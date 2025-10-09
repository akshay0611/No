import { useState } from "react";
import { Mail, MessageCircle, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

interface OTPVerificationProps {
  userId: string;
  email: string;
  phone?: string;
  onVerificationComplete: () => void;
}

export default function OTPVerification({ userId, email, phone, onVerificationComplete }: OTPVerificationProps) {
  const [emailOTP, setEmailOTP] = useState("");
  const [phoneOTP, setPhoneOTP] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [phoneSent, setPhoneSent] = useState(false);
  const [displayedPhoneOTP, setDisplayedPhoneOTP] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState({ email: false, phone: false });
  const [generalError, setGeneralError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleEmailOTPChange = (value: string) => {
    setEmailOTP(value);
    setGeneralError(null);
    
    if (value.length === 6 && !loading) {
      setTimeout(() => {
        verifyEmailOTP(value);
      }, 300);
    }
  };

  const handlePhoneOTPChange = (value: string) => {
    setPhoneOTP(value);
    setGeneralError(null);
    
    if (value.length === 6 && !loading) {
      setTimeout(() => {
        verifyPhoneOTP(value);
      }, 300);
    }
  };

  const sendEmailOTP = async () => {
    setLoading(true);
    setGeneralError(null);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
      const response = await fetch(`${baseURL}/api/auth/send-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        setEmailSent(true);
        toast({
          title: "Email OTP Sent",
          description: "Check your email for the verification code.",
        });
      } else {
        const error = await response.json();
        setGeneralError(error.message || "Failed to send email OTP. Please try again.");
      }
    } catch (error: any) {
      setGeneralError(error.message || "Failed to send email OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sendPhoneOTP = async () => {
    if (!phone) return;
    
    setLoading(true);
    setGeneralError(null);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
      const response = await fetch(`${baseURL}/api/auth/send-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setPhoneSent(true);
        setDisplayedPhoneOTP(data.otp);
        toast({
          title: "SMS OTP Sent",
          description: "Check your SMS inbox for the verification code.",
        });
      } else {
        const error = await response.json();
        setGeneralError(error.message || "Failed to send SMS OTP. Please try again.");
      }
    } catch (error: any) {
      setGeneralError(error.message || "Failed to send SMS OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailOTP = async (otpValue?: string) => {
    const otp = otpValue || emailOTP;
    if (!otp || otp.length !== 6) {
      setGeneralError("Please enter a 6-digit OTP.");
      return;
    }

    setLoading(true);
    setGeneralError(null);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
      const response = await fetch(`${baseURL}/api/auth/verify-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
      });

      if (response.ok) {
        setEmailVerified(true);
        toast({
          title: "Email Verified",
          description: "Your email has been successfully verified.",
        });
        
        if (phoneVerified || !phone) {
          onVerificationComplete();
        }
      } else {
        const error = await response.json();
        setGeneralError(error.message || "Failed to verify email OTP. Please try again.");
      }
    } catch (error: any) {
      setGeneralError(error.message || "Failed to verify email OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyPhoneOTP = async (otpValue?: string) => {
    const otp = otpValue || phoneOTP;
    if (!otp || otp.length !== 6) {
      setGeneralError("Please enter a 6-digit OTP.");
      return;
    }

    setLoading(true);
    setGeneralError(null);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
      const response = await fetch(`${baseURL}/api/auth/verify-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, otp }),
      });

      if (response.ok) {
        setPhoneVerified(true);
        toast({
          title: "Phone Verified",
          description: "Your phone number has been successfully verified.",
        });
        
        if (emailVerified) {
          onVerificationComplete();
        }
      } else {
        const error = await response.json();
        setGeneralError(error.message || "Failed to verify phone OTP. Please try again.");
      }
    } catch (error: any) {
      setGeneralError(error.message || "Failed to verify phone OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendEmailOTP = async () => {
    setResendLoading({ ...resendLoading, email: true });
    setGeneralError(null);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
      const response = await fetch(`${baseURL}/api/auth/resend-email-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        toast({
          title: "Email OTP Resent",
          description: "A new verification code has been sent to your email.",
        });
      } else {
        const error = await response.json();
        setGeneralError(error.message || "Failed to resend email OTP. Please try again.");
      }
    } catch (error: any) {
      setGeneralError(error.message || "Failed to resend email OTP. Please try again.");
    } finally {
      setResendLoading({ ...resendLoading, email: false });
    }
  };

  const resendPhoneOTP = async () => {
    setResendLoading({ ...resendLoading, phone: true });
    setGeneralError(null);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
      const response = await fetch(`${baseURL}/api/auth/resend-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (response.ok) {
        const data = await response.json();
        setDisplayedPhoneOTP(data.otp);
        toast({
          title: "SMS OTP Resent",
          description: "A new verification code has been sent via SMS.",
        });
      } else {
        const error = await response.json();
        setGeneralError(error.message || "Failed to resend SMS OTP. Please try again.");
      }
    } catch (error: any) {
      setGeneralError(error.message || "Failed to resend SMS OTP. Please try again.");
    } finally {
      setResendLoading({ ...resendLoading, phone: false });
    }
  };

  const totalSteps = phone ? 2 : 1;
  const completedSteps = (emailVerified ? 1 : 0) + (phoneVerified ? 1 : 0);
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src="/4.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
   
      </div>

      {/* Content */}
      <div className="relative flex flex-col h-full overflow-y-auto">
        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/loadlogo.png"
              alt="SmartQ Logo"
              className="h-24 w-auto drop-shadow-2xl"
            />
          </div>

          {/* Verification Card */}
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl px-6 py-8 shadow-2xl border border-white/20">
            {/* Header */}
            <div className="mb-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Account</h1>
              <p className="text-gray-500 text-sm leading-relaxed">
                Complete verification to secure your account
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                <span>Progress</span>
                <span>{completedSteps}/{totalSteps} completed</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-teal-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>

            {/* Error Alert */}
            {generalError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-600">{generalError}</p>
              </div>
            )}

            {/* Email Verification */}
            <div className={`mb-4 p-4 rounded-xl border-2 transition-all ${
              emailVerified 
                ? 'bg-green-50 border-green-500' 
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  emailVerified ? 'bg-green-500' : 'bg-teal-500'
                }`}>
                  {emailVerified ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : (
                    <Mail className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm">Email Verification</h3>
                  <p className="text-xs text-gray-500 truncate">{email}</p>
                </div>
                {emailVerified && (
                  <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-lg">
                    Verified
                  </span>
                )}
              </div>

              {!emailSent ? (
                <button
                  onClick={sendEmailOTP}
                  disabled={loading || emailVerified}
                  className="w-full h-10 text-white font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
                >
                  {loading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </div>
                  ) : (
                    "Send Code"
                  )}
                </button>
              ) : !emailVerified ? (
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={emailOTP}
                      onChange={handleEmailOTPChange}
                      disabled={loading}
                    >
                      <InputOTPGroup className="gap-1.5">
                        <InputOTPSlot index={0} className="w-9 h-10 text-base font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-white text-gray-900" />
                        <InputOTPSlot index={1} className="w-9 h-10 text-base font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-white text-gray-900" />
                        <InputOTPSlot index={2} className="w-9 h-10 text-base font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-white text-gray-900" />
                        <InputOTPSlot index={3} className="w-9 h-10 text-base font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-white text-gray-900" />
                        <InputOTPSlot index={4} className="w-9 h-10 text-base font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-white text-gray-900" />
                        <InputOTPSlot index={5} className="w-9 h-10 text-base font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-white text-gray-900" />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <button
                    onClick={resendEmailOTP}
                    disabled={resendLoading.email}
                    className="w-full text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
                  >
                    {resendLoading.email ? "Resending..." : "Didn't receive code? Resend"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-center text-green-600 font-medium text-sm py-2">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Email verified!
                </div>
              )}
            </div>

            {/* Phone Verification */}
            {phone && (
              <div className={`p-4 rounded-xl border-2 transition-all ${
                phoneVerified 
                  ? 'bg-green-50 border-green-500' 
                  : emailVerified 
                    ? 'bg-gray-50 border-gray-200' 
                    : 'bg-gray-50 border-gray-200 opacity-60'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    phoneVerified ? 'bg-green-500' : emailVerified ? 'bg-teal-500' : 'bg-gray-300'
                  }`}>
                    {phoneVerified ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <MessageCircle className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm">SMS Verification</h3>
                    <p className="text-xs text-gray-500 truncate">{phone}</p>
                  </div>
                  {phoneVerified && (
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-lg">
                      Verified
                    </span>
                  )}
                </div>

                {!emailVerified ? (
                  <div className="flex items-center justify-center text-gray-400 text-xs py-2">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    Complete email verification first
                  </div>
                ) : !phoneSent ? (
                  <button
                    onClick={sendPhoneOTP}
                    disabled={loading || phoneVerified}
                    className="w-full h-10 text-white font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Sending...
                      </div>
                    ) : (
                      "Send SMS Code"
                    )}
                  </button>
                ) : !phoneVerified ? (
                  <div className="space-y-3">
                    {displayedPhoneOTP && (
                      <div className="p-2 bg-teal-50 border border-teal-200 rounded-lg text-center">
                        <p className="text-xs text-teal-700 mb-1">Demo OTP:</p>
                        <button
                          onClick={() => {
                            setPhoneOTP(displayedPhoneOTP);
                            handlePhoneOTPChange(displayedPhoneOTP);
                          }}
                          className="font-mono font-bold text-sm text-teal-600 hover:text-teal-800 underline"
                        >
                          {displayedPhoneOTP}
                        </button>
                      </div>
                    )}
                    <div className="flex justify-center">
                      <InputOTP
                        maxLength={6}
                        value={phoneOTP}
                        onChange={handlePhoneOTPChange}
                        disabled={loading}
                      >
                        <InputOTPGroup className="gap-1.5">
                          <InputOTPSlot index={0} className="w-9 h-10 text-base font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-white text-gray-900" />
                          <InputOTPSlot index={1} className="w-9 h-10 text-base font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-white text-gray-900" />
                          <InputOTPSlot index={2} className="w-9 h-10 text-base font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-white text-gray-900" />
                          <InputOTPSlot index={3} className="w-9 h-10 text-base font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-white text-gray-900" />
                          <InputOTPSlot index={4} className="w-9 h-10 text-base font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-white text-gray-900" />
                          <InputOTPSlot index={5} className="w-9 h-10 text-base font-bold rounded-lg border border-gray-300 focus:border-teal-500 focus:ring-0 bg-white text-gray-900" />
                        </InputOTPGroup>
                      </InputOTP>
                    </div>
                    <button
                      onClick={resendPhoneOTP}
                      disabled={resendLoading.phone}
                      className="w-full text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
                    >
                      {resendLoading.phone ? "Resending..." : "Didn't receive code? Resend"}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center text-green-600 font-medium text-sm py-2">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Phone verified!
                  </div>
                )}
              </div>
            )}

            {/* Completion Status */}
            {(emailVerified && (phoneVerified || !phone)) && (
              <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-xl text-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-green-700 text-sm">Account Verified!</h3>
                    <p className="text-xs text-green-600">Redirecting you now...</p>
                  </div>
                </div>
              </div>
            )}
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
