import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import PhoneAuth from "./PhoneAuth";
import PhoneOTPVerification from "./PhoneOTPVerification";
import WelcomeLoading from "./WelcomeLoading";
import AdminLoginFlow from "./AdminLoginFlow";

type AuthStep = 'phone-input' | 'otp-verification' | 'welcome-loading' | 'admin-login';

interface PhoneAuthFlowProps {
  onComplete?: (user?: any) => void;
}

export default function PhoneAuthFlow({ onComplete }: PhoneAuthFlowProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>('phone-input');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [, setLocation] = useLocation();
  
  const { user, login } = useAuth();

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      if (onComplete) {
        onComplete(user);
      } else {
        setLocation('/');
      }
    }
  }, [user, setLocation, onComplete]);

  const handleOTPSent = (phone: string) => {
    setPhoneNumber(phone);
    setCurrentStep('otp-verification');
  };

  const handleOTPVerificationSuccess = (userData: any, token: string) => {
    login(userData, token);
    setCurrentStep('welcome-loading');
  };

  const handleWelcomeComplete = () => {
    if (onComplete) {
      onComplete(user);
    } else {
      setLocation('/');
    }
  };

  const handleSwitchToAdmin = () => {
    setCurrentStep('admin-login');
  };

  const handleAdminAuthSuccess = (userData: any, token: string) => {
    login(userData, token);
    if (onComplete) {
      onComplete(userData);
    } else {
      setLocation('/dashboard');
    }
  };

  const handleSwitchToCustomer = () => {
    setCurrentStep('phone-input');
  };

  // Don't render if user is already authenticated
  if (user) {
    return null;
  }

  // Render current step
  switch (currentStep) {
    case 'phone-input':
      return (
        <PhoneAuth 
          onOTPSent={handleOTPSent}
          onBack={() => {}} // No back button for this flow
          onSwitchToAdmin={handleSwitchToAdmin}
        />
      );
    
    case 'otp-verification':
      return (
        <PhoneOTPVerification
          phoneNumber={phoneNumber}
          onVerificationSuccess={handleOTPVerificationSuccess}
          onBack={() => setCurrentStep('phone-input')}
        />
      );
    
    case 'welcome-loading':
      return (
        <WelcomeLoading
          onComplete={handleWelcomeComplete}
          userName={user?.name}
        />
      );
    
    case 'admin-login':
      return (
        <AdminLoginFlow
          onAuthSuccess={handleAdminAuthSuccess}
          onSwitchToCustomer={handleSwitchToCustomer}
        />
      );
    
    default:
      return (
        <PhoneAuth 
          onOTPSent={handleOTPSent}
          onBack={() => {}}
          onSwitchToAdmin={handleSwitchToAdmin}
        />
      );
  }
}