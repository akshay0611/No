import { useState } from "react";
import { ArrowLeft, Phone, Shield } from "lucide-react";

export default function PhoneAuth() {
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [debugOTP, setDebugOTP] = useState("");

  const countryCodes = [
    { code: "+91", country: "IN", flag: "🇮🇳" },
    { code: "+1", country: "US", flag: "🇺🇸" },
    { code: "+44", country: "UK", flag: "🇬🇧" },
    { code: "+61", country: "AU", flag: "🇦🇺" },
    { code: "+971", country: "AE", flag: "🇦🇪" },
  ];

  const formatPhoneNumber = (value) => {
    const digits = value.replace(/\D/g, '');
    if (countryCode === "+91") {
      if (digits.length <= 5) return digits;
      return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
    }
    return digits.slice(0, 10);
  };

  const validatePhoneNumber = (phone) => {
    const digits = phone.replace(/\D/g, '');
    if (countryCode === "+91") {
      return digits.length === 10 && /^[6-9]/.test(digits);
    }
    return digits.length >= 7 && digits.length <= 15;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
    setError(null);
  };

  const showToastMessage = (message, isError = false) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response with debug OTP
      const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();
      setDebugOTP(mockOTP);
      
      showToastMessage(`OTP Sent! Your verification code is: ${mockOTP}`);
      
      // Call the onOTPSent callback if it exists
      if (window.onOTPSent) {
        window.onOTPSent(fullPhoneNumber);
      }
      
    } catch (err) {
      const errorMessage = "Failed to send OTP. Please try again.";
      setError(errorMessage);
      showToastMessage(errorMessage, true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-white shadow-xl rounded-lg border p-4 max-w-sm animate-slide-in">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
            <div>
              <p className="font-medium text-sm text-gray-900">OTP Sent!</p>
              <p className="text-sm text-gray-600 mt-1">{toastMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Banner Section with Background Image */}
      <div
  className="relative min-h-[60vh] flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat"
  style={{ backgroundImage: "url('/altQ.png')", backgroundSize: "100% 100%", backgroundPosition: "center" }}
  >

        
        {/* <button className="absolute top-4 right-4 z-20 bg-black/30 text-white px-6 py-2 rounded-full text-sm font-medium backdrop-blur-sm hover:bg-black/40 transition-all">
          Skip
        </button> */}

        {/* Salon Icons/Illustrations - You can replace these with images from public folder */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Top Left - Scissors Icon */}
          {/* <div className="absolute top-12 left-8 w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shadow-lg">
            <div className="relative">
              <div className="w-8 h-1 bg-white rounded-full transform rotate-45"></div>
              <div className="w-1 h-8 bg-white rounded-full absolute top-0 left-1/2 transform -translate-x-1/2 rotate-45"></div>
            </div>
          </div> */}
          
          {/* Top Right - Hair Dryer */}
          {/* <div className="absolute top-16 right-12 w-14 h-20 bg-white/20 rounded-t-full shadow-lg">
            <div className="w-8 h-8 bg-white/30 rounded-full mt-3 mx-auto"></div>
            <div className="w-10 h-6 bg-white/20 rounded mx-auto mt-1"></div>
          </div> */}
          
          {/* Bottom Left - Mirror */}
          {/* <div className="absolute bottom-20 left-12 w-20 h-20 bg-white/15 rounded-full border-4 border-white/25 shadow-lg">
            <div className="w-12 h-12 bg-white/25 rounded-full m-auto mt-2"></div>
          </div> */}
          
          {/* Bottom Right - Comb */}
          {/* <div className="absolute bottom-16 right-16 w-16 h-6 bg-white/20 rounded-full shadow-lg">
            <div className="flex justify-evenly px-2 py-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-0.5 h-3 bg-white/50 rounded-full"></div>
              ))}
            </div>
          </div> */}

          {/* Center decorative elements */}
          {/* <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-white/10 rounded-full shadow-lg flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 rounded-full"></div>
          </div> */}

          {/* Floating particles */}
          <div className="absolute top-1/4 left-1/3 w-3 h-3 bg-white/40 rounded-full animate-bounce"></div>
          <div className="absolute top-2/3 right-1/3 w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
          <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-white/45 rounded-full animate-bounce animation-delay-1s"></div>
        </div>

        
      </div>

      {/* Bottom White Section - Form Area */}

      {/* Main Banner Content */}
      <div className="text-center z-10 px-6">
          
          <p className="text-blue-600 text-lg mt-4 font-medium tracking-wide">
            India's #1 Salon Booking App
          </p>
        </div>
        
      <div className="flex-1 bg-white px-4 py-6">
        <div className="w-full max-w-md mx-auto">
          {/* Title */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-600 mb-2">
              ---- Log in or sign up ----
            </h2>
          </div>

          {/* Phone Input Section */}
          <div className="space-y-6">
            {/* Country Code and Phone Number */}
            <div className="flex gap-3">
              {/* Country Code Dropdown */}
              <div className="relative">
                <select 
                  value={countryCode} 
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-28 h-14 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white appearance-none pl-3 pr-8 cursor-pointer font-medium outline-none"
                >
                  {countryCodes.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.flag} {country.code}
                    </option>
                  ))}
                </select>
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Phone Number Input */}
              <div className="flex-1">
                <input
                  type="tel"
                  placeholder="Enter Phone Number"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="w-full h-14 pl-4 pr-4 text-base rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-white transition-all duration-300 outline-none placeholder-gray-400"
                  maxLength={countryCode === "+91" ? 11 : 15}
                  autoComplete="tel"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-blue-600 mt-2 px-1">
                {error}
              </p>
            )}

            {/* Continue Button */}
            <button
              onClick={handleSendOTP}
              disabled={isLoading || !phoneNumber.trim()}
              className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Sending OTP...
                </div>
              ) : (
                "Continue"
              )}
            </button>

            {/* OR Divider */}
            <div className="text-center text-gray-400 text-lg font-medium">
              or
            </div>

            {/* Social Login Buttons */}
            <div className="flex justify-center gap-8">
              {/* Google */}
              <button className="w-12 h-12 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:shadow-lg transition-all">
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>

              {/* More options */}
              <button className="w-12 h-12 bg-white rounded-full shadow-md border border-gray-200 flex items-center justify-center hover:shadow-lg transition-all">
                <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
                  <circle cx="5" cy="12" r="2"/>
                  <circle cx="12" cy="12" r="2"/>
                  <circle cx="19" cy="12" r="2"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Terms and Privacy */}
          <div className="text-center mt-8">
            <p className="text-sm text-gray-500 leading-relaxed px-4">
              By continuing, you agree to our{" "}
              <span className="text-gray-700 font-medium cursor-pointer hover:underline">Terms of Service</span>{" "}
              <span className="text-gray-700 font-medium cursor-pointer hover:underline">Privacy Policy</span>{" "}
              <span className="text-gray-700 font-medium cursor-pointer hover:underline">Content Policy</span>
            </p>
          </div>

          {/* Debug Info */}
          {debugOTP && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-800">
                <strong>Debug Mode:</strong> OTP sent - {debugOTP}
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx="true">{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}