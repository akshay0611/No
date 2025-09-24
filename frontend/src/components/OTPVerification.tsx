import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
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

  const verifyEmailOTP = async () => {
    if (!emailOTP || emailOTP.length !== 6) {
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
        body: JSON.stringify({ userId, otp: emailOTP }),
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

  const verifyPhoneOTP = async () => {
    if (!phoneOTP || phoneOTP.length !== 6) {
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
        body: JSON.stringify({ userId, otp: phoneOTP }),
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground mb-2">Verify Your Account</h2>
        <p className="text-muted-foreground">
          We need to verify your email and phone number to complete your registration.
        </p>
      </div>

      {generalError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{generalError}</AlertDescription>
        </Alert>
      )}

      {/* Email Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Verification
            {emailVerified && <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>}
          </CardTitle>
          <CardDescription>
            Verify your email: {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!emailSent ? (
            <Button onClick={sendEmailOTP} disabled={loading || emailVerified} className="w-full">
              {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Mail className="h-4 w-4 mr-2" />}
              Send Email OTP
            </Button>
          ) : !emailVerified ? (
            <div className="space-y-3">
              <Input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={emailOTP}
                onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="text-center text-lg tracking-widest"
              />
              <div className="flex gap-2">
                <Button onClick={verifyEmailOTP} disabled={loading || emailOTP.length !== 6} className="flex-1">
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Verify Email
                </Button>
                <Button 
                  variant="outline" 
                  onClick={resendEmailOTP} 
                  disabled={resendLoading.email}
                  size="sm"
                >
                  {resendLoading.email ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Resend"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center text-green-600 font-medium">
              <CheckCircle className="h-5 w-5 mr-2" />
              Email verified successfully!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phone Verification */}
      {phone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Phone (SMS) Verification
              {phoneVerified && <Badge variant="default" className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>}
            </CardTitle>
            <CardDescription>
              Verify your phone: {phone}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!phoneSent ? (
              <Button onClick={sendPhoneOTP} disabled={loading || phoneVerified} className="w-full">
                {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-2" />}
                Send SMS OTP
              </Button>
            ) : !phoneVerified ? (
              <div className="space-y-3">
                <Input
                  type="text"
                  placeholder="Enter 6-digit OTP"
                  value={phoneOTP}
                  onChange={(e) => setPhoneOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
                {displayedPhoneOTP && (
                  <p className="text-center text-sm text-gray-500">
                    Your OTP is: {displayedPhoneOTP}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button onClick={verifyPhoneOTP} disabled={loading || phoneOTP.length !== 6} className="flex-1">
                    {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Verify Phone
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={resendPhoneOTP} 
                    disabled={resendLoading.phone}
                    size="sm"
                  >
                    {resendLoading.phone ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Resend"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center text-green-600 font-medium">
                <CheckCircle className="h-5 w-5 mr-2" />
                Phone verified successfully!
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Progress Indicator */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              {emailVerified ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
              <span className={emailVerified ? "text-green-600 font-medium" : "text-muted-foreground"}>
                Email
              </span>
            </div>
            
            {phone && (
              <>
                <div className="w-8 h-0.5 bg-border"></div>
                <div className="flex items-center gap-2">
                  {phoneVerified ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-500" />
                  )}
                  <span className={phoneVerified ? "text-green-600 font-medium" : "text-muted-foreground"}>
                    Phone
                  </span>
                </div>
              </>
            )}
          </div>
          
          {(emailVerified && (phoneVerified || !phone)) && (
            <div className="text-center mt-4">
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Account Fully Verified
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
