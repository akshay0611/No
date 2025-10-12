import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Trash2, Tag, ShoppingCart, Clock, CheckCircle2, Sparkles, Receipt, Star } from "lucide-react";
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
  const { user } = useAuth();
  const { items, removeItem, clearCart, getTotalPrice } = useCart();
  const { toast } = useToast();
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [expandedOffers, setExpandedOffers] = useState<Set<string>>(new Set());
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
  
  const finalTotal = subtotal - discountAmount - loyaltyDiscountAmount;

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
          <Card className="mb-6 border-2 border-teal-100 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 border-b-2 border-teal-100">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-2 rounded-xl">
                  <ShoppingCart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="text-gray-900">Your Services</span>
                  <p className="text-sm font-normal text-gray-600 mt-1">
                    {items.length} service{items.length > 1 ? 's' : ''} selected at {items[0]?.salonName}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div
                    key={item.service.id}
                    className="group relative bg-gradient-to-br from-white to-teal-50/30 border-2 border-gray-100 hover:border-teal-200 rounded-xl p-4 transition-all"
                  >
                    {/* Service Number Badge */}
                    <div className="absolute -top-2 -left-2 w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                      {index + 1}
                    </div>

                    <div className="flex items-start justify-between ml-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900 text-lg mb-2 capitalize">
                          {item.service.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                          <div className="flex items-center space-x-1 text-gray-600">
                            <Clock className="w-4 h-4 text-teal-600" />
                            <span className="font-medium">{item.service.duration} min</span>
                          </div>
                          {item.service.description && (
                            <span className="text-gray-500 text-xs line-clamp-1">
                              {item.service.description}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 ml-4">
                        <div className="text-right">
                          <span className="text-2xl font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                            ₹{item.service.price}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(item.service.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg min-w-[44px] min-h-[44px]"
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Available Offers */}
          <Card className="mb-6 border-0 shadow-xl overflow-hidden">
            {/* Header with Gradient */}
            <div className="relative bg-gradient-to-br from-teal-50 to-cyan-50 px-6 py-6 border-b-2 border-teal-100">
              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-teal-200/20 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-200/20 rounded-full -ml-12 -mb-12"></div>

              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Tag className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">Special Offers</h3>
                  <p className="text-gray-600 text-sm mt-0.5">Save more on your booking</p>
                </div>
              </div>
            </div>

            <CardContent className="p-4">
              {offersLoading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">Loading offers...</p>
                </div>
              ) : availableOffers.length > 0 ? (
                <div className="space-y-4">
                  {availableOffers.map((offer: Offer) => (
                    <div
                      key={offer.id}
                      className={`relative rounded-2xl transition-all duration-300 ${selectedOffer?.id === offer.id
                        ? 'bg-gradient-to-br from-teal-50 to-cyan-50 border-2 border-teal-300 shadow-lg'
                        : 'bg-white border-2 border-gray-200 hover:border-teal-200 hover:shadow-md'
                        }`}
                    >
                      {selectedOffer?.id === offer.id && (
                        <div className="absolute -top-3 -right-3 z-10">
                          <div className="relative">
                            <div className="absolute inset-0 bg-green-400 rounded-full blur opacity-40"></div>
                            <div className="relative bg-gradient-to-br from-green-500 to-emerald-500 rounded-full p-2 shadow-lg">
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="p-5">
                        {/* Discount Badge */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-full blur opacity-30"></div>
                            <Badge className="relative bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold px-4 py-1.5 text-base shadow-md">
                              {offer.discount}% OFF
                            </Badge>
                          </div>
                          <Sparkles className="w-5 h-5 text-from-teal-500 to-cyan-500 animate-pulse" />
                        </div>

                        {/* Title */}
                        <h4 className="font-bold text-gray-900 text-lg mb-2">{offer.title}</h4>

                        {/* Description with Read More */}
                        <div className="mb-3">
                          <p className="text-sm text-gray-600 leading-relaxed">
                            {expandedOffers.has(offer.id)
                              ? offer.description
                              : offer.description.length > 100
                                ? `${offer.description.slice(0, 100)}...`
                                : offer.description
                            }
                          </p>
                          {offer.description.length > 100 && (
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedOffers);
                                if (expandedOffers.has(offer.id)) {
                                  newExpanded.delete(offer.id);
                                } else {
                                  newExpanded.add(offer.id);
                                }
                                setExpandedOffers(newExpanded);
                              }}
                              className="text-teal-600 hover:text-teal-700 font-semibold text-sm mt-2 inline-flex items-center gap-1 transition-colors"
                            >
                              {expandedOffers.has(offer.id) ? 'Read Less' : 'Read More'}
                              <span className="text-xs">{expandedOffers.has(offer.id) ? '↑' : '↓'}</span>
                            </button>
                          )}
                        </div>

                        {/* Validity */}
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Valid until {new Date(offer.validityPeriod).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                        </div>

                        {/* Apply Button */}
                        <Button
                          variant={selectedOffer?.id === offer.id ? "default" : "outline"}
                          onClick={() => handleApplyOffer(offer)}
                          className={`w-full mt-4 h-12 font-bold rounded-xl transition-all duration-300 ${selectedOffer?.id === offer.id
                            ? 'bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white shadow-lg'
                            : 'border-2 border-teal-600 text-teal-600 hover:bg-teal-50'
                            }`}
                        >
                          {selectedOffer?.id === offer.id ? (
                            <span className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5" />
                              Applied
                            </span>
                          ) : (
                            "Apply"
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Tag className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No offers available</p>
                  <p className="text-gray-500 text-sm mt-1">Check back later for special deals</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bill Summary */}
          <Card className="mb-6 border-2 border-teal-200 shadow-xl bg-gradient-to-br from-white to-teal-50">
            <CardHeader className="border-b-2 border-teal-100">
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-2 rounded-xl">
                  <Receipt className="w-6 h-6 text-white" />
                </div>
                <span className="text-gray-900">Payment Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Subtotal */}
                <div className="flex justify-between items-center text-gray-700">
                  <span className="font-medium">
                    Subtotal ({items.length} service{items.length > 1 ? 's' : ''})
                  </span>
                  <span className="text-lg font-semibold">₹{subtotal.toFixed(2)}</span>
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
                      -₹{discountAmount.toFixed(2)}
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
                      -₹{loyaltyDiscountAmount.toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Divider */}
                <div className="border-t-2 border-dashed border-teal-200 my-4"></div>

                {/* Total */}
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-teal-100 to-cyan-100 rounded-xl">
                  <span className="text-xl font-bold text-gray-900">Total Amount</span>
                  <span className="text-3xl font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                    ₹{finalTotal.toFixed(2)}
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
              className="w-full min-h-[56px] text-base md:text-lg font-bold bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-xl shadow-lg transition-all active:scale-[0.98]"
            >
              {joinQueueMutation.isPending ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirm & Join Queue</span>
                  </div>

                </div>
              )}
            </Button>

            {/* Trust Badge */}
            <div className="flex items-center justify-center gap-2 mt-4 text-sm text-gray-600">
              <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-3 h-3 text-green-600" />
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