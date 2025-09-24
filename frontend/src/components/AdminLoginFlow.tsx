import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, Lock, Eye, EyeOff, Shield, UserCheck, User, Phone, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "../lib/api";
import { loginSchema, insertUserSchema } from "../lib/schemas";
import OTPVerification from "./OTPVerification";


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
  const [flow, setFlow] = useState<"login" | "register">("login");
  const [showOTPVerification, setShowOTPVerification] = useState(false);
  const [registeredUser, setRegisteredUser] = useState<any>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const { toast } = useToast();

  const loginForm = useForm<AdminLoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onChange",
  });

  const onLoginSubmit = (values: AdminLoginForm) => {
    loginMutation.mutate(values);
  };

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
          title: "Login Successful!",
          description: "Welcome back to SmartQ Admin!",
        });
        setGeneralError(null);
        onAuthSuccess(data.user, data.token);
      } else {
        setGeneralError("Access Denied: This account is not authorized for admin access.");
      }
    },
    onError: (error: any) => {
      setGeneralError(error.message || "Invalid email or password. Please try again.");
    },
  });

  const registerMutation = useMutation({
    mutationFn: api.auth.register,
    onSuccess: (data) => {
      setRegisteredUser(data);
      setShowOTPVerification(true);
      toast({
        title: "Registration Successful!",
        description: "Please verify your email and phone number to continue.",
      });
      setGeneralError(null);
    },
    onError: (error: any) => {
      setGeneralError(error.message || "Registration failed. Please try again.");
    },
  });

  const verifyOTPMutation = useMutation({
    mutationFn: api.auth.verifyOTP,
    onSuccess: async (data) => {
      toast({
        title: "Verification Successful!",
        description: "You can now log in.",
      });
      setShowOTPVerification(false);
      setFlow("login");
      setGeneralError(null);
  
      // Attempt to auto-login if password was stored
      if (registeredUser?.password) {
        try {
          await loginMutation.mutateAsync({
            email: registeredUser.email,
            password: registeredUser.password,
          });
        } catch (error) {
          console.error('Auto-login after verification failed:', error);
          setGeneralError("Verification complete, but auto-login failed. Please login manually.");
        }
      }
    },
    onError: (error: any) => {
      setGeneralError(error.message || "OTP verification failed. Please try again.");
    },
  });

  const resendOTPMutation = useMutation({
    mutationFn: api.auth.resendOTP,
    onSuccess: () => {
      toast({
        title: "OTP Resent",
        description: "A new OTP has been sent to your email and phone.",
      });
      setGeneralError(null);
    },
    onError: (error: any) => {
      setGeneralError(error.message || "Failed to resend OTP. Please try again.");
    },
  });

  const handleLoginSubmit = loginForm.handleSubmit((data) => {
    setGeneralError(null);
    loginMutation.mutate(data);
  });

  const handleRegisterSubmit = registerForm.handleSubmit((data) => {
    setGeneralError(null);
    registerMutation.mutate(data);
  });

  const handleOTPVerificationSubmit = async (otp: string) => {
    setGeneralError(null);
    if (registeredUser?.id) {
      verifyOTPMutation.mutate({ userId: registeredUser.id, otp });
    }
  };

  const handleResendOTP = () => {
    setGeneralError(null);
    if (registeredUser?.id) {
      resendOTPMutation.mutate({ userId: registeredUser.id });
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <div className="w-full max-w-md space-y-8">
        {generalError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{generalError}</AlertDescription>
          </Alert>
        )}
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