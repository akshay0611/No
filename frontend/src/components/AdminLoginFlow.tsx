import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, Shield, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "../lib/api";
import { loginSchema, insertUserSchema } from "../lib/schemas";
import OTPVerification from "./OTPVerification";
import AdminProfileCompletion from "./AdminProfileCompletion";
import type { User as UserType } from "../types";
import { GoogleLogin } from "@react-oauth/google";

type AdminLoginForm = z.infer<typeof loginSchema>;
type AdminRegisterForm = z.infer<typeof insertUserSchema>;

interface AdminLoginFlowProps {
  onAuthSuccess: (user: any, token: string) => void;
  onSwitchToCustomer: () => void;
}

export default function AdminLoginFlow({
  onAuthSuccess,
  onSwitchToCustomer
}: AdminLoginFlowProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [showProfileCompletion, setShowProfileCompletion] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<(UserType & { password?: string }) | null>(null);
  const [googleAuthUser, setGoogleAuthUser] = useState<UserType | null>(null);
  const { toast } = useToast();

  // Google authentication handlers
  const handleGoogleSuccess = async (credentialResponse: any) => {
    if (!credentialResponse.credential) {
      toast({
        title: "Error",
        description: "Failed to get Google credentials",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await api.auth.googleAuth(credentialResponse.credential, 'salon_owner');

      // Store token and user data
      localStorage.setItem('smartq_token', response.token);
      localStorage.setItem('smartq_user', JSON.stringify(response.user));

      // Check if user has required fields for admin access
      const hasRequiredFields = response.user.name && response.user.phone;
      
      if (!hasRequiredFields) {
        // Show profile completion form
        setGoogleAuthUser(response.user);
        setShowProfileCompletion(true);
        toast({
          title: "Profile Completion Required",
          description: "Please complete your profile to access admin features.",
        });
      } else {
        // Complete profile, proceed to dashboard
        toast({
          title: response.isNewUser ? "Welcome to SmartQ Admin!" : "Welcome back!",
          description: response.isNewUser 
            ? "Your admin account has been created successfully" 
            : "You've been logged in successfully as salon owner",
        });
        onAuthSuccess(response.user, response.token);
      }
    } catch (err: any) {
      let errorMessage = err.message || "Failed to sign in with Google";
      
      // Handle role conflict error
      if (err.existingRole && err.requestedRole) {
        errorMessage = `Account already exists as ${err.existingRole}. Please use the customer login instead.`;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleGoogleError = () => {
    toast({
      title: "Error",
      description: "Failed to sign in with Google",
      variant: "destructive",
    });
  };

  const loginForm = useForm<AdminLoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const registerForm = useForm<AdminRegisterForm>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      role: "salon_owner",
    },
    mode: "onChange",
  });

  const loginMutation = useMutation({
    mutationFn: api.auth.login,
    onSuccess: (data) => {
      if (data.user.role === 'salon_owner') {
        toast({
          title: "Welcome back!",
          description: "You've been successfully logged in as salon owner.",
        });
        onAuthSuccess(data.user, data.token);
      } else {
        toast({
          title: "Access Denied",
          description: "This login is for salon owners only. Please use customer login instead.",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      if (error.message.includes('not verified') && error.requiresVerification) {
        const userData = {
          id: error.userId,
          name: '',
          email: loginForm.getValues('email'),
          phone: '',
          role: 'salon_owner',
          loyaltyPoints: 0,
          favoriteSalons: [],
          createdAt: new Date(),
          password: loginForm.getValues('password')
        };
        setRegisteredUser(userData);
        setShowOTPVerification(true);
        toast({
          title: "Account Verification Required",
          description: "Please complete your email and phone verification.",
        });
      } else {
        toast({
          title: "Login Failed",
          description: error.message || "Invalid email or password. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const registerMutation = useMutation({
    mutationFn: (userData: AdminRegisterForm) => {
      console.log("Sending admin registration with role:", userData.role);
      return api.auth.register(userData);
    },
    onSuccess: (data: any) => {
      const registrationData = registerForm.getValues();
      setRegisteredUser({
        ...data.user,
        password: registrationData.password
      });
      setShowOTPVerification(true);
      toast({
        title: "Admin Account Created!",
        description: "Please verify your email and phone number to complete registration.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: AdminLoginForm) => {
    console.log('Admin login form submitted with:', data);
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: AdminRegisterForm) => {
    console.log('Admin register form submitted with:', data);
    console.log('Sending to API with role:', data.role);
    registerMutation.mutate(data);
  };

  const handleVerificationComplete = async () => {
    if (registeredUser && registeredUser.password) {
      try {
        const loginData = {
          email: registeredUser.email,
          password: registeredUser.password
        };

        console.log('Auto-logging in admin user after verification...', {
          email: loginData.email,
          hasPassword: !!loginData.password,
          userRole: registeredUser.role
        });
        const data = await api.auth.login(loginData);

        if (data.user.role === 'salon_owner') {
          toast({
            title: "Welcome to SmartQ Admin!",
            description: "Your salon owner account has been verified successfully.",
          });
          onAuthSuccess(data.user, data.token);
        } else {
          toast({
            title: "Access Denied",
            description: "This account is not authorized for admin access.",
            variant: "destructive",
          });
        }

        setRegisteredUser(null);
        setShowOTPVerification(false);

      } catch (error) {
        console.error('Auto-login after verification failed:', error);
        toast({
          title: "Verification Complete!",
          description: "Please login with your credentials to continue.",
        });

        loginForm.setValue('email', registeredUser.email);
        setShowOTPVerification(false);
        setIsLogin(true);
        setRegisteredUser(null);
      }
    }
  };

  const handleProfileCompletion = (completedUser: any, token: string) => {
    // Update stored user data
    localStorage.setItem('smartq_user', JSON.stringify(completedUser));
    
    toast({
      title: "Welcome to SmartQ Admin!",
      description: "Your profile has been completed successfully.",
    });
    
    setShowProfileCompletion(false);
    setGoogleAuthUser(null);
    onAuthSuccess(completedUser, token);
  };

  const handleProfileCompletionSkip = () => {
    if (googleAuthUser) {
      toast({
        title: "Profile Incomplete",
        description: "You can complete your profile later from settings.",
      });
      
      setShowProfileCompletion(false);
      onAuthSuccess(googleAuthUser, localStorage.getItem('smartq_token') || '');
      setGoogleAuthUser(null);
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
      <div className="relative flex flex-col h-full overflow-y-auto">
        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/loadlogo.png"
              alt="SmartQ Logo" 
              className="h-16 w-auto drop-shadow-2xl"
            />
          </div>

          {/* Show Profile Completion, OTP Verification, or Auth Form */}
          {showProfileCompletion && googleAuthUser ? (
            <div className="w-full max-w-sm">
              <AdminProfileCompletion
                user={googleAuthUser}
                onCompletion={handleProfileCompletion}
                onSkip={handleProfileCompletionSkip}
              />
            </div>
          ) : showOTPVerification && registeredUser ? (
            <div className="w-full max-w-sm">
              <OTPVerification
                userId={registeredUser.id}
                email={registeredUser.email}
                phone={registeredUser.phone}
                onVerificationComplete={handleVerificationComplete}
              />
            </div>
          ) : (
            <>
              {/* Auth Card */}
              <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl px-6 py-6 shadow-2xl border border-white/20">
                {/* Header */}
                <div className="mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <Shield className="w-4 h-4 text-white" />
                    </div>
                    <h1 className="text-xl font-bold text-gray-900">Admin Portal</h1>
                  </div>
                  <p className="text-gray-500 text-xs leading-relaxed">
                    {isLogin
                      ? "Sign in to manage your salon and access the dashboard."
                      : "Create your salon owner account to get started."}
                  </p>
                </div>

                {/* Auth Toggle Tabs */}
                <div className="bg-gray-100 rounded-xl p-1 mb-5">
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => {
                        setIsLogin(true);
                        registerForm.reset();
                        setShowPassword(false);
                      }}
                      className={`py-2 px-4 rounded-lg font-semibold text-xs transition-all duration-200 ${isLogin
                          ? 'bg-white text-teal-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        setIsLogin(false);
                        loginForm.reset();
                        setShowPassword(false);
                      }}
                      className={`py-2 px-4 rounded-lg font-semibold text-xs transition-all duration-200 ${!isLogin
                          ? 'bg-white text-teal-600 shadow-sm'
                          : 'text-gray-600 hover:text-gray-800'
                        }`}
                    >
                      Sign Up
                    </button>
                  </div>
                </div>

                {/* Forms */}
                {isLogin ? (
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-3">
                    {/* Email Input */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                        <Mail className="w-4 h-4" />
                      </div>
                      <Input
                        type="email"
                        placeholder="Email Address"
                        className="h-11 pl-11 pr-4 text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white placeholder-gray-400 transition-all text-sm"
                        {...loginForm.register("email")}
                        autoComplete="email"
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-xs text-red-600 mt-1 ml-1">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                        <Lock className="w-4 h-4" />
                      </div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="h-11 pl-11 pr-11 text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white placeholder-gray-400 transition-all text-sm"
                        {...loginForm.register("password")}
                        autoComplete="current-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {loginForm.formState.errors.password && (
                        <p className="text-xs text-red-600 mt-1 ml-1">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Login Button */}
                    <button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full h-11 text-white font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl mt-4 text-sm"
                    >
                      {loginMutation.isPending ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Signing in...
                        </div>
                      ) : (
                        "Sign In"
                      )}
                    </button>

                    {/* Divider */}
                    <div className="relative mt-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    {/* Google Login Button */}
                    <div className="mt-4">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap={false}
                        theme="outline"
                        size="large"
                        width="100%"
                        shape="rectangular"
                        text="signin_with"
                        logo_alignment="left"
                      />
                    </div>
                  </form>
                ) : (
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-3">
                    {/* Full Name Input */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                        <User className="w-4 h-4" />
                      </div>
                      <Input
                        placeholder="Full Name"
                        className="h-11 pl-11 pr-4 text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white placeholder-gray-400 transition-all text-sm"
                        {...registerForm.register("name")}
                        autoComplete="name"
                      />
                      {registerForm.formState.errors.name && (
                        <p className="text-xs text-red-600 mt-1 ml-1">
                          {registerForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    {/* Email Input */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                        <Mail className="w-4 h-4" />
                      </div>
                      <Input
                        type="email"
                        placeholder="Email Address"
                        className="h-11 pl-11 pr-4 text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white placeholder-gray-400 transition-all text-sm"
                        {...registerForm.register("email")}
                        autoComplete="email"
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-xs text-red-600 mt-1 ml-1">
                          {registerForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Phone Input */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                        <Phone className="w-4 h-4" />
                      </div>
                      <Input
                        type="tel"
                        placeholder="Phone Number"
                        className="h-11 pl-11 pr-4 text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white placeholder-gray-400 transition-all text-sm"
                        {...registerForm.register("phone")}
                        autoComplete="tel"
                      />
                      {registerForm.formState.errors.phone && (
                        <p className="text-xs text-red-600 mt-1 ml-1">
                          {registerForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                        <Lock className="w-4 h-4" />
                      </div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="h-11 pl-11 pr-11 text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white placeholder-gray-400 transition-all text-sm"
                        {...registerForm.register("password")}
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {registerForm.formState.errors.password && (
                        <p className="text-xs text-red-600 mt-1 ml-1">
                          {registerForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Create Account Button */}
                    <button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full h-11 text-white font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl mt-4 text-sm"
                    >
                      {registerMutation.isPending ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating account...
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </button>

                    {/* Divider */}
                    <div className="relative mt-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-2 bg-white text-gray-500">Or continue with</span>
                      </div>
                    </div>

                    {/* Google Login Button */}
                    <div className="mt-4">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        useOneTap={false}
                        theme="outline"
                        size="large"
                        width="100%"
                        shape="rectangular"
                        text="signin_with"
                        logo_alignment="left"
                      />
                    </div>
                  </form>
                )}

                {/* Security Badge */}
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-2.5 mt-5">
                  <div className="flex items-start gap-2">
                    <div className="w-6 h-6 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="w-3.5 h-3.5 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-teal-900 text-xs mb-0.5">
                        Enhanced Security
                      </h4>
                      <p className="text-teal-700 text-xs leading-relaxed">
                        {isLogin
                          ? "Admin accounts have additional security measures."
                          : "All accounts require email and phone verification."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Login Link */}
                <div className="text-center mt-5 pt-5 border-t border-gray-200">
                  <p className="text-gray-500 text-xs">
                    Not a salon owner?{" "}
                    <button
                      type="button"
                      onClick={onSwitchToCustomer}
                      className="text-teal-600 font-semibold hover:text-teal-700 transition-colors"
                    >
                      Customer Login
                    </button>
                  </p>
                </div>
              </div>

              {/* Trust Badge */}
              <div className="text-center mt-4">
                <p className="text-white/60 text-xs">
                  🔒 Your data is secure and encrypted
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
