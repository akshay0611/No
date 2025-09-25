import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Shield, UserCheck, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "../lib/api";
import { loginSchema, insertUserSchema } from "../lib/schemas";
import OTPVerification from "./OTPVerification";
import type { User as UserType } from "../types";

const registerFormSchema = insertUserSchema.extend({
  confirmPassword: z.string().min(6),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type AdminLoginForm = z.infer<typeof loginSchema>;
type AdminRegisterForm = z.infer<typeof registerFormSchema>;

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
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<(UserType & { password?: string }) | null>(null);
  const { toast } = useToast();

  const loginForm = useForm<AdminLoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const registerForm = useForm<AdminRegisterForm>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      role: "salon_owner", // Default to salon_owner for admin flow
    },
    mode: "onChange",
  });

  const loginMutation = useMutation({
    mutationFn: api.auth.login,
    onSuccess: (data) => {
      // Check if user is salon owner (admin)
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
      // Check if user needs verification
      if (error.message.includes('not verified') && error.requiresVerification) {
        const userData = {
          id: error.userId,
          name: '', // Will be filled from server
          email: loginForm.getValues('email'),
          phone: '',
          role: 'salon_owner',
          loyaltyPoints: 0,
          favoriteSalons: [],
          createdAt: new Date(),
          password: loginForm.getValues('password') // Store password for auto-login after verification
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
    mutationFn: (userData: Omit<AdminRegisterForm, 'confirmPassword'>) => {
      console.log("Sending admin registration with role:", userData.role);
      return api.auth.register(userData);
    },
    onSuccess: (data: any) => {
      // Store user data for OTP verification including password for auto-login
      const registrationData = registerForm.getValues();
      setRegisteredUser({
        ...data.user,
        password: registrationData.password // Store password for auto-login after verification
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
    const { confirmPassword, ...userData } = data;

    console.log('Sending to API with role:', userData.role);
    registerMutation.mutate(userData);
  };

  const handleVerificationComplete = async () => {
    if (registeredUser && registeredUser.password) {
      try {
        // Automatically log in the user after successful verification
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

        // Check if user is salon owner
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

        // Clean up
        setRegisteredUser(null);
        setShowOTPVerification(false);

      } catch (error) {
        console.error('Auto-login after verification failed:', error);
        toast({
          title: "Verification Complete!",
          description: "Please login with your credentials to continue.",
        });

        // Fallback: redirect to login form with email pre-filled
        loginForm.setValue('email', registeredUser.email);
        setShowOTPVerification(false);
        setIsLogin(true);
        setRegisteredUser(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Back Button */}
      <button
        onClick={onSwitchToCustomer}
        className="absolute top-6 left-6 z-20 flex items-center justify-center w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-white/20 hover:bg-white hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        aria-label="Back to customer login"
      >
        <ArrowLeft className="w-5 h-5 text-gray-700" />
      </button>

      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-slate-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-300/10 to-blue-300/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Show OTP Verification or Auth Form */}
        {showOTPVerification && registeredUser ? (
          <OTPVerification
            userId={registeredUser.id}
            email={registeredUser.email}
            phone={registeredUser.phone}
            onVerificationComplete={handleVerificationComplete}
          />
        ) : (
          <>
            {/* App Logo/Brand */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-slate-600 to-blue-600 rounded-2xl mb-4 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-600 to-blue-600 bg-clip-text text-transparent">
                SmartQ Admin
              </h1>
              <p className="text-gray-600 text-sm mt-1">Salon Management Portal</p>
            </div>

            {/* Auth Toggle Tabs */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-1 mb-6 shadow-lg border border-white/20">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => {
                    setIsLogin(true);
                    registerForm.reset();
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                  }}
                  className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${isLogin
                    ? 'bg-gradient-to-r from-slate-600 to-blue-600 text-white shadow-lg'
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
                    setShowConfirmPassword(false);
                  }}
                  className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${!isLogin
                    ? 'bg-gradient-to-r from-slate-600 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800'
                    }`}
                >
                  Sign Up
                </button>
              </div>
            </div>

            {/* Main Admin Auth Card */}
            <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              <div className="p-8">
                <div className="text-center mb-8">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserCheck className="w-8 h-8 text-slate-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {isLogin ? "Admin Login" : "Create Admin Account"}
                  </h2>
                  <p className="text-gray-600">
                    {isLogin
                      ? "Access your salon management dashboard"
                      : "Register as a salon owner to manage your business"}
                  </p>
                </div>

                {isLogin ? (
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
                    {/* Email Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter your admin email"
                        className="h-14 pl-4 pr-4 text-base rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-red-500">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          className="h-14 pl-4 pr-12 text-base rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                          {...loginForm.register("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-500">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Login Button */}
                    <Button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                    >
                      {loginMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Signing in...
                        </div>
                      ) : (
                        "Sign In to Dashboard"
                      )}
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-5">
                    {/* Full Name Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Full Name
                      </label>
                      <Input
                        placeholder="Enter your full name"
                        className="h-14 pl-4 pr-4 text-base rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                        {...registerForm.register("name")}
                      />
                      {registerForm.formState.errors.name && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    {/* Email Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email Address
                      </label>
                      <Input
                        type="email"
                        placeholder="Enter your email address"
                        className="h-14 pl-4 pr-4 text-base rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    {/* Phone Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone Number
                      </label>
                      <Input
                        type="tel"
                        placeholder="Enter your phone number"
                        className="h-14 pl-4 pr-4 text-base rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                        {...registerForm.register("phone")}
                      />
                      {registerForm.formState.errors.phone && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.phone.message}</p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          className="h-14 pl-4 pr-12 text-base rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                          {...registerForm.register("password")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>

                    {/* Confirm Password Input */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Confirm Password
                      </label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          className="h-14 pl-4 pr-12 text-base rounded-2xl border-2 border-gray-200 focus:border-blue-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
                          {...registerForm.register("confirmPassword")}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                      {registerForm.formState.errors.confirmPassword && (
                        <p className="text-sm text-red-500">{registerForm.formState.errors.confirmPassword.message}</p>
                      )}
                    </div>

                    {/* Create Account Button */}
                    <Button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full h-14 text-base font-semibold rounded-2xl bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] mt-6"
                    >
                      {registerMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating account...
                        </div>
                      ) : (
                        "Create Admin Account"
                      )}
                    </Button>
                  </form>
                )}

                {/* Security Features */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Shield className="w-4 h-4 text-slate-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 text-sm mb-1">
                        Enhanced Security
                      </h4>
                      <p className="text-slate-700 text-xs leading-relaxed">
                        {isLogin
                          ? "Admin accounts have additional security measures including session monitoring and access logging."
                          : "All salon owner accounts require email and phone verification for enhanced security."
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Login Link */}
                <div className="text-center pt-4 border-t border-gray-200 mt-6">
                  <p className="text-sm text-gray-600">
                    Not a salon owner?{" "}
                    <button
                      type="button"
                      onClick={onSwitchToCustomer}
                      className="text-blue-600 font-medium hover:underline"
                    >
                      Customer Login
                    </button>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Text */}
            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Secure admin access protected by SmartQ security protocols
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}