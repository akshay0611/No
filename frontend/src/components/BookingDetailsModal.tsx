import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User, Mail, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const profileCompletionSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name is too long"),
  email: z.string().min(1, "Email is required").email("Please enter a valid email"),
});

type ProfileCompletionForm = z.infer<typeof profileCompletionSchema>;

interface BookingDetailsModalProps {
  isOpen: boolean;
  onComplete: (details: { name: string; email?: string }) => void;
  onCancel: () => void;
  salonName?: string;
}

export default function BookingDetailsModal({
  isOpen,
  onComplete,
  onCancel,
  salonName = "the salon"
}: BookingDetailsModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<ProfileCompletionForm>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      name: "",
      email: "",
    },
    mode: "onChange",
  });

  const handleSubmit = async (data: ProfileCompletionForm) => {
    setIsLoading(true);

    try {
      const { api } = await import("../lib/api");
      await api.auth.completeProfile(data.name, data.email);

      toast({
        title: "Profile Updated!",
        description: "Your booking details have been saved.",
      });

      onComplete({
        name: data.name,
        email: data.email,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md mx-4 rounded-3xl border-0 shadow-2xl">
        <DialogHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold text-gray-900">
            Complete Your Booking
          </DialogTitle>
          <p className="text-gray-600 mt-2">
            We need a few details to confirm your booking at <span className="font-semibold">{salonName}</span>
          </p>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
          {/* Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <User className="w-4 h-4" />
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              placeholder="Enter your full name"
              className="h-12 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              placeholder="Enter your email address"
              className="h-12 rounded-xl border-2 border-gray-200 focus:border-purple-500 focus:ring-0 bg-gray-50/50 transition-all duration-300"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500">
                {form.formState.errors.email.message}
              </p>
            )}
            <p className="text-xs text-gray-500">
              We'll send booking confirmations and updates to this email
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-purple-900 text-sm mb-1">
                  Why do we need this?
                </h4>
                <p className="text-purple-700 text-xs leading-relaxed">
                  Your name helps the salon staff identify you when it's your turn. 
                  Email is required for booking confirmations and updates.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl border-2 border-gray-200 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !form.formState.isValid}
              className="flex-1 h-12 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Saving...
                </div>
              ) : (
                "Complete Booking"
              )}
            </Button>
          </div>

          {/* Privacy Note */}
          <div className="text-center pt-2">
            <p className="text-xs text-gray-500">
              Your information is secure and will only be used for booking purposes
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}