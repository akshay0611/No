import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, RefreshCw, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

  // Auto-fill OTP functionality
  const handleEmailOTPChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setEmailOTP(numericValue);
    
    // Clear any existing errors when user types
    if (generalError) {
      setGeneralError(null);
    }
    
    // Auto-verify when 6 digits are entered
    if (numericValue.length === 6 && !loading) {
      setTimeout(() => {
        verifyEmailOTP(numericValue);
      }, 300); // Reduced delay for better UX
    }
  };

  const handlePhoneOTPChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setPhoneOTP(numericValue);
    
    // Clear any existing errors when user types
    if (generalError) {
      setGeneralError(null);
    }
    
    // Auto-fill from displayed OTP if available
    if (displayedPhoneOTP && numericValue.length < 6 && displayedPhoneOTP.startsWith(numericValue)) {
      const autoFilledOTP = displayedPhoneOTP;
      setPhoneOTP(autoFilledOTP);
      // Auto-verify when auto-filled
      if (!loading) {
        setTimeout(() => {
          verifyPhoneOTP(autoFilledOTP);
        }, 300);
      }
      return;
    }
    
    // Auto-verify when 6 digits are manually entered
    if (numericValue.length === 6 && !loading) {
      setTimeout(() => {
        verifyPhoneOTP(numericValue);
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
        
        // Check if both verifications are complete
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
        
        // Check if both verifications are complete
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 flex flex-col">
      {/* Mobile-First Header */}
      <div className="text-center mb-6 pt-8 px-2">
        <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-slate-600 to-blue-600 bg-clip-text text-transparent mb-3">
          Verify Your Account
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
          Complete verification to secure your account
        </p>
        
        {/* Mobile Progress Bar */}
        <div className="mt-6 mb-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>Progress</span>
            <span>{completedSteps}/{totalSteps} completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-slate-600 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Error Alert - Mobile Optimized */}
      {generalError && (
        <Alert variant="destructive" className="mb-4 mx-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="text-sm">Error</AlertTitle>
          <AlertDescription className="text-sm">{generalError}</AlertDescription>
        </Alert>
      )}

      {/* Verification Steps - Mobile Stack */}
      <div className="flex-1 space-y-4 max-w-md mx-auto w-full">
        
        {/* Email Verification Card */}
        <Card className={`transition-all duration-300 ${emailVerified ? 'border-green-500 bg-green-50/50' : 'border-border'}`}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${emailVerified ? 'bg-green-500 text-white' : 'bg-slate-100'}`}>
                  {emailVerified ? <CheckCircle className="h-5 w-5" /> : <Mail className="h-5 w-5 text-slate-600" />}
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-lg">Email Verification</CardTitle>
                  <CardDescription className="text-xs truncate">{email}</CardDescription>
                </div>
              </div>
              {emailVerified && <Badge className="bg-green-500 text-xs flex-shrink-0 ml-2">Verified</Badge>}
            </div>
          </CardHeader>
          
          <CardContent className="pt-0">
            {!emailSent ? (
              <Button 
                onClick={sendEmailOTP} 
                disabled={loading || emailVerified} 
                className="w-full bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white h-12 rounded-xl font-medium"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4 mr-2" />
                )}
                Send Verification Code
              </Button>
            ) : !emailVerified ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter 6-digit code
                  </label>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={emailOTP}
                    onChange={(e) => handleEmailOTPChange(e.target.value)}
                    maxLength={6}
                    className="text-center text-xl tracking-[0.5em] h-14 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white transition-all duration-300"
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Button 
                    onClick={() => verifyEmailOTP()} 
                    disabled={loading || emailOTP.length !== 6} 
                    className="w-full bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white h-12 rounded-xl font-medium"
                  >
                    {loading ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    Verify Email
                  </Button>
                  <Button 
                    variant="ghost" 
                    onClick={resendEmailOTP} 
                    disabled={resendLoading.email}
                    className="w-full h-10 text-slate-600"
                  >
                    {resendLoading.email ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Didn't receive code? Resend
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center text-green-600 font-medium py-4">
                <CheckCircle className="h-5 w-5 mr-2" />
                Email verified successfully!
              </div>
            )}
          </CardContent>
        </Card>

        {/* Phone Verification Card */}
        {phone && (
          <Card className={`transition-all duration-300 ${phoneVerified ? 'border-green-500 bg-green-50/50' : emailVerified ? 'border-blue-500' : 'border-border opacity-75'}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${phoneVerified ? 'bg-green-500 text-white' : emailVerified ? 'bg-blue-500 text-white' : 'bg-slate-100'}`}>
                    {phoneVerified ? <CheckCircle className="h-5 w-5" /> : <MessageCircle className="h-5 w-5 text-slate-600" />}
                  </div>
                  <div>
                    <CardTitle className="text-lg">SMS Verification</CardTitle>
                    <CardDescription className="text-xs">{phone}</CardDescription>
                  </div>
                </div>
                {phoneVerified && <Badge className="bg-green-500 text-xs">Verified</Badge>}
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              {!emailVerified ? (
                <div className="flex items-center justify-center text-muted-foreground py-8 text-sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Complete email verification first
                </div>
              ) : !phoneSent ? (
                <Button 
                  onClick={sendPhoneOTP} 
                  disabled={loading || phoneVerified} 
                  className="w-full bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white h-12 rounded-xl font-medium"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageCircle className="h-4 w-4 mr-2" />
                  )}
                  Send SMS Code
                </Button>
              ) : !phoneVerified ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Enter 6-digit code
                    </label>
                    <Input
                      type="text"
                      placeholder="000000"
                      value={phoneOTP}
                      onChange={(e) => handlePhoneOTPChange(e.target.value)}
                      maxLength={6}
                      className="text-center text-xl tracking-[0.5em] h-14 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white transition-all duration-300"
                      inputMode="numeric"
                    />
                    {displayedPhoneOTP && (
                      <div className="text-center text-xs text-gray-500 mt-2 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <p className="mb-1">Demo OTP:</p>
                        <button 
                          type="button"
                          onClick={() => handlePhoneOTPChange(displayedPhoneOTP)}
                          className="font-mono font-bold text-lg text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          {displayedPhoneOTP}
                        </button>
                        <p className="text-xs mt-1 text-gray-400">Click to auto-fill</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Button 
                      onClick={() => verifyPhoneOTP()} 
                      disabled={loading || phoneOTP.length !== 6} 
                      className="w-full bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white h-12 rounded-xl font-medium"
                    >
                      {loading ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Verify Phone
                    </Button>
                    <Button 
                      variant="ghost" 
                      onClick={resendPhoneOTP} 
                      disabled={resendLoading.phone}
                      className="w-full h-10 text-slate-600"
                    >
                      {resendLoading.phone ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : null}
                      Didn't receive code? Resend
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center text-green-600 font-medium py-4">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Phone verified successfully!
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completion Status - Mobile Bottom */}
      {(emailVerified && (phoneVerified || !phone)) && (
        <div className="mt-6 mb-8 text-center">
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200 max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-green-700">Account Verified!</h3>
                  <p className="text-sm text-green-600">You can now access all features</p>
                </div>
                <Button 
                  onClick={onVerificationComplete}
                  className="bg-green-500 hover:bg-green-600 text-white mt-2"
                >
                  Continue <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}