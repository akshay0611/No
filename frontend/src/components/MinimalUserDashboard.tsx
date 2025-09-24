import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  MapPin, 
  Star, 
  Clock, 
  Users, 
  Sparkles,
  Settings,
  User,
  Calendar,
  Heart,
  Menu
} from "lucide-react";

interface MinimalUserDashboardProps {
  user: {
    id: string;
    phone: string;
    name?: string | null;
    email?: string | null;
  };
  onBookSalon?: (salonId: string) => void;
  onOpenProfile?: () => void;
}

export default function MinimalUserDashboard({ 
  user, 
  onBookSalon, 
  onOpenProfile 
}: MinimalUserDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Mock salon data
  const popularSalons = [
    {
      id: "1",
      name: "Glamour Studio",
      rating: 4.8,
      waitTime: 15,
      queueCount: 3,
      image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=300&h=200&fit=crop",
      offers: ["20% off on haircuts"],
      distance: "0.5 km"
    },
    {
      id: "2", 
      name: "Style Lounge",
      rating: 4.6,
      waitTime: 25,
      queueCount: 5,
      image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=300&h=200&fit=crop",
      offers: [],
      distance: "1.2 km"
    },
    {
      id: "3",
      name: "Beauty Parlour",
      rating: 4.9,
      waitTime: 10,
      queueCount: 2,
      image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=300&h=200&fit=crop",
      offers: ["Free hair wash"],
      distance: "0.8 km"
    }
  ];

  const formatPhoneNumber = (phone: string) => {
    if (phone.startsWith('+91')) {
      const number = phone.slice(3);
      return `+91 ${number.slice(0, 5)} ${number.slice(5)}`;
    }
    return phone;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">SmartQ</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenProfile}
                className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <User className="w-5 h-5 text-gray-600" />
              </button>
              <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">
                Hi{user.name ? ` ${user.name}` : ''}! 👋
              </h2>
              <p className="text-purple-100 text-sm">
                {formatPhoneNumber(user.phone)}
              </p>
              <p className="text-purple-100 text-sm mt-2">
                Ready to skip the queue today?
              </p>
            </div>
            <div className="text-right">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <Calendar className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search salons near you..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 rounded-xl border-2 border-gray-200 focus:border-purple-500 bg-white"
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Bookings</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <Heart className="w-6 h-6 text-pink-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-sm text-gray-600">Favorites</p>
            </CardContent>
          </Card>
        </div>

        {/* Popular Salons */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">Popular Salons</h3>
            <button className="text-purple-600 text-sm font-medium">View All</button>
          </div>
          
          <div className="space-y-4">
            {popularSalons.map((salon) => (
              <Card key={salon.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <img 
                        src={salon.image} 
                        alt={salon.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900 truncate">{salon.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-400 fill-current" />
                              <span className="text-sm font-medium text-gray-700">{salon.rating}</span>
                            </div>
                            <span className="text-gray-300">•</span>
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 text-gray-400" />
                              <span className="text-sm text-gray-600">{salon.distance}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-3">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{salon.waitTime} min wait</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{salon.queueCount} in queue</span>
                        </div>
                      </div>

                      {salon.offers.length > 0 && (
                        <div className="mb-3">
                          <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                            {salon.offers[0]}
                          </Badge>
                        </div>
                      )}
                      
                      <Button
                        onClick={() => onBookSalon?.(salon.id)}
                        size="sm"
                        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 rounded-lg"
                      >
                        Join Queue
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Empty State for Bookings */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-2">No bookings yet</h4>
            <p className="text-sm text-gray-600 mb-4">
              Start by joining a queue at your favorite salon
            </p>
            <Button 
              variant="outline" 
              size="sm"
              className="border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              Browse Salons
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}