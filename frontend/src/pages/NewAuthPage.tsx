import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import AuthLoadingScreen from "../components/AuthLoadingScreen";
import PhoneAuth from "../components/PhoneAuth";
import PhoneOTPVerification from "../components/PhoneOTPVerification";
import WelcomeLoading from "../components/WelcomeLoading";
import AdminLoginFlow from "../components/AdminLoginFlow";
import { useState } from "react";

type AuthStep = 
  | 'loading'
  | 'phone-input'
  | 'otp-verification'
  | 'welcome-loading'
  | 'admin-login';

interface NewAuthPageProps {
  onComplete?: () => void;
}

export default function NewAuthPage({ onComplete }: NewAuthPageProps) {
  const [currentStep, setCurrentStep] = useState<AuthStep>('loading');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [debugOTP, setDebugOTP] = useState<string>('');
  const [, setLocation] = useLocation();
  
  const { 
    user, 
    login, 
    authFlow, 
    setAuthFlow
  } = useAuth();

  // Check URL params for admin flow
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const flow = urlParams.get('flow');
    if (flow === 'admin') {
      setAuthFlow('admin');
    } else {
      setAuthFlow('customer');
    }
  }, [setAuthFlow]);

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      if (onComplete) {
        onComplete();
      } else if (user.role === 'salon_owner') {
        setLocation('/dashboard');
      } else {
        setLocation('/');
      }
    }
  }, [user, setLocation, onComplete]);

  const handleLoadingComplete = () => {
    if (authFlow === 'admin') {
      setCurrentStep('admin-login');
    } else {
      setCurrentStep('phone-input');
    }
  };

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
      onComplete();
    } else {
      setLocation('/');
    }
  };

  const handleAdminAuthSuccess = (userData: any, token: string) => {
    login(userData, token);
    if (onComplete) {
      onComplete();
    } else {
      setLocation('/dashboard');
    }
  };

  const handleSwitchToCustomer = () => {
    setAuthFlow('customer');
    setCurrentStep('phone-input');
  };

  const handleSwitchToAdmin = () => {
    setAuthFlow('admin');
    setCurrentStep('admin-login');
  };

  // Don't render if user is already authenticated
  if (user) {
    return null;
  }

  // Render current step
  switch (currentStep) {
    case 'loading':
      return <AuthLoadingScreen onComplete={handleLoadingComplete} />;
    
    case 'phone-input':
      return (
        <PhoneAuth 
          onOTPSent={handleOTPSent}
          onBack={() => setCurrentStep('loading')}
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
      return <AuthLoadingScreen onComplete={handleLoadingComplete} />;
  }
}