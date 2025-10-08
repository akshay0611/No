import { Link } from "wouter";
import { Star, Users, CheckCircle2 } from "lucide-react";
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
    if (salon.queueCount === 0) return "text-emerald-600";
    if (salon.queueCount <= 2) return "text-emerald-600";
    if (salon.queueCount <= 5) return "text-amber-600";
    return "text-rose-600";
  };

  const getQueueStatusBgColor = () => {
    if (salon.queueCount === 0) return "bg-emerald-50";
    if (salon.queueCount <= 2) return "bg-emerald-50";
    if (salon.queueCount <= 5) return "bg-amber-50";
    return "bg-rose-50";
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

  const reviewCount = 0; // This should come from salon data when available

  return (
    <Link href={`/salon/${salon.id}`}>
      <div 
        className="flex rounded-2xl overflow-hidden bg-white cursor-pointer border-2 border-gray-200 hover:border-blue-400 transition-all duration-300"
        style={{
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          marginBottom: '4px'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.15)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        {/* Left side - Image (40% width) */}
        <div className="w-2/5 relative overflow-hidden bg-gray-100">
          <img
            src={getImageUrl()}
            alt={salon.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Right side - Information (60% width) */}
        <div className="w-3/5 bg-white p-4 flex flex-col justify-between">
          {/* Top section */}
          <div>
            {/* Salon name */}
            <h3 className="text-lg font-bold text-gray-900 leading-tight mb-2 line-clamp-2">
              {salon.name}
            </h3>

            {/* Rating */}
            <div className="flex items-center gap-1 mb-3">
              <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-semibold text-gray-900">{salon.rating}</span>
              </div>
              {reviewCount > 0 ? (
                <span className="text-xs text-gray-500">({reviewCount} reviews)</span>
              ) : (
                <span className="text-xs text-gray-500 italic">New</span>
              )}
            </div>
          </div>

          {/* Queue status - Bottom section */}
          <div className={`flex items-center gap-2 ${getQueueStatusColor()} ${getQueueStatusBgColor()} px-3 py-2 rounded-lg border ${
            salon.queueCount === 0 ? 'border-emerald-200' : 
            salon.queueCount <= 5 ? 'border-amber-200' : 'border-rose-200'
          }`}>
            {getQueueStatusIcon()}
            <span className="text-sm font-semibold">
              {getQueueStatusText()}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}