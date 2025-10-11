import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Phone, User, Shield, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "../lib/api";

const profileCompletionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 digits"),
});

type ProfileCompletionForm = z.infer<typeof profileCompletionSchema>;

interface AdminProfileCompletionProps {
  user: {
    id: string;
    email: string;
    name?: string;
    phone?: string;
    profileImage?: string;
    role: string;
  };
  onCompletion: (user: any, token: string) => void;
  onSkip?: () => void;
}

export default function AdminProfileCompletion({
  user,
  onCompletion,
  onSkip
}: AdminProfileCompletionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileCompletionForm>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      name: user.name || "",
      phone: user.phone || "",
    },
    mode: "onChange",
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileCompletionForm) => {
      // Update user profile with additional details
      const response = await api.auth.updateProfile({
        name: data.name,
        phone: data.phone,
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Updated!",
        description: "Your admin profile has been completed successfully.",
      });
      
      // Get updated token and proceed
      const updatedUser = { ...user, ...data };
      onCompletion(updatedUser, localStorage.getItem('smartq_token') || '');
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = async (data: ProfileCompletionForm) => {
    setIsLoading(true);
    try {
      await updateProfileMutation.mutateAsync(data);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      // Proceed with incomplete profile
      onCompletion(user, localStorage.getItem('smartq_token') || '');
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
        <div className="flex-1 flex flex-col justify-center items-center px-4 py-6">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <img
              src="/loadlogo.png"
              alt="SmartQ Logo"
              className="h-16 w-auto drop-shadow-2xl"
            />
          </div>

          {/* Profile Completion Card */}
          <div className="w-full max-w-sm bg-white/95 backdrop-blur-md rounded-2xl px-6 py-6 shadow-2xl border border-white/20">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">Complete Your Profile</h1>
              </div>
              <p className="text-gray-500 text-xs leading-relaxed">
                Please provide additional details to complete your admin account setup.
              </p>
            </div>

            {/* User Info Preview */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mb-5">
              <div className="flex items-center gap-3">
                <img
                  src={user.profileImage || "/men.jpeg"}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-semibold text-teal-900 text-sm">
                    {user.name || "Google User"}
                  </p>
                  <p className="text-teal-700 text-xs">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name Input */}
              <div className="relative">
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
                  <User className="w-4 h-4" />
                </div>
                <Input
                  placeholder="Full Name"
                  className="h-11 pl-11 pr-4 text-gray-900 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:border-teal-500 focus:bg-white placeholder-gray-400 transition-all text-sm"
                  {...form.register("name")}
                  autoComplete="name"
                />
                {form.formState.errors.name && (
                  <p className="text-xs text-red-600 mt-1 ml-1">
                    {form.formState.errors.name.message}
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
                  {...form.register("phone")}
                  autoComplete="tel"
                />
                {form.formState.errors.phone && (
                  <p className="text-xs text-red-600 mt-1 ml-1">
                    {form.formState.errors.phone.message}
                  </p>
                )}
              </div>

              {/* Required Fields Info */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-amber-900 text-xs mb-1">
                      Required for Admin Access
                    </h4>
                    <p className="text-amber-700 text-xs leading-relaxed">
                      Phone number is required for salon management and customer communication.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 mt-6">
                <Button
                  type="submit"
                  disabled={isLoading || !form.formState.isValid}
                  className="w-full h-11 text-white font-semibold bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Completing Profile...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Complete Profile
                    </div>
                  )}
                </Button>

                {onSkip && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSkip}
                    className="w-full h-11 text-gray-600 border-gray-300 hover:bg-gray-50 rounded-xl text-sm"
                  >
                    Complete Later
                  </Button>
                )}
              </div>
            </form>

            {/* Benefits */}
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 mt-5">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-teal-900 text-xs mb-1">
                    Why This Matters
                  </h4>
                  <ul className="text-teal-700 text-xs space-y-0.5">
                    <li>• Customer communication & notifications</li>
                    <li>• Salon management & scheduling</li>
                    <li>• Business analytics & reporting</li>
                  </ul>
                </div>
              </div>
            </div>
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
