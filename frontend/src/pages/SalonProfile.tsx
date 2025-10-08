import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Tag, Heart, ShoppingCart, Percent, Sparkles, Scissors, Palette, TrendingUp, Zap, ArrowLeft } from "lucide-react";
import { GoogleMap, useLoadScript, MarkerF } from "@react-google-maps/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import type { SalonDetails, Offer } from "../types";

// Helper function to get service icon
const getServiceIcon = (serviceName: string) => {
  const name = serviceName.toLowerCase();
  if (name.includes('cut') || name.includes('trim') || name.includes('shave')) {
    return Scissors;
  } else if (name.includes('color') || name.includes('dye') || name.includes('highlight')) {
    return Palette;
  } else if (name.includes('style') || name.includes('blow')) {
    return Sparkles;
  }
  return Scissors; // Default icon
};

// Helper function to determine if service is popular (mock logic - can be replaced with real data)
const isPopularService = (_serviceId: string, index: number) => {
  // For demo purposes, mark first service as popular
  return index === 0;
};

export default function SalonProfile() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, updateUser } = useAuth();
  const { addItem, items, getItemCount } = useCart();
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [expandedOffers, setExpandedOffers] = useState<Set<string>>(new Set());

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  const isFavorited = useMemo(() => {
    if (!user || !user.favoriteSalons) return false;
    return user.favoriteSalons.includes(id || "");
  }, [user, id]);

  const addFavoriteMutation = useMutation({
    mutationFn: () => api.users.addFavorite(id!),
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        updateUser(updatedUser);
        toast({
          title: "Added to favorites!",
        });
      }
    },
    onError: () => {
      toast({
        title: "Failed to add favorite",
        variant: "destructive",
      });
    },
  });

  const removeFavoriteMutation = useMutation({
    mutationFn: () => api.users.removeFavorite(id!),
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        updateUser(updatedUser);
        toast({
          title: "Removed from favorites",
        });
      }
    },
    onError: () => {
      toast({
        title: "Failed to remove favorite",
        variant: "destructive",
      });
    },
  });

  const handleFavoriteClick = () => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    if (isFavorited) {
      removeFavoriteMutation.mutate();
    } else {
      addFavoriteMutation.mutate();
    }
  };

  const handleAddToCart = (service: SalonDetails['services'][0]) => {
    if (!user) {
      setLocation('/auth');
      return;
    }
    if (!salon) return;

    addItem(service, salon.id, salon.name);
    toast({
      title: "Service added to cart!",
      description: `${service.name} has been added to your selection.`,
    });
  };

  const isServiceInCart = (serviceId: string) => {
    return items.some(item => item.service.id === serviceId);
  };
  const { toast } = useToast();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string,
    libraries: ["places"],
  });

  const { data: salon, isLoading } = useQuery<SalonDetails>({
    queryKey: ['/api/salons', id],
    enabled: !!id,
  });

  // Fetch salon offers
  const { data: offers = [], isLoading: offersLoading } = useQuery<Offer[]>({
    queryKey: ['salon-offers', id],
    queryFn: () => api.offers.getBySalon(id!),
    enabled: !!id,
  });



  if (isLoading) {
    return (
      <div className="min-h-screen gradient-pink py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-64 bg-muted rounded-2xl mb-8"></div>
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="h-6 bg-muted rounded mb-8"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-96 bg-muted rounded-2xl"></div>
              <div className="h-96 bg-muted rounded-2xl"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!salon) {
    return (
      <div className="min-h-screen gradient-pink flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-foreground mb-4">Salon not found</h1>
            <p className="text-muted-foreground mb-4">The salon you're looking for doesn't exist.</p>
            <Button onClick={() => setLocation('/')} data-testid="button-back-home">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 pb-24 md:pb-8">
      {/* Hero Banner - Using salon's uploaded photos */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-teal-600 to-cyan-600 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        {(salon as any).photos && (salon as any).photos.length > 0 ? (
          <img
            src={(salon as any).photos[0].url}
            alt={salon.name}
            className="absolute inset-0 w-full h-full object-cover opacity-40"
          />
        ) : (
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920')] bg-cover bg-center opacity-30"></div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Salon Header */}
        <div className="mb-8 -mt-16 relative z-10">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-teal-100">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent" data-testid="text-salon-name">
                    {salon.name}
                  </h1>
                  <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white capitalize">
                    {salon.type}
                  </Badge>
                  {user && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleFavoriteClick}
                      disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                      data-testid="button-favorite"
                      className="hover:bg-teal-50"
                    >
                      <Heart className={`h-6 w-6 ${isFavorited ? 'text-red-500 fill-current' : 'text-gray-400'}`} />
                    </Button>
                  )}
                </div>

                {salon.description && (
                  <div className="mb-4 max-w-2xl">
                    <p className="text-gray-600">
                      {isDescriptionExpanded
                        ? salon.description
                        : salon.description.length > 80
                          ? `${salon.description.slice(0, 80)}...`
                          : salon.description
                      }
                    </p>
                    {salon.description.length > 80 && (
                      <button
                        onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                        className="text-teal-600 hover:text-teal-700 font-medium text-sm mt-1 transition-colors"
                      >
                        {isDescriptionExpanded ? 'Read Less' : 'Read More'}
                      </button>
                    )}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5 text-teal-600" />
                    <span data-testid="text-salon-location" className="font-medium capitalize">
                      {salon.manualLocation || salon.location}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-teal-50 px-3 py-1 rounded-full">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span data-testid="text-salon-rating" className="font-semibold text-teal-900">
                      {salon.rating}
                    </span>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {isLoaded && salon.latitude && salon.longitude && (
          <Card className="mb-8">
            <div className="h-64 md:h-80">
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={{ lat: salon.latitude, lng: salon.longitude }}
                zoom={15}
              >
                <MarkerF position={{ lat: salon.latitude, lng: salon.longitude }} />
              </GoogleMap>
            </div>
          </Card>
        )}

        {/* Services Section - Card Layout with Teal Theme */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Services</h2>
              <p className="text-gray-600">Choose from our range of professional services</p>
            </div>
            {getItemCount() > 0 && (
              <Button
                onClick={() => setLocation('/queue-summary')}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                View Cart ({getItemCount()})
              </Button>
            )}
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {salon.services.map((service, index) => {
              const ServiceIcon = getServiceIcon(service.name);
              const isPopular = isPopularService(service.id, index);
              const isExpanded = expandedServices.has(service.id);
              const hasLongDescription = service.description && service.description.length > 100;

              return (
                <Card
                  key={service.id}
                  className="group hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-teal-300 bg-gradient-to-br from-white to-teal-50/30 overflow-hidden relative flex flex-col"
                  data-testid={`service-${service.id}`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute top-4 right-4 z-10">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold px-3 py-1 shadow-lg flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>Most Popular</span>
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-3 pt-6">
                    <div className="flex items-start space-x-4">
                      {/* Service Icon */}
                      <div className="flex-shrink-0 bg-gradient-to-br from-teal-500 to-cyan-500 p-3 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                        <ServiceIcon className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Service Name - Better Typography */}
                        <CardTitle className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors capitalize" data-testid={`text-service-name-${service.id}`}>
                          {service.name}
                        </CardTitle>

                        {/* Service Description with Truncation */}
                        {service.description ? (
                          <div className="space-y-1">
                            <CardDescription className={`text-gray-600 text-sm leading-relaxed ${!isExpanded && hasLongDescription ? 'line-clamp-3' : ''}`}>
                              {service.description}
                            </CardDescription>
                            {hasLongDescription && (
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedServices);
                                  if (isExpanded) {
                                    newExpanded.delete(service.id);
                                  } else {
                                    newExpanded.add(service.id);
                                  }
                                  setExpandedServices(newExpanded);
                                }}
                                className="text-teal-600 hover:text-teal-700 text-xs font-semibold inline-flex items-center"
                              >
                                {isExpanded ? 'Show less' : 'Read more'}
                              </button>
                            )}
                          </div>
                        ) : (
                          <CardDescription className="text-gray-500 text-sm italic">
                            Professional {service.name.toLowerCase()} service
                          </CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4 pb-6 flex-1 flex flex-col">
                    {/* Service Details */}
                    <div className="flex items-center justify-between bg-white/80 backdrop-blur-sm rounded-lg p-3 border border-teal-100 flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        <div className="bg-teal-100 p-2 rounded-lg">
                          <Clock className="w-4 h-4 text-teal-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 font-medium">Duration</p>
                          <p className="text-sm font-bold text-gray-900" data-testid={`text-service-duration-${service.id}`}>
                            {service.duration} minutes
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-xs text-gray-500 font-medium mb-1">Price</p>
                        <div className="flex items-baseline space-x-1">
                          <span className="text-3xl font-extrabold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent" data-testid={`text-service-price-${service.id}`}>
                            ${service.price}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons - Larger touch targets for mobile */}
                    <div className="space-y-2 mt-auto">
                      <Button
                        onClick={() => handleAddToCart(service)}
                        disabled={isServiceInCart(service.id)}
                        className={`w-full min-h-[48px] ${isServiceInCart(service.id)
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                          : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700'
                          } text-white font-bold text-base rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02] active:scale-[0.98]`}
                        data-testid={`button-add-service-${service.id}`}
                      >
                        {isServiceInCart(service.id) ? (
                          <>
                            <span className="mr-2">✓</span>
                            Added to Cart
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-5 h-5 mr-2" />
                            Add to Cart
                          </>
                        )}
                      </Button>

                      {/* Quick Book Option */}
                      {!isServiceInCart(service.id) && (
                        <Button
                          onClick={() => {
                            handleAddToCart(service);
                            setTimeout(() => setLocation('/queue-summary'), 300);
                          }}
                          variant="outline"
                          className="w-full min-h-[44px] border-2 border-teal-600 text-teal-600 hover:bg-teal-50 font-semibold rounded-xl transition-all"
                        >
                          <Zap className="w-4 h-4 mr-2" />
                          Quick Book
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Cart Summary */}
          {getItemCount() > 0 && (
            <Card className="mt-6 bg-gradient-to-r from-teal-50 to-cyan-50 border-2 border-teal-200">
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-gray-700 font-medium mb-4">
                    {getItemCount()} service{getItemCount() > 1 ? 's' : ''} selected • Ready to book
                  </p>
                  <Button
                    onClick={() => setLocation('/queue-summary')}
                    className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    Proceed to Checkout
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Offers Section */}
        <Card className="mt-8 mb-8 border-2 border-teal-100 bg-gradient-to-br from-white to-teal-50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-2xl">
              <Tag className="h-6 w-6 text-teal-600" />
              <span className="text-gray-900">Exclusive Offers</span>
            </CardTitle>
            <CardDescription className="text-gray-600">
              Save more with our special promotions and limited-time deals
            </CardDescription>
          </CardHeader>
          <CardContent>
            {offersLoading ? (
              <div className="text-center py-4">
                <p className="text-gray-500">Loading offers...</p>
              </div>
            ) : offers.length > 0 ? (
              <div className="space-y-4">
                {offers.map((offer: Offer) => (
                  <div key={offer.id} className="p-5 bg-white border-2 border-teal-100 rounded-xl hover:border-teal-300 hover:shadow-md transition-all">
                    <div className="flex items-center space-x-3 mb-3">
                      <Badge className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold px-3 py-1">
                        {offer.discount}% OFF
                      </Badge>
                      <h4 className="font-bold text-gray-900 text-lg">{offer.title}</h4>
                    </div>
                    <div className="mb-3">
                      <p className="text-gray-600 text-sm">
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
                          className="text-teal-600 hover:text-teal-700 font-medium text-xs mt-1 transition-colors"
                        >
                          {expandedOffers.has(offer.id) ? 'Read Less' : 'Read More'}
                        </button>
                      )}
                    </div>
                    <div className="flex items-center space-x-2 text-sm text-gray-500 mb-4">
                      <Clock className="w-4 h-4" />
                      <span>
                        Valid until {new Date(offer.validityPeriod).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <Button
                      onClick={() => {
                        if (getItemCount() > 0) {
                          setLocation('/queue-summary');
                        } else {
                          toast({
                            title: "Add services first",
                            description: "Please add services to your cart before applying an offer.",
                          });
                        }
                      }}
                      className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold"
                      data-testid={`button-apply-offer-${offer.id}`}
                    >
                      Apply Offer
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Percent className="w-10 h-10 text-teal-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Offers</h3>
                <p className="text-gray-600">Check back soon for exciting deals and promotions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reviews Section */}
        <Card className="mt-8 border-2 border-teal-100">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center space-x-2 text-2xl mb-2">
                  <Star className="h-6 w-6 text-teal-600" />
                  <span className="text-gray-900">Customer Reviews</span>
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {salon.reviews.length > 0
                    ? `See what ${salon.reviews.length} ${salon.reviews.length === 1 ? 'customer has' : 'customers have'} to say about their experience`
                    : 'Be the first to share your experience with us'
                  }
                </CardDescription>
              </div>

            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {salon.reviews.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-10 h-10 text-teal-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Yet</h3>
                  <p className="text-gray-600" data-testid="text-no-reviews">
                    Be the first to share your experience and help others make informed decisions
                  </p>
                </div>
              ) : (
                salon.reviews.map((review) => (
                  <div key={review.id} className="p-5 bg-white border-2 border-gray-100 rounded-xl hover:border-teal-200 transition-colors" data-testid={`review-${review.id}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="font-semibold text-gray-900">{review.rating}.0</span>
                      </div>
                      <span className="text-sm text-gray-500" data-testid={`text-review-date-${review.id}`}>
                        {new Date(review.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 leading-relaxed" data-testid={`text-review-comment-${review.id}`}>
                        {review.comment}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}