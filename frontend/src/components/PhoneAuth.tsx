import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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

  const countryCode = "+91"; // Fixed to India only

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  };

  const validatePhoneNumber = (phone: string) => {
    const digits = phone.replace(/\D/g, '');
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
      setError("Please enter a valid phone number");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { api } = await import("../lib/api");
      const response = await api.auth.sendOTP(fullPhoneNumber);

      // Store OTP for dev/debug
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-12 relative overflow-hidden">
        <div className="max-w-md mx-auto relative z-10">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="/loadlogo.png"
              alt="YEF Samrat Logo"
              className="h-16 w-auto brightness-0 invert"
            />
          </div>

          {/* Banner Content */}
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-2">India's Leading Salon</h2>
            <h3 className="text-2xl font-bold mb-3">Booking Platform</h3>
            <p className="text-teal-100 text-sm">Book appointments with ease</p>
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
            <h1 className="text-2xl font-bold font-bricolage text-gray-900 mb-2">Get Started</h1>
            <p className="text-gray-600 text-sm"> Login to continue where you left off, or sign up to explore the app.</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            {/* Phone Input */}
            <div className="relative">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="flex">
                <div className="w-18 h-14 pl-12 pr-2 text-gray-700 bg-gray-100 border-0 rounded-l-lg flex items-center justify-center font-medium">
                  +91
                </div>

                <input
                  type="tel"
                  placeholder="Phone"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="flex-1 h-14 px-4 text-gray-700 bg-gray-100 border-0 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500"
                  maxLength={11}
                  autoComplete="tel"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 mt-2" role="alert">
                {error}
              </p>
            )}


            {/* Sign In Button */}
            <button
              onClick={handleSendOTP}
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full h-14 text-white font-semibold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 mt-8"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                "Sign in"
              )}
            </button>
          </div>

          {/* Admin Login */}
          <div className="text-center mt-8">
            <p className="text-gray-600">
              Salon Owner?{" "}
              <button
                className="text-orange-500 font-medium hover:underline"
                onClick={onSwitchToAdmin}
              >
                Admin Login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}