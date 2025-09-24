import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Phone, ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PhoneAuthProps {
  onOTPSent: (phoneNumber: string) => void;
  onBack?: () => void;
}

export default function PhoneAuth({ onOTPSent, onBack }: PhoneAuthProps) {
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const countryCodes = [
    { code: "+91", country: "IN", flag: "🇮🇳" },
    { code: "+1", country: "US", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+61", country: "AU", flag: "🇦🇺" },
    { code: "+971", country: "AE", flag: "🇦🇪" },
  ];

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format based on country code
    if (countryCode === "+91") {
      // Indian format: 98765 43210
      if (digits.length <= 5) return digits;
      return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
    }
    
    // Default format for other countries
    return digits.slice(0, 10);
  };

  const validatePhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
    
    if (countryCode === "+91") {
      return digits.length === 10 && /^[6-9]/.test(digits);
    }
    
    return digits.length >= 7 && digits.length <= 15;
  };

  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    setPhoneNumber(formatted);
    setError(null);
  };

  const handleSendOTP = async () => {
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const fullPhoneNumber = `${countryCode}${cleanPhone}`;

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { api } = await import("../lib/api");
      const response = await api.auth.sendOTP(fullPhoneNumber);
      
      // Store OTP for development/testing
      if (response.debug?.otp) {
        localStorage.setItem('debug_otp', response.debug.otp);
        toast({
          title: "OTP Sent!",
          description: `Your verification code is: ${response.debug.otp}`,
          duration: 10000, // Show for 10 seconds
        });
      } else {
        localStorage.removeItem('debug_otp');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="absolute top-6 left-6 z-20 flex items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-white/20 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:scale-105"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
      )}

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
          <p className="text-gray-600 text-sm mt-1">India's #1 Salon Booking App</p>
        </div>

        {/* Main Auth Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Log in or sign up
              </h2>
              <p className="text-gray-600">
                Enter your phone number to continue
              </p>
            </div>

            <div className="space-y-6">
              {/* Phone Number Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </label>
                
                <div className="flex gap-3">
                  {/* Country Code Selector */}
                  <Select value={countryCode} onValueChange={setCountryCode}>
                    <SelectTrigger className="w-24 h-14 text-base rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-gray-50/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-2">
                      {countryCodes.map((country) => (
                        <SelectItem key={country.code} value={country.code} className="text-base py-3">
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span>{country.code}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Phone Number Input */}
                  <div className="flex-1">
                    <Input
                      type="tel"
                      placeholder="Enter phone number"
                      value={phoneNumber}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="h-14 pl-4 pr-4 text-base rounded-2xl border-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                      maxLength={countryCode === "+91" ? 11 : 15}
                      aria-describedby={error ? "phone-error" : undefined}
                      aria-invalid={!!error}
                      autoComplete="tel"
                    />
                  </div>
                </div>

                {error && (
                  <p id="phone-error" className="text-sm text-red-500 flex items-center gap-1 mt-1" role="alert">
                    {error}
                  </p>
                )}
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleSendOTP}
                disabled={isLoading || !phoneNumber.trim()}
                className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending OTP...
                  </div>
                ) : (
                  "Continue"
                )}
              </Button>

              {/* Security Note */}
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Shield className="w-4 h-4" />
                <span>Your number is safe with us</span>
              </div>

              {/* Admin Access Link */}
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Salon owner?{" "}
                  <button 
                    className="text-purple-600 font-medium hover:underline"
                    onClick={() => {
                      window.location.href = '/auth?flow=admin';
                    }}
                  >
                    Admin Login
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Text */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            By continuing, you agree to SmartQ's{" "}
            <span className="text-purple-600 font-medium">Terms of Service</span> and{" "}
            <span className="text-purple-600 font-medium">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}