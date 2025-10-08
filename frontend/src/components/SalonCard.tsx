import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Clock, Navigation, Sparkles } from "lucide-react";
import type { SalonWithDetails } from "../types";

// Simple cache for resolved addresses to avoid repeated API calls
const addressCache = new Map<string, string>();

interface SalonCardProps {
  salon: SalonWithDetails;
  showWaitTime?: boolean;
  showDistance?: boolean;
  distance?: number;
}

export default function SalonCard({ salon, showWaitTime = true, showDistance = false, distance }: SalonCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [resolvedAddress, setResolvedAddress] = useState<string>('');

  // Auto-rotate images every 5 seconds if salon has multiple photos
  useEffect(() => {
    if (!salon.photos || salon.photos.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) =>
        (prevIndex + 1) % salon.photos!.length
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [salon.photos]);

  const getCurrentImageUrl = () => {
    if (salon.photos && salon.photos.length > 0) {
      return salon.photos[currentImageIndex].url;
    }
    return "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
  };

  const hasMultipleImages = salon.photos && salon.photos.length > 1;

  // Reverse geocoding to get address from coordinates
  const fetchAddressFromCoordinates = async (lat: number, lng: number) => {
    try {
      // Using a free reverse geocoding service (Nominatim - OpenStreetMap)
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, Math.random() * 1000));

      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'SmartQ-Salon-App'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          // Extract a clean, short address
          const address = data.display_name;
          // Take first 2-3 parts of the address for brevity, remove country
          const addressParts = address.split(',').slice(0, 3).join(',').trim();

          // Cache the result
          const cacheKey = `${lat},${lng}`;
          addressCache.set(cacheKey, addressParts);

          setResolvedAddress(addressParts);
        } else {
          setResolvedAddress('Near coordinates provided');
        }
      } else {
        setResolvedAddress('Location available on map');
      }
    } catch (error) {
      console.log('Could not fetch address for coordinates:', error);
      setResolvedAddress('Location available on map');
    }
  };

  // Effect to fetch address when component mounts if we have coordinates but no address
  useEffect(() => {
    // Only fetch resolved address if we don't have manualLocation, fullAddress, or location
    if (salon.latitude && salon.longitude && !salon.manualLocation && !salon.fullAddress && !salon.location && !resolvedAddress) {
      const cacheKey = `${salon.latitude},${salon.longitude}`;

      // Check cache first
      if (addressCache.has(cacheKey)) {
        setResolvedAddress(addressCache.get(cacheKey)!);
      } else {
        fetchAddressFromCoordinates(salon.latitude, salon.longitude);
      }
    }
  }, [salon.latitude, salon.longitude, salon.manualLocation, salon.fullAddress, salon.location, resolvedAddress]);

  const getDisplayLocation = () => {
    // Priority order: manualLocation > fullAddress > location > resolvedAddress > coordinates-based fallback
    if (salon.manualLocation && salon.manualLocation.trim()) {
      return salon.manualLocation;
    }

    if (salon.fullAddress && salon.fullAddress.trim()) {
      return salon.fullAddress;
    }

    if (salon.location && salon.location.trim()) {
      return salon.location;
    }

    // Use resolved address from coordinates
    if (resolvedAddress) {
      return resolvedAddress;
    }

    // If we have coordinates but address is still loading
    if (salon.latitude && salon.longitude) {
      return 'Loading location...';
    }

    // Last resort fallback
    return 'Location details available';
  };

  const openInGoogleMaps = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    console.log('SalonCard - Opening maps for salon:', {
      id: salon.id,
      name: salon.name,
      latitude: salon.latitude,
      longitude: salon.longitude,
      fullAddress: salon.fullAddress,
      location: salon.location
    });

    if (salon.latitude && salon.longitude) {
      // Use exact coordinates for precise location
      const url = `https://www.google.com/maps?q=${salon.latitude},${salon.longitude}`;
      console.log('SalonCard - Using coordinates URL:', url);
      window.open(url, '_blank');
    } else {
      // Fallback to address search
      const query = encodeURIComponent(salon.fullAddress || salon.location);
      const url = `https://www.google.com/maps/search/${query}`;
      console.log('SalonCard - Using address URL:', url);
      window.open(url, '_blank');
    }
  };

  return (
    <Link href={`/salon/${salon.id}`}>
      <Card
        className="overflow-hidden bg-white border-0 shadow-md"
      >
        <div className="relative overflow-hidden">
          {/* Image with gradient overlay */}
          <div className="relative h-48 overflow-hidden">
            <img
              src={getCurrentImageUrl()}
              alt={salon.name}
              className="w-full h-full object-cover"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-80" />

            {/* Image counter dots */}
            {hasMultipleImages && (
              <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5">
                {salon.photos!.map((_, index) => (
                  <div
                    key={index}
                    className={`h-1.5 rounded-full transition-all duration-300 ${index === currentImageIndex
                        ? 'w-6 bg-white'
                        : 'w-1.5 bg-white/60'
                      }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Navigation button with glassmorphism */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute top-3 right-3 h-10 w-10 p-0 bg-white/95 backdrop-blur-sm shadow-lg border border-white/20"
            onClick={openInGoogleMaps}
            title="Open in Google Maps"
          >
            <Navigation className="h-4 w-4 text-blue-600" />
          </Button>

          {/* Offers badge with animation */}
          {salon.offers && salon.offers.length > 0 && (
            <Badge className="absolute top-3 left-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white px-3 py-1.5 text-xs font-bold shadow-lg animate-pulse">
              <Sparkles className="w-3 h-3 inline mr-1" />
              {Math.max(...salon.offers.map(offer => offer.discount))}% OFF
            </Badge>
          )}
        </div>

        <CardContent className="p-5 relative">
          {/* Decorative element */}
          <div className="absolute top-0 left-0 w-16 h-1 bg-gradient-to-r from-blue-500 to-teal-500 rounded-full" />

          <div className="mt-2">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-lg text-gray-900 leading-tight">
                {salon.name}
              </h3>
              <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-50 to-amber-50 px-2.5 py-1 rounded-full border border-yellow-200/50">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span className="text-sm font-bold text-gray-900">{salon.rating}</span>
                <span className="text-xs text-gray-500">
                  ({salon.reviewCount ?? salon.reviews?.length ?? 0})
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-600 mb-3 flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className={`flex-1 leading-5 break-words hyphens-auto ${getDisplayLocation() === 'Loading location...'
                  ? 'text-gray-400 animate-pulse'
                  : ''
                }`}>
                {getDisplayLocation()}
              </span>
            </div>

            {/* Bottom info bar with gradient background */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              {showDistance && distance !== undefined && (
                <div className="flex items-center gap-1.5 text-sm">
                  <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  <span className="font-medium text-gray-700">{distance.toFixed(1)} km</span>
                </div>
              )}

              {showWaitTime && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-full border border-emerald-200/50">
                  <div className="relative">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    {(salon.queueCount || 0) > 0 && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                        <span className="text-[8px] font-bold text-white leading-none">
                          {salon.queueCount > 9 ? '9+' : salon.queueCount}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-emerald-700">
                    {(salon.queueCount || 0) > 0 ? `${salon.queueCount} in queue` : 'Available now'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>


      </Card>
    </Link>
  );
}