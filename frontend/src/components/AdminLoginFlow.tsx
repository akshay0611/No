import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Shield, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "../lib/api";
import { loginSchema, insertUserSchema } from "../lib/schemas";
import OTPVerification from "./OTPVerification";
import type { User as UserType } from "../types";

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
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
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
    mutationFn: (userData: AdminRegisterForm) => {
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
    console.log('Sending to API with role:', data.role);
    registerMutation.mutate(data);
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
    <div className="min-h-screen bg-gray-50">
      {/* Banner Section */}
      <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-6 relative overflow-hidden">
        {/* Back Button */}
       

        <div className="max-w-md mx-auto relative z-10">
          {/* Logo */}
          <div className="mb-6">
            <img
              src="/loadlogo.png"
              alt="YEF Samrat Logo"
              className="h-20 w-auto filter brightness-0 invert"
            />
          </div>

          {/* Banner Content */}
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-2">Admin Portal</h2>
            <h3 className="text-2xl font-bold mb-3">Salon Management</h3>
            <p className="text-teal-100 text-sm">Manage your salon with ease</p>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full -translate-y-32 translate-x-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-800/20 rounded-full translate-y-24 -translate-x-24"></div>
      </div>

      {/* Form Section */}
      <div className="px-6 py-8">
        <div className="max-w-md mx-auto">
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
              {/* Welcome Section */}
              <div className="mb-6">
                <h1 className="text-2xl font-bold font-bricolage text-gray-900 mb-2">
                  {isLogin ? "Welcome Back" : "Create Account"}
                </h1>
                <p className="text-gray-600 text-sm">
                  {isLogin
                    ? "Sign in to access your salon management dashboard"
                    : "Register as a salon owner to manage your business"}
                </p>
              </div>

              {/* Auth Toggle Tabs */}
              <div className="bg-gray-100 rounded-lg p-1 mb-6">
                <div className="grid grid-cols-2 gap-1">
                  <button
                    onClick={() => {
                      setIsLogin(true);
                      registerForm.reset();
                      setShowPassword(false);
                    }}
                    className={`py-3 px-4 rounded-md font-semibold text-sm transition-all duration-200 ${isLogin
                      ? 'bg-teal-600 text-white shadow-sm'
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
                    className={`py-3 px-4 rounded-md font-semibold text-sm transition-all duration-200 ${!isLogin
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                      }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {/* Form Container */}
              <div className="space-y-4">

                {isLogin ? (
                  <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                    {/* Email Input */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <Input
                        type="email"
                        placeholder="Email Address"
                        className="h-14 pl-12 pr-4 text-gray-700 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500"
                        {...loginForm.register("email")}
                      />
                      {loginForm.formState.errors.email && (
                        <p className="text-sm text-red-500 mt-2">
                          {loginForm.formState.errors.email.message}
                        </p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="h-14 pl-12 pr-12 text-gray-700 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500"
                        {...loginForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      {loginForm.formState.errors.password && (
                        <p className="text-sm text-red-500 mt-2">
                          {loginForm.formState.errors.password.message}
                        </p>
                      )}
                    </div>

                    {/* Login Button */}
                    <button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full h-14 text-white font-semibold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 mt-8"
                    >
                      {loginMutation.isPending ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Signing in...
                        </div>
                      ) : (
                        "Sign in"
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                    {/* Full Name Input */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <User className="w-5 h-5" />
                      </div>
                      <Input
                        placeholder="Full Name"
                        className="h-14 pl-12 pr-4 text-gray-700 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500"
                        {...registerForm.register("name")}
                      />
                      {registerForm.formState.errors.name && (
                        <p className="text-sm text-red-500 mt-2">{registerForm.formState.errors.name.message}</p>
                      )}
                    </div>

                    {/* Email Input */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Mail className="w-5 h-5" />
                      </div>
                      <Input
                        type="email"
                        placeholder="Email Address"
                        className="h-14 pl-12 pr-4 text-gray-700 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500"
                        {...registerForm.register("email")}
                      />
                      {registerForm.formState.errors.email && (
                        <p className="text-sm text-red-500 mt-2">{registerForm.formState.errors.email.message}</p>
                      )}
                    </div>

                    {/* Phone Input */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Phone className="w-5 h-5" />
                      </div>
                      <Input
                        type="tel"
                        placeholder="Phone Number"
                        className="h-14 pl-12 pr-4 text-gray-700 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500"
                        {...registerForm.register("phone")}
                      />
                      {registerForm.formState.errors.phone && (
                        <p className="text-sm text-red-500 mt-2">{registerForm.formState.errors.phone.message}</p>
                      )}
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                        <Lock className="w-5 h-5" />
                      </div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className="h-14 pl-12 pr-12 text-gray-700 bg-gray-100 border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 placeholder-gray-500"
                        {...registerForm.register("password")}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      {registerForm.formState.errors.password && (
                        <p className="text-sm text-red-500 mt-2">{registerForm.formState.errors.password.message}</p>
                      )}
                    </div>



                    {/* Create Account Button */}
                    <button
                      type="submit"
                      disabled={registerMutation.isPending}
                      className="w-full h-14 text-white font-semibold bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200 mt-8"
                    >
                      {registerMutation.isPending ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating account...
                        </div>
                      ) : (
                        "Create Account"
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Security Features */}
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mt-6">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Shield className="w-4 h-4 text-teal-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-teal-900 text-sm mb-1">
                      Enhanced Security
                    </h4>
                    <p className="text-teal-700 text-xs leading-relaxed">
                      {isLogin
                        ? "Admin accounts have additional security measures including session monitoring and access logging."
                        : "All salon owner accounts require email and phone verification for enhanced security."
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Login Link */}
              <div className="text-center mt-8">
                <p className="text-gray-600">
                  Not a salon owner?{" "}
                  <button
                    type="button"
                    onClick={onSwitchToCustomer}
                    className="text-orange-500 font-medium hover:underline"
                  >
                    Customer Login
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}