import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Tag, ShoppingCart, Clock, CheckCircle2, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useProfileCompletion } from "../hooks/useProfileCompletion";
import BookingDetailsModal from "../components/BookingDetailsModal";
import BookingSuccessAnimation from "../components/BookingSuccessAnimation";
import { PhoneVerificationModal } from "../components/PhoneVerificationModal";
import { api } from "../lib/api";
import type { Offer } from "../types";

export default function QueueSummary() {
  const [, setLocation] = useLocation();

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  const { user } = useAuth();
  const { items, removeItem, clearCart, getTotalPrice } = useCart();
  const { toast } = useToast();
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const {
    isModalOpen,
    isPhoneModalOpen,
    requireProfileCompletion,
    completeProfile,
    completePhoneVerification,
    cancelProfileCompletion
  } = useProfileCompletion();

  // Fetch offers for the salon
  const { data: availableOffers = [], isLoading: offersLoading } = useQuery<Offer[]>({
    queryKey: ['salonOffers', items[0]?.salonId],
    queryFn: () => {
      if (!items[0]?.salonId) return [];
      return api.offers.getBySalon(items[0].salonId);
    },
    enabled: !!items[0]?.salonId,
  });

  const subtotal = getTotalPrice();
  const discountAmount = selectedOffer ? (subtotal * selectedOffer.discount) / 100 : 0;

  // Calculate loyalty discount
  const salonId = items[0]?.salonId;
  const salonPoints = user?.salonLoyaltyPoints?.[salonId] || 0;
  const loyaltyDiscount = salonPoints >= 100 ? 20 : salonPoints >= 50 ? 10 : 0;
  const loyaltyDiscountAmount = loyaltyDiscount > 0 ? (subtotal * loyaltyDiscount) / 100 : 0;

  // Round to nearest integer to avoid floating point issues
  const finalTotal = Math.round(subtotal - discountAmount - loyaltyDiscountAmount);

  const joinQueueMutation = useMutation({
    mutationFn: async () => {
      if (!user || items.length === 0) throw new Error("Invalid request");

      // Send multiple services with total pricing
      const serviceIds = items.map(item => item.service.id);
      const appliedOfferIds = selectedOffer ? [selectedOffer.id] : [];

      return api.queue.join({
        userId: user.id,
        salonId: items[0].salonId,
        serviceIds: serviceIds,
        totalPrice: finalTotal, // Send as number, schema will convert to string
        appliedOffers: appliedOfferIds
      });
    },
    onSuccess: () => {
      // Show success animation
      setShowSuccessAnimation(true);
    },
    onError: (error) => {
      toast({
        title: "Failed to join queue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApplyOffer = (offer: Offer) => {
    if (selectedOffer?.id === offer.id) {
      setSelectedOffer(null);
    } else {
      setSelectedOffer(offer);
    }
  };

  const handleSuccessAnimationComplete = () => {
    toast({
      title: "Successfully joined queue!",
      description: `You've been added to the queue with ${items.length} service${items.length > 1 ? 's' : ''}.`,
    });
    clearCart();
    setLocation('/queue');
  };

  const handleConfirmAndJoin = () => {
    if (!user) {
      setLocation('/auth');
      return;
    }

    // Use profile completion hook to ensure user has complete profile
    requireProfileCompletion(() => {
      joinQueueMutation.mutate();
    });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-2 border-teal-100 shadow-xl">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="w-24 h-24 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="w-12 h-12 text-teal-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Your Cart is Empty</h1>
            <p className="text-gray-600 mb-8 text-lg">Discover amazing services and add them to your cart</p>
            <Button
              onClick={() => setLocation('/')}
              className="w-full min-h-[48px] bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold text-base rounded-xl shadow-lg"
            >
              Browse Salons
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
        <BookingSuccessAnimation
          onComplete={handleSuccessAnimationComplete}
          salonName={items[0]?.salonName}
          serviceCount={items.length}
        />
      )}

      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 py-6 md:py-8 pb-32 md:pb-8">
        <div className="max-w-3xl mx-auto px-4">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(`/salon/${items[0]?.salonId}`)}
              className="mr-3 hover:bg-teal-100 rounded-xl"
            >
              <ArrowLeft className="w-6 h-6 text-teal-600" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Checkout
              </h1>
              <p className="text-gray-600 text-sm mt-1">Review your booking details</p>
            </div>
          </div>

          {/* Selected Services */}
          <Card className="mb-6 border border-teal-100">
            <CardHeader className="border-b border-teal-100 bg-gray-50/50">
              <CardTitle className="text-xl text-gray-900">
                Your Services
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {items.length} service{items.length > 1 ? 's' : ''} at {items[0]?.salonName}
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {items.map((item) => (
                  <div
                    key={item.service.id}
                    className="flex items-start justify-between py-3 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1 capitalize">
                        {item.service.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        <Clock className="w-3 h-3" />
                        <span>{item.service.duration} min</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-teal-600">
                        ₹{item.service.price}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(item.service.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Offers */}
          <Card className="mb-6 border border-teal-100">
            <CardHeader className="border-b border-teal-100 bg-gray-50/50">
              <CardTitle className="text-xl text-gray-900">
                Special Offers
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">Save more on your booking</p>
            </CardHeader>
            <CardContent className="pt-4">
              {offersLoading ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">Loading offers...</p>
                </div>
              ) : availableOffers.length > 0 ? (
                <div className="space-y-3">
                  {availableOffers.map((offer: Offer) => (
                    <div
                      key={offer.id}
                      className={`relative rounded-lg transition-all p-4 border ${selectedOffer?.id === offer.id
                        ? 'bg-teal-50 border-teal-300 border-2'
                        : 'bg-white border-teal-100 hover:border-teal-200'
                        }`}
                    >
                      {selectedOffer?.id === offer.id && (
                        <div className="absolute -top-2 -right-2">
                          <div className="bg-green-600 rounded-full p-1">
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          </div>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-teal-600 text-white font-semibold px-2 py-0.5 text-sm">
                            {offer.discount}% OFF
                          </Badge>
                          <h4 className="font-semibold text-gray-900">{offer.title}</h4>
                        </div>
                      </div>

                      <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                        {offer.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Valid until {new Date(offer.validityPeriod).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>

                        <Button
                          size="sm"
                          variant={selectedOffer?.id === offer.id ? "default" : "outline"}
                          onClick={() => handleApplyOffer(offer)}
                          className={`h-7 text-xs ${selectedOffer?.id === offer.id
                            ? 'bg-teal-600 hover:bg-teal-700 text-white'
                            : 'border-teal-600 text-teal-600 hover:bg-teal-50'
                            }`}
                        >
                          {selectedOffer?.id === offer.id ? 'Applied' : 'Apply'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Tag className="w-6 h-6 text-teal-600" />
                  </div>
                  <p className="text-gray-600 text-sm">No offers available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bill Summary */}
          <Card className="mb-6 border border-teal-100">
            <CardHeader className="border-b border-teal-100 bg-gray-50/50">
              <CardTitle className="text-xl text-gray-900">
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between items-center text-gray-700">
                  <span className="font-medium">
                    Subtotal ({items.length} service{items.length > 1 ? 's' : ''})
                  </span>
                  <span className="text-lg font-semibold">₹{Math.round(subtotal)}</span>
                </div>

                {/* Offer Discount */}
                {selectedOffer && (
                  <div className="flex justify-between items-center p-3 bg-green-50 border-2 border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <div>
                        <span className="font-semibold text-green-700 block">
                          {selectedOffer.title}
                        </span>
                        <span className="text-xs text-green-600">
                          {selectedOffer.discount}% discount applied
                        </span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      -₹{Math.round(discountAmount)}
                    </span>
                  </div>
                )}

                {/* Loyalty Discount */}
                {loyaltyDiscount > 0 && (
                  <div className="flex justify-between items-center p-3 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                      <div>
                        <span className="font-semibold text-amber-700 block">
                          Loyalty Rewards
                        </span>
                        <span className="text-xs text-amber-600">
                          {loyaltyDiscount}% OFF • {salonPoints} points
                        </span>
                      </div>
                    </div>
                    <span className="text-lg font-bold text-amber-600">
                      -₹{Math.round(loyaltyDiscountAmount)}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t-2 border-dashed border-teal-200 my-4"></div>

                {/* Total */}
                <div className="flex justify-between items-center p-3 bg-teal-50 rounded-lg border border-teal-200">
                  <span className="text-base font-semibold text-gray-900">Total Amount</span>
                  <span className="text-xl font-bold text-teal-600">
                    ₹{Math.round(finalTotal)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confirm Button */}
          <div className="mt-6 mb-4">
            <Button
              onClick={handleConfirmAndJoin}
              disabled={joinQueueMutation.isPending}
              className="w-full h-11 text-sm font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-sm transition-all"
            >
              {joinQueueMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Join Queue</span>
                </div>
              )}
            </Button>

            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-2 mt-3 text-xs text-gray-500">
              <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />
              </div>
              <span className="text-center">Secure booking • No payment required</span>
            </div>
          </div>

          {/* Profile Completion Modal */}
          <BookingDetailsModal
            isOpen={isModalOpen}
            onComplete={completeProfile}
            onCancel={cancelProfileCompletion}
            salonName={items[0]?.salonName || "the salon"}
          />

          {/* Phone Verification Modal */}
          <PhoneVerificationModal
            isOpen={isPhoneModalOpen}
            onClose={cancelProfileCompletion}
            onVerified={completePhoneVerification}
          />
        </div>
      </div>
    </>
  );
}