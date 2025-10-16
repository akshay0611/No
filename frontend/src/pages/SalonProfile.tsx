import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card"; 
import { Badge } from "@/components/ui/badge"; 
import { Star, MapPin, Clock, Heart, ShoppingCart, Zap, ImageIcon, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

import { useToast } from "@/hooks/use-toast"; 
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { api } from "../lib/api";
import type { SalonDetails } from "../types";

// Helper function to determine if service is popular (mock logic - can be replaced with real data)
const isPopularService = (_serviceId: string, index: number) => {
  // For demo purposes, mark first service as popular
  return index === 0;
};

// Helper function to capitalize each word
const capitalizeWords = (text: string) => {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function SalonProfile() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { user, updateUser } = useAuth();
  const { addItem, items, getItemCount } = useCart();
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const reviewsScrollRef = useRef<HTMLDivElement>(null);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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



  const { data: salon, isLoading } = useQuery<SalonDetails>({
    queryKey: ['/api/salons', id],
    enabled: !!id,
  });

  // Auto-scroll reviews horizontally after 4 seconds on mobile
  useEffect(() => {
    const scrollContainer = reviewsScrollRef.current;
    if (!scrollContainer || !salon?.reviews || salon.reviews.length === 0) return;

    const timer = setTimeout(() => {
      let scrollPosition = 0;
      const cardWidth = 320; // Approximate width of each review card
      const scrollInterval = setInterval(() => {
        if (scrollContainer) {
          scrollPosition += cardWidth;
          if (scrollPosition >= scrollContainer.scrollWidth - scrollContainer.clientWidth) {
            scrollPosition = 0; // Reset to start
          }
          scrollContainer.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
          });
        }
      }, 4000); // Scroll every 3 seconds

      return () => clearInterval(scrollInterval);
    }, 5000); // Start after 4 seconds

    return () => clearTimeout(timer);
  }, [salon?.reviews]);

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
      {/* Hero Banner - Main Photo with Category Thumbnails */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-teal-600 to-cyan-600 overflow-hidden">
        {(salon as any).photos && (salon as any).photos.length > 0 ? (
          <>
            <img
              src={(salon as any).photos[0].url}
              alt={salon.name}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/30"></div>

            {/* Photo Count Badge */}
            <div className="absolute top-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-lg flex items-center space-x-1 backdrop-blur-sm z-10">
              <ImageIcon className="h-4 w-4" />
              <span className="text-sm font-medium">1/{(salon as any).photos.length}</span>
            </div>

            {/* Category Thumbnails - Premium Style */}
            <div className="absolute bottom-4 left-4 right-4 flex gap-3 overflow-x-auto scrollbar-hide z-10 pb-1">
              {['Interior', 'Services', 'Exterior'].map((category) => {
                const categoryPhotos = (salon as any).photos.filter((p: any) => p.category === category.toLowerCase());

                // Skip categories with no photos
                if (categoryPhotos.length === 0) return null;

                const photo = categoryPhotos[0];

                return (
                  <div
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category.toLowerCase());
                      setCurrentPhotoIndex(0);
                      setIsGalleryOpen(true);
                    }}
                    className="flex-shrink-0 relative rounded-xl overflow-hidden border-3 border-white shadow-2xl cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.4)] hover:scale-[1.08] active:scale-95 transition-all duration-300"
                    style={{ width: '90px', height: '68px' }}
                  >
                    <img
                      src={photo.url}
                      alt={category}
                      className="w-full h-full object-cover"
                    />
                    {/* Gradient overlay for better text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                    {/* Category label */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white text-[11px] font-bold drop-shadow-lg tracking-wide">{category}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920')] bg-cover bg-center"></div>
            <div className="absolute inset-0 bg-black/30"></div>
          </>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Salon Header - positioned below hero banner */}
        <div className="mb-8 mt-6">
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
                    <span data-testid="text-salon-location" className="font-medium">
                      {capitalizeWords(salon.manualLocation || salon.location || '')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-teal-50 px-3 py-1 rounded-full">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span data-testid="text-salon-rating" className="font-semibold text-teal-900">
                      {salon.rating}
                    </span>
                  </div>
                  {salon.latitude && salon.longitude && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${salon.latitude},${salon.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-600 hover:text-teal-700 font-medium text-sm transition-colors"
                    >
                      Open in Google Maps
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section - Card Layout with Teal Theme */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Services</h2>
            <p className="text-gray-600">Choose from our range of professional services</p>
          </div>

          {/* Services Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {salon.services.map((service, index) => {
              const isPopular = isPopularService(service.id, index);

              return (
                <Card
                  key={service.id}
                  className="flex-shrink-0 w-[85vw] md:w-full snap-start group hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-teal-300 bg-white overflow-hidden relative"
                  data-testid={`service-${service.id}`}
                >
                  {/* Popular Badge */}
                  {isPopular && (
                    <div className="absolute top-3 right-3 z-10">
                      <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-2 py-0.5 shadow-md">
                        Popular
                      </Badge>
                    </div>
                  )}

                  <CardContent className="p-4">
                    {/* Service Name */}
                    <h3 className="text-lg font-bold text-gray-900 mb-1 capitalize" data-testid={`text-service-name-${service.id}`}>
                      {service.name}
                    </h3>

                    {/* Service Description */}
                    {service.description ? (
                      <p className="text-gray-600 text-xs mb-3 line-clamp-2">
                        {service.description}
                      </p>
                    ) : (
                      <p className="text-gray-500 text-xs mb-3 italic">
                        Professional {service.name.toLowerCase()} service
                      </p>
                    )}

                    {/* Duration and Price Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-xs text-gray-600" data-testid={`text-service-duration-${service.id}`}>
                          {service.duration} min
                        </span>
                      </div>
                      <span className="text-xl font-bold text-teal-600" data-testid={`text-service-price-${service.id}`}>
                        ₹{service.price}
                      </span>
                    </div>

                    {/* Action Buttons - Compact */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAddToCart(service)}
                        disabled={isServiceInCart(service.id)}
                        size="sm"
                        className={`flex-1 h-8 text-xs ${isServiceInCart(service.id)
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-teal-600 hover:bg-teal-700'
                          } text-white`}
                        data-testid={`button-add-service-${service.id}`}
                      >
                        {isServiceInCart(service.id) ? (
                          <>✓ Added</>
                        ) : (
                          <>
                            <ShoppingCart className="w-3 h-3 mr-1" />
                            Add
                          </>
                        )}
                      </Button>

                      {!isServiceInCart(service.id) && (
                        <Button
                          onClick={() => {
                            handleAddToCart(service);
                            setTimeout(() => setLocation('/queue-summary'), 300);
                          }}
                          size="sm"
                          variant="outline"
                          className="flex-1 h-8 text-xs border-teal-600 text-teal-600 hover:bg-teal-50"
                        >
                          <Zap className="w-3 h-3 mr-1" />
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

        {/* Reviews Section */}
        <div className="mt-8">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-1">
              Customer Reviews
            </h2>
            <p className="text-gray-600 text-sm">
              {salon.reviews.length > 0
                ? `${salon.reviews.length} ${salon.reviews.length === 1 ? 'review' : 'reviews'}`
                : 'Be the first to share your experience'
              }
            </p>
          </div>

          {salon.reviews.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-teal-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
              <p className="text-gray-600 text-sm" data-testid="text-no-reviews">
                Be the first to share your experience
              </p>
            </div>
          ) : (
            <div
              ref={reviewsScrollRef}
              className="flex md:flex-col gap-4 overflow-x-auto md:overflow-x-visible snap-x snap-mandatory scrollbar-hide pb-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {salon.reviews.map((review) => (
                <div
                  key={review.id}
                  className="flex-shrink-0 w-[85vw] md:w-full snap-start p-5 bg-white border border-teal-100 rounded-lg hover:border-teal-300 hover:shadow-md transition-all"
                  data-testid={`review-${review.id}`}
                >
                  {/* User Info and Rating Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-teal-100 bg-teal-50 flex-shrink-0">
                        {review.userProfileImage ? (
                          <img
                            src={review.userProfileImage}
                            alt={review.userName || 'User'}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center">
                            <span className="text-white font-semibold text-base">
                              {(review.userName || 'A').charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-base">{review.userName || 'Anonymous'}</p>
                        <span className="text-xs text-gray-500" data-testid={`text-review-date-${review.id}`}>
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Rating Badge */}
                    <div className="flex items-center space-x-1 bg-teal-50 px-3 py-1.5 rounded-full border border-teal-200">
                      <Star className="h-4 w-4 text-teal-600 fill-teal-600" />
                      <span className="font-semibold text-teal-700 text-sm">{review.rating}.0</span>
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-gray-700 leading-relaxed text-sm" data-testid={`text-review-comment-${review.id}`}>
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Photo Gallery Modal */}
      <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
        <DialogContent className="max-w-4xl w-full h-[90vh] p-0 bg-black">
          <div className="relative w-full h-full flex flex-col">
            {/* Close Button */}
            <button
              onClick={() => setIsGalleryOpen(false)}
              className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Category Title */}
            <div className="absolute top-4 left-4 z-50 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
              <h3 className="text-lg font-semibold capitalize">{selectedCategory}</h3>
            </div>

            {/* Main Image Display */}
            <div className="flex-1 flex items-center justify-center relative">
              {(() => {
                const categoryPhotos = (salon as any).photos?.filter(
                  (p: any) => p.category === selectedCategory
                ) || [];
                // Only show photos from the selected category, no fallback
                const displayPhotos = categoryPhotos;
                const currentPhoto = displayPhotos[currentPhotoIndex];

                return currentPhoto ? (
                  <>
                    <img
                      src={currentPhoto.url}
                      alt={`${selectedCategory} ${currentPhotoIndex + 1}`}
                      className="max-w-full max-h-full object-contain"
                    />

                    {/* Navigation Arrows */}
                    {displayPhotos.length > 1 && (
                      <>
                        <button
                          onClick={() => setCurrentPhotoIndex((prev) =>
                            prev === 0 ? displayPhotos.length - 1 : prev - 1
                          )}
                          className="absolute left-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all"
                        >
                          <ChevronLeft className="h-6 w-6" />
                        </button>
                        <button
                          onClick={() => setCurrentPhotoIndex((prev) =>
                            prev === displayPhotos.length - 1 ? 0 : prev + 1
                          )}
                          className="absolute right-4 bg-black/50 hover:bg-black/70 text-white rounded-full p-3 transition-all"
                        >
                          <ChevronRight className="h-6 w-6" />
                        </button>
                      </>
                    )}

                    {/* Photo Counter */}
                    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
                      <span className="text-sm font-medium">
                        {currentPhotoIndex + 1} / {displayPhotos.length}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-white text-center">
                    <p>No photos available</p>
                  </div>
                );
              })()}
            </div>

            {/* Thumbnail Strip */}
            <div className="bg-black/80 backdrop-blur-sm p-4 overflow-x-auto">
              <div className="flex gap-2 justify-center">
                {(() => {
                  const categoryPhotos = (salon as any).photos?.filter(
                    (p: any) => p.category === selectedCategory
                  ) || [];
                  // Only show photos from the selected category, no fallback
                  const displayPhotos = categoryPhotos;

                  return displayPhotos.map((photo: any, index: number) => (
                    <button
                      key={photo.id || index}
                      onClick={() => setCurrentPhotoIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${currentPhotoIndex === index
                        ? 'border-teal-500 scale-110'
                        : 'border-white/30 hover:border-white/60'
                        }`}
                    >
                      <img
                        src={photo.url}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ));
                })()}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}