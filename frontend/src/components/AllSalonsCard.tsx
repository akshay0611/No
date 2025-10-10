import { Link } from "wouter";
import { Star, Users, CheckCircle2, MapPin, Navigation, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { SalonWithDetails } from "../types";

interface AllSalonsCardProps {
  salon: SalonWithDetails;
}

export default function AllSalonsCard({ salon }: AllSalonsCardProps) {
  const getImageUrl = () => {
    if (salon.photos && salon.photos.length > 0) {
      return salon.photos[0].url;
    }
    return "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200";
  };

  const getQueueStatusColor = () => {
    if (salon.queueCount === 0) return "text-teal-600";
    if (salon.queueCount <= 2) return "text-teal-600";
    if (salon.queueCount <= 5) return "text-amber-600";
    return "text-rose-600";
  };

  const getQueueStatusBgColor = () => {
    if (salon.queueCount === 0) return "bg-teal-50";
    if (salon.queueCount <= 2) return "bg-teal-50";
    if (salon.queueCount <= 5) return "bg-amber-50";
    return "bg-rose-50";
  };

  const getQueueStatusBorder = () => {
    if (salon.queueCount === 0) return "border-teal-200";
    if (salon.queueCount <= 2) return "border-teal-200";
    if (salon.queueCount <= 5) return "border-amber-200";
    return "border-rose-200";
  };

  const getQueueStatusIcon = () => {
    if (salon.queueCount === 0) {
      return <CheckCircle2 className="w-4 h-4" />;
    }
    return <Users className="w-4 h-4" />;
  };

  const getQueueStatusText = () => {
    if (salon.queueCount === 0) {
      return "Available now";
    }
    if (salon.queueCount === 1) {
      return "1 person in queue";
    }
    return `${salon.queueCount} people in queue`;
  };

  const capitalizeWords = (text: string) => {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getDisplayLocation = () => {
    if (salon.manualLocation && salon.manualLocation.trim()) {
      return capitalizeWords(salon.manualLocation);
    }
    if (salon.fullAddress && salon.fullAddress.trim()) {
      return capitalizeWords(salon.fullAddress);
    }
    if (salon.location && salon.location.trim()) {
      return capitalizeWords(salon.location);
    }
    return 'Location available';
  };

  const openInGoogleMaps = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (salon.latitude && salon.longitude) {
      const url = `https://www.google.com/maps?q=${salon.latitude},${salon.longitude}`;
      window.open(url, '_blank');
    } else {
      const query = encodeURIComponent(salon.fullAddress || salon.location || salon.name);
      const url = `https://www.google.com/maps/search/${query}`;
      window.open(url, '_blank');
    }
  };

  // Get first 3 services for display
  const displayServices = salon.services?.slice(0, 3) || [];

  return (
    <Link href={`/salon/${salon.id}`}>
      {/* Mobile Layout - Compact */}
      <div className="md:hidden group rounded-2xl overflow-hidden bg-white cursor-pointer border-2 border-gray-200 hover:border-teal-300 transition-all duration-300 shadow-sm hover:shadow-lg mb-4">
        {/* Image */}
        <div className="relative w-full h-40 overflow-hidden bg-gray-100">
          <img
            src={getImageUrl()}
            alt={salon.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Offer Badge */}
          {salon.offers && salon.offers.length > 0 && (
            <div className="absolute top-2 left-2">
              <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-2 py-1 text-xs font-bold shadow-lg border-0 rounded-lg">
                <Sparkles className="w-3 h-3 inline mr-1" />
                {Math.max(...salon.offers.map(offer => offer.discount))}% OFF
              </Badge>
            </div>
          )}

          {/* Rating Badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-white px-2 py-1 rounded-lg shadow-md">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span className="text-sm font-bold text-gray-900">{salon.rating}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-3 space-y-2">
          {/* Name and Location */}
          <div>
            <h3 className="text-base font-bold text-gray-900 leading-tight mb-1">
              {salon.name}
            </h3>
            <div className="flex items-center gap-1.5 text-gray-600">
              <MapPin className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <span className="text-xs truncate">{getDisplayLocation()}</span>
            </div>
          </div>

          {/* Queue Status */}
          <div className={`inline-flex items-center gap-1.5 ${getQueueStatusColor()} ${getQueueStatusBgColor()} px-3 py-1.5 rounded-lg border ${getQueueStatusBorder()}`}>
            {getQueueStatusIcon()}
            <span className="text-xs font-bold">
              {getQueueStatusText()}
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Layout - Detailed */}
      <div className="hidden md:flex group flex-row rounded-2xl overflow-hidden bg-white cursor-pointer border-2 border-gray-200 hover:border-teal-300 transition-all duration-300 shadow-sm hover:shadow-lg mb-4">
        {/* Left side - Image */}
        <div className="relative w-80 h-auto overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={getImageUrl()}
            alt={salon.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Offer Badge */}
          {salon.offers && salon.offers.length > 0 && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white px-3 py-1.5 text-sm font-bold shadow-lg border-0 rounded-xl">
                <Sparkles className="w-4 h-4 inline mr-1" />
                {Math.max(...salon.offers.map(offer => offer.discount))}% OFF
              </Badge>
            </div>
          )}

          {/* Navigation Button */}
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-3 right-3 h-9 w-9 p-0 bg-white hover:bg-teal-50 shadow-lg border-0 rounded-xl"
            onClick={openInGoogleMaps}
            title="Open in Google Maps"
          >
            <Navigation className="h-4 w-4 text-teal-600" />
          </Button>
        </div>

        {/* Right side - Information */}
        <div className="flex-1 p-6 flex flex-row items-center justify-between gap-4">
          {/* Main Content */}
          <div className="flex-1 space-y-3">
            {/* Salon Name */}
            <h3 className="text-2xl font-bold text-gray-900 leading-tight">
              {salon.name}
            </h3>

            {/* Location */}
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
              <span className="text-sm">{getDisplayLocation()}</span>
            </div>

            {/* Services with Prices */}
            {displayServices.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {displayServices.map((service, index) => (
                  <div key={index} className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-700">{service.name}</span>
                    <span className="text-sm font-semibold text-teal-600">₹{service.price}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Queue Status */}
            <div className={`inline-flex items-center gap-2 ${getQueueStatusColor()} ${getQueueStatusBgColor()} px-4 py-2 rounded-xl border-2 ${getQueueStatusBorder()}`}>
              {getQueueStatusIcon()}
              <span className="text-sm font-bold">
                {getQueueStatusText()}
              </span>
            </div>
          </div>

          {/* Rating Badge - Right Side on Desktop */}
          <div className="flex flex-col items-end gap-2 self-start">
            <div className="flex items-center gap-1 bg-white px-3 py-2 rounded-xl border-2 border-amber-200 shadow-sm">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span className="text-lg font-bold text-gray-900">{salon.rating}</span>
              <span className="text-sm text-gray-500">
                ({salon.reviewCount ?? salon.reviews?.length ?? 0})
              </span>
            </div>
            {(salon.reviewCount ?? salon.reviews?.length ?? 0) === 0 && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                New
              </Badge>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}