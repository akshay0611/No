import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

const locationSchema = z.object({
    manualLocation: z
        .string()
        .min(3, "Location must be at least 3 characters")
        .max(200, "Location must not exceed 200 characters")
        .transform((val) => val.trim()),
});

type LocationForm = z.infer<typeof locationSchema>;

interface LocationInputModalProps {
    isOpen: boolean;
    onClose: () => void;
    salonId: string;
    onSuccess: () => void;
}

export default function LocationInputModal({
    isOpen,
    onClose,
    salonId,
    onSuccess,
}: LocationInputModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const form = useForm<LocationForm>({
        resolver: zodResolver(locationSchema),
        defaultValues: {
            manualLocation: "",
        },
        mode: "onChange",
    });

    const updateLocationMutation = useMutation({
        mutationFn: async (data: LocationForm) => {
            return api.salons.update(salonId, { manualLocation: data.manualLocation });
        },
        onSuccess: () => {
            toast({
                title: "Location Saved!",
                description: "Your salon location has been updated successfully.",
            });

            // Invalidate salon queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
            queryClient.invalidateQueries({ queryKey: [`/api/salons/${salonId}`] });

            // Call the success callback
            onSuccess();

            // Reset form and close modal
            form.reset();
            onClose();
        },
        onError: (error: any) => {
            toast({
                title: "Error",
                description: error.message || "Failed to update location. Please try again.",
                variant: "destructive",
            });
        },
    });

    const handleSubmit = async (data: LocationForm) => {
        setIsLoading(true);
        try {
            await updateLocationMutation.mutateAsync(data);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-md w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto rounded-2xl sm:rounded-3xl border-0 shadow-2xl p-4 sm:p-6">
                <DialogHeader className="text-center pb-2 sm:pb-3">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                        <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <DialogTitle className="text-lg sm:text-2xl font-bold text-gray-900 leading-tight px-2">
                        Help your customers find you easily 🗺️
                    </DialogTitle>
                    <p className="text-sm sm:text-base text-gray-600 mt-2 px-2">
                        Add a short address or landmark that'll appear on your salon card.
                    </p>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 sm:space-y-6 pt-2 sm:pt-4">
                    {/* Location Input */}
                    <div className="space-y-2">
                        <label className="text-xs sm:text-sm font-semibold text-gray-700 flex items-center gap-2">
                            <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                            Location <span className="text-red-500">*</span>
                        </label>
                        <Input
                            placeholder="e.g. Sector 14, Gurgaon"
                            className="h-11 sm:h-12 rounded-xl border-2 border-gray-200 focus:border-teal-500 focus:ring-0 bg-gray-50/50 transition-all duration-300 text-sm sm:text-base"
                            {...form.register("manualLocation")}
                        />
                        {form.formState.errors.manualLocation && (
                            <p className="text-xs sm:text-sm text-red-500">
                                {form.formState.errors.manualLocation.message}
                            </p>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="bg-teal-50 border border-teal-200 rounded-xl p-3 sm:p-4">
                        <div className="flex items-start gap-2 sm:gap-3">
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-teal-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-teal-600" />
                            </div>
                            <div>
                                <h4 className="font-semibold text-teal-900 text-xs sm:text-sm mb-1">
                                    Why do we need this?
                                </h4>
                                <p className="text-teal-700 text-xs leading-relaxed">
                                    A clear location helps customers find your salon easily. This will be displayed on your salon card to help them identify your location quickly.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-3 pt-1 sm:pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 h-11 sm:h-12 rounded-xl border-2 border-gray-200 hover:bg-gray-50 text-sm sm:text-base"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !form.formState.isValid}
                            className="flex-1 h-11 sm:h-12 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300 text-sm sm:text-base"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span className="hidden sm:inline">Saving...</span>
                                    <span className="sm:hidden">Save</span>
                                </div>
                            ) : (
                                <>
                                    <span className="hidden sm:inline">Save & Continue</span>
                                    <span className="sm:hidden">Save</span>
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Privacy Note */}
                    <div className="text-center pt-1 sm:pt-2">
                        <p className="text-[10px] sm:text-xs text-gray-500 leading-tight">
                            This location will be visible to customers browsing your salon
                        </p>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
