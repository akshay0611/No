import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Phone } from "lucide-react";
import { GoogleLogin } from '@react-oauth/google';

interface PhoneAuthProps {
  onOTPSent: (phoneNumber: string) => void;
  onBack?: () => void;
  onSwitchToAdmin?: () => void;
}

export default function PhoneAuth({ onOTPSent, onSwitchToAdmin }: PhoneAuthProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const countryCode = "+91";

  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast({
        title: "Error",
        description: "Failed to get Google credentials",
        variant: "destructive",
      });
      return;
    }

    setError(null);

    try {
      const { api } = await import("../lib/api");
      const response = await api.auth.googleAuth(credentialResponse.credential);

      console.log('Google auth response:', response);
      console.log('User profileImage:', response.user.profileImage);

      // Store token and user data
      localStorage.setItem('smartq_token', response.token);
      localStorage.setItem('smartq_user', JSON.stringify(response.user));

      toast({
        title: response.isNewUser ? "Welcome!" : "Welcome back!",
        description: response.isNewUser 
          ? "Your account has been created successfully" 
          : "You've been logged in successfully",
      });

      // Reload page to trigger auth context update
      window.location.reload();
    } catch (err: any) {
      const errorMessage = err.message || "Failed to sign in with Google";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleGoogleError = () => {
    setError("Google sign-in failed. Please try again.");
    toast({
      title: "Error",
      description: "Failed to sign in with Google",
      variant: "destructive",
    });
  };

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    let digits = value.replace(/\D/g, '');
    
    // Remove leading zeros
    digits = digits.replace(/^0+/, '');
    
    // Limit to 10 digits
    digits = digits.slice(0, 10);
    
    // Format with space after 5 digits
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  };

  const validatePhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '').replace(/^0+/, '');
    return digits.length === 10 && /^[6-9]/.test(digits);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError(null);
  };

  const handleSendOTP = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const fullPhoneNumber = `${countryCode}${cleanPhone}`;

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { api } = await import("../lib/api");
      const response = await api.auth.sendOTP(fullPhoneNumber);

      if (response.debug?.otp) {
        localStorage.setItem("debug_otp", response.debug.otp);
        toast({
          title: "OTP Sent!",
          description: `Your verification code is: ${response.debug.otp}`,
          duration: 10000,
        });
      } else {
        localStorage.removeItem("debug_otp");
        toast({
          title: "OTP Sent!",
          description: `Verification code sent to ${fullPhoneNumber}`,
        });
      }

      onOTPSent(fullPhoneNumber);
    } catch (err: any) {
      const errorMessage = err.message || "Failed to send OTP. Please try again.";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && phoneNumber.trim()) {
      handleSendOTP();
    }
  };

  return (
    <div className="fixed inset-0 z-50  overflow-hidden">
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





        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-6">
          {/* Logo & Hero Text */}
          <div className="text-center mb-6">
            <img
              src="/loadlogo.png"
              alt="SmartQ Logo"
              className="h-24 w-auto drop-shadow-2xl mx-auto mb-2"
            />
            <h1 className="text-3xl font-bold text-white mb-2 leading-tight">
              India's Leading Salon<br />Booking Platform
            </h1>
            <p className="text-white/80 text-base font-medium">
              Book appointments with ease
            </p>
          </div>

          {/* Auth Card */}
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl px-6 py-8 shadow-2xl border border-white/20">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-xl font-bold text-gray-900 mb-1.5">Get Started</h1>
              <p className="text-gray-500 text-xs leading-relaxed">
                Login to continue where you left off, or sign up to explore the app.
              </p>
            </div>

            {/* Phone Input */}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="flex">
                  <div className="w-16 h-11 pl-11 pr-2 text-gray-700 bg-gray-50 border border-gray-300 rounded-l-xl flex items-center justify-center font-semibold text-sm">
                    +91
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={handlePhoneChange}
                    onKeyPress={handleKeyPress}
                    className="flex-1 h-11 px-4 text-gray-900 bg-gray-50 border border-l-0 border-gray-300 rounded-r-xl focus:outline-none focus:border-teal-500 focus:bg-white placeholder-gray-400 transition-all text-sm"
                    maxLength={11}
                    autoComplete="tel"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-2.5">
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

              {/* Sign In Button */}
              <button
                onClick={handleSendOTP}
                disabled={isLoading || !phoneNumber.trim()}
                className="w-full h-11 text-white font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending OTP...
                  </div>
                ) : (
                  "Sign In"
                )}
              </button>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              <div className="w-full">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  useOneTap={false}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  shape="rectangular"
                  width="100%"
                />
              </div>
            </div>

            {/* Admin Login */}
            {onSwitchToAdmin && (
              <div className="text-center mt-6 pt-5 border-t border-gray-200">
                <p className="text-gray-500 text-xs">
                  Salon Owner?{" "}
                  <button
                    className="text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                    onClick={onSwitchToAdmin}
                  >
                    Admin Login
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Trust Badge */}
          <div className="text-center mt-4">
            <p className="text-white/60 text-xs">
              🔒 Your data is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
