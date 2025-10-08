import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Star, AlertCircle, Navigation, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { api } from "../lib/api";
import { queryClient } from "../lib/queryClient";
import ReviewModal from "../components/ReviewModal";
import type { QueueWithDetails } from "../types";

export default function Queue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { connected } = useWebSocket();
  const [, setLocation] = useLocation();
  const [loadingDirections, setLoadingDirections] = useState<string | null>(null);
  const [reviewQueue, setReviewQueue] = useState<QueueWithDetails | null>(null);

  // Load reviewed queues from localStorage
  const [reviewedQueues, setReviewedQueues] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('reviewedQueues');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Helper function to mark queue as reviewed and persist to localStorage
  const markQueueAsReviewed = (queueId: string) => {
    setReviewedQueues(prev => {
      const updated = new Set(prev).add(queueId);
      try {
        localStorage.setItem('reviewedQueues', JSON.stringify(Array.from(updated)));
      } catch (error) {
        console.error('Failed to save reviewed queues:', error);
      }
      return updated;
    });
  };

  const { data: queues = [], isLoading } = useQuery<QueueWithDetails[]>({
    queryKey: ['/api/queues/my'],
    enabled: !!user,
  });

  const leaveQueueMutation = useMutation({
    mutationFn: api.queue.leave,
    onSuccess: () => {
      toast({
        title: "Left queue successfully",
        description: "You've been removed from the queue.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/queues/my'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to leave queue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: { salonId: string; userId: string; rating: number; comment?: string }) => {
      return api.reviews.create(data);
    },
    onSuccess: () => {
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });
      if (reviewQueue) {
        markQueueAsReviewed(reviewQueue.id);
      }
      setReviewQueue(null);
      queryClient.invalidateQueries({ queryKey: ['/api/queues/my'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check for completed queues that need review
  useEffect(() => {
    if (!queues || queues.length === 0) return;

    const completedQueue = queues.find(
      q => q.status === 'completed' && !reviewedQueues.has(q.id)
    );

    if (completedQueue && !reviewQueue) {
      setReviewQueue(completedQueue);
    }
  }, [queues, reviewedQueues, reviewQueue]);

  const handleReviewSubmit = (data: { salonRating: number; serviceRating: number; comment: string }) => {
    if (!reviewQueue || !user) return;

    // Use salon rating as the main rating
    submitReviewMutation.mutate({
      salonId: reviewQueue.salonId,
      userId: user.id,
      rating: data.salonRating,
      comment: data.comment || undefined,
    });
  };

  const handleSkipReview = () => {
    if (reviewQueue) {
      markQueueAsReviewed(reviewQueue.id);
      setReviewQueue(null);
    }
  };

  // Get user's current location with high accuracy and open directions
  const openDirections = (salon: any, queueId: string) => {
    setLoadingDirections(queueId);

    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      setLoadingDirections(null);
      return;
    }

    let bestPosition: GeolocationPosition | null = null;
    let watchId: number | null = null;
    let timeoutId: number;

    const openMapsWithLocation = (userLat: number, userLng: number) => {
      console.log('Opening directions with user location:', {
        userLocation: { lat: userLat, lng: userLng },
        salonLocation: { lat: salon.latitude, lng: salon.longitude },
        salon: salon.name
      });

      if (salon.latitude && salon.longitude) {
        // Use exact coordinates for both origin and destination
        const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${salon.latitude},${salon.longitude}/?travelmode=driving`;
        console.log('Using precise coordinates URL:', url);
        window.open(url, '_blank');
      } else {
        // Fallback to address search with user location as origin
        const query = encodeURIComponent(salon.fullAddress || salon.location);
        const url = `https://www.google.com/maps/dir/${userLat},${userLng}/${query}/?travelmode=driving`;
        console.log('Using address with user location URL:', url);
        window.open(url, '_blank');
      }
      setLoadingDirections(null);
    };

    const processPosition = (position: GeolocationPosition) => {
      const { latitude: lat, longitude: lng, accuracy: acc } = position.coords;

      // If this is the first position or it's more accurate than the previous one
      if (!bestPosition || (acc && bestPosition.coords.accuracy && acc < bestPosition.coords.accuracy)) {
        bestPosition = position;

        // If accuracy is good enough (less than 50m), use this position
        if (acc && acc < 50) {
          if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
          }
          clearTimeout(timeoutId);
          openMapsWithLocation(lat, lng);
          return;
        }
      }
    };

    const handleError = (error: GeolocationPositionError) => {
      console.error("Geolocation failed:", error);
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
      clearTimeout(timeoutId);

      // Show error message based on error type
      let errorMessage = "Failed to get your location.";
      if (error.code === 1) {
        errorMessage = "Location access denied. Please enable location services and try again.";
      } else if (error.code === 2) {
        errorMessage = "Location unavailable. Please check your GPS settings.";
      } else if (error.code === 3) {
        errorMessage = "Location request timed out. Please try again.";
      }

      toast({
        title: "Location Error",
        description: errorMessage,
        variant: "destructive",
      });
      setLoadingDirections(null);
    };

    // First, try to get a quick position
    navigator.geolocation.getCurrentPosition(
      processPosition,
      () => {
        // If quick position fails, start watching for high accuracy
        watchId = navigator.geolocation.watchPosition(
          processPosition,
          handleError,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0, // Always get fresh location for directions
          }
        );
      },
      {
        enableHighAccuracy: false, // Quick first attempt
        timeout: 5000,
        maximumAge: 60000, // 1 minute cache for quick attempt
      }
    );

    // Start high-accuracy watching immediately for better results
    watchId = navigator.geolocation.watchPosition(
      processPosition,
      handleError,
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0, // Always get fresh location for directions
      }
    );

    // Set a maximum time limit for location detection
    timeoutId = setTimeout(() => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }

      // Use the best position we have, even if not ideal
      if (bestPosition) {
        const { latitude: lat, longitude: lng } = bestPosition.coords;
        openMapsWithLocation(lat, lng);
      } else {
        toast({
          title: "Location Timeout",
          description: "Couldn't get precise location. Opening directions without your current location.",
        });
        // Fallback to original behavior
        if (salon.latitude && salon.longitude) {
          const url = `https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}&travelmode=driving`;
          window.open(url, '_blank');
        } else {
          const query = encodeURIComponent(salon.fullAddress || salon.location);
          const url = `https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`;
          window.open(url, '_blank');
        }
        setLoadingDirections(null);
      }
    }, 10000); // 10 seconds max for directions
  };

  if (!user) {
    return (
      <div className="h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl border border-white/20 w-full max-w-md mx-4 relative z-10">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl mb-6 shadow-lg">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Please sign in</h1>
            <p className="text-gray-600 mb-6">You need to sign in to view your queue status.</p>
            <Button
              onClick={() => setLocation('/auth')}
              className="w-full h-12 text-base font-semibold rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 border-0 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen bg-gray-50 overflow-hidden flex flex-col">
        {/* Banner Section */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-8 relative overflow-hidden flex-shrink-0">
          <div className="max-w-md mx-auto relative z-10">
            <div className="mb-6">
              <img
                src="/loadlogo.png"
                alt="SmartQ Logo"
                className="h-20 w-auto brightness-0 invert"
              />
            </div>
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-2">Loading Your Queue</h2>
              <p className="text-teal-100 text-sm">Please wait while we fetch your status</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-800/20 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-md mx-auto space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeQueues = queues.filter(q => q.status === 'waiting' || q.status === 'in-progress');
  const completedQueues = queues.filter(q => q.status === 'completed' || q.status === 'no-show');

  const getServiceName = (queue: QueueWithDetails) => {
    if (queue.services && queue.services.length > 0) {
      return queue.services.length > 1
        ? `${queue.services.length} services`
        : queue.services[0].name;
    }
    return queue.service?.name || 'Service';
  };

  return (
    <>
      {/* Review Modal */}
      {reviewQueue && (
        <ReviewModal
          isOpen={true}
          onClose={handleSkipReview}
          onSubmit={handleReviewSubmit}
          salonName={reviewQueue.salon?.name || 'the salon'}
          serviceName={getServiceName(reviewQueue)}
          isSubmitting={submitReviewMutation.isPending}
        />
      )}

      <div className="h-screen bg-gray-50 overflow-hidden flex flex-col">
        {/* Banner Section */}
        <div className="bg-gradient-to-br from-teal-600 to-teal-700 px-6 py-8 relative overflow-hidden flex-shrink-0">

          <div className="max-w-md mx-auto relative z-10">
            {/* Logo */}
            <div className="mb-6">
              <img
                src="/loadlogo.png"
                alt="SmartQ Logo"
                className="h-20 w-auto brightness-0 invert"
              />
            </div>

            {/* Banner Content */}
            <div className="text-white">
              <h2 className="text-2xl font-bold mb-2">My Queue Status</h2>
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-teal-100 text-sm">
                  {connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-teal-500/20 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-800/20 rounded-full translate-y-24 -translate-x-24"></div>
        </div>

        {/* Content Section */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <div className="max-w-md mx-auto">
            {activeQueues.length === 0 && completedQueues.length === 0 ? (
              <div className="bg-white rounded-lg p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <Clock className="h-8 w-8 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">No queue history</h2>
                <p className="text-gray-600 mb-6 text-sm">
                  You haven't joined any queues yet. Find a salon and join your first queue!
                </p>
                <button
                  data-testid="button-find-salons"
                  onClick={() => setLocation('/')}
                  className="w-full h-12 text-white font-semibold bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Find Salons
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Active Queues */}
                {activeQueues.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Active Queues</h2>
                    <div className="space-y-4">
                      {activeQueues.map((queue) => (
                        <div key={queue.id} className="bg-white rounded-lg shadow-sm overflow-hidden" data-testid={`queue-${queue.id}`}>
                          <div className="p-6">
                            <div className="space-y-6">
                              {/* Salon Info */}
                              <div className="text-center">
                                <h3 className="text-lg font-bold text-gray-900 mb-2" data-testid={`text-salon-name-${queue.id}`}>
                                  {queue.salon?.name}
                                </h3>
                                <p className="text-gray-600 text-sm flex items-center justify-center space-x-1">
                                  <MapPin className="h-4 w-4" />
                                  <span data-testid={`text-salon-location-${queue.id}`}>{queue.salon?.location}</span>
                                </p>
                              </div>

                              {/* Position Display */}
                              {queue.status === 'waiting' ? (
                                <div className="bg-gray-50 rounded-lg p-6 text-center">
                                  <div className="relative mb-4">
                                    <svg className="w-24 h-24 mx-auto transform -rotate-90">
                                      <circle
                                        cx="48" cy="48" r="40"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="none"
                                        className="text-gray-200"
                                      />
                                      <circle
                                        cx="48" cy="48" r="40"
                                        stroke="currentColor"
                                        strokeWidth="6"
                                        fill="none"
                                        strokeDasharray="251"
                                        strokeDashoffset={251 - (251 * (queue.position > 0 && queue.totalInQueue ? Math.max(0, 1 - queue.position / queue.totalInQueue) : 0))}
                                        className="text-teal-600"
                                      />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                      <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900" data-testid={`text-queue-position-${queue.id}`}>
                                          {queue.position}
                                        </div>
                                        <div className="text-xs text-gray-600">in queue</div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="bg-teal-50 rounded-lg p-6 text-center">
                                  <div className="w-16 h-16 bg-teal-600 rounded-full mx-auto mb-3 flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-white" />
                                  </div>
                                  <div className="text-lg font-bold text-teal-700">
                                    Now Serving
                                  </div>
                                </div>
                              )}

                              {/* Wait Time */}
                              <div className="text-center">
                                <p className="text-2xl font-bold text-teal-600" data-testid={`text-estimated-wait-${queue.id}`}>
                                  {queue.estimatedWaitTime || queue.position * 15} min
                                </p>
                                <p className="text-gray-600 text-sm">estimated wait</p>
                              </div>

                              {/* Queue Details */}
                              <div className="space-y-4 bg-gray-50 rounded-lg p-4">
                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Service Details</h4>
                                  <div className="space-y-2">
                                    {queue.services && Array.isArray(queue.services) && queue.services.length > 0 ? (
                                      <div>
                                        <p className="text-gray-900 text-sm" data-testid={`text-services-count-${queue.id}`}>
                                          <strong>Services:</strong> {queue.services.length} selected
                                        </p>
                                        <div className="mt-2 mb-2" data-testid={`text-services-list-${queue.id}`}>
                                          {queue.services.map((service) => (
                                            <p key={service.id} className="text-xs text-gray-600">
                                              • {service.name} (${service.price})
                                            </p>
                                          ))}
                                        </div>
                                        <p className="text-gray-900 text-sm font-semibold" data-testid={`text-total-price-${queue.id}`}>
                                          Total: ${queue.totalPrice}
                                        </p>
                                        {queue.appliedOffers && queue.appliedOffers.length > 0 && (
                                          <p className="text-green-600 text-xs">
                                            {queue.appliedOffers.length} discount(s) applied
                                          </p>
                                        )}
                                      </div>
                                    ) : (
                                      <div>
                                        <p className="text-gray-900 text-sm" data-testid={`text-service-name-${queue.id}`}>
                                          <strong>Service:</strong> {queue.service?.name}
                                        </p>
                                        <p className="text-gray-600 text-sm" data-testid={`text-service-duration-${queue.id}`}>
                                          <strong>Duration:</strong> {queue.service?.duration} min
                                        </p>
                                        <p className="text-gray-900 text-sm font-semibold" data-testid={`text-service-price-${queue.id}`}>
                                          <strong>Price:</strong> ${queue.service?.price}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold text-gray-900 mb-3 text-sm">Status</h4>
                                  <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium mb-2 ${queue.status === 'in-progress'
                                    ? 'bg-teal-100 text-teal-700'
                                    : 'bg-gray-100 text-gray-700'
                                    }`} data-testid={`badge-status-${queue.id}`}>
                                    {queue.status === 'waiting' ? 'Waiting' : 'In Progress'}
                                  </div>
                                  <p className="text-xs text-gray-600" data-testid={`text-joined-time-${queue.id}`}>
                                    Joined at {new Date(queue.timestamp).toLocaleTimeString()}
                                  </p>
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex space-x-3 pt-4">
                                <button
                                  onClick={() => openDirections(queue.salon, queue.id)}
                                  disabled={loadingDirections === queue.id}
                                  className="flex-1 h-12 text-teal-600 font-medium bg-teal-50 hover:bg-teal-100 disabled:opacity-50 rounded-lg transition-colors duration-200 flex items-center justify-center"
                                  data-testid={`button-directions-${queue.id}`}
                                >
                                  <Navigation className="h-4 w-4 mr-2" />
                                  {loadingDirections === queue.id ? 'Getting Location...' : 'Directions'}
                                </button>
                                <button
                                  disabled={leaveQueueMutation.isPending}
                                  onClick={() => leaveQueueMutation.mutate(queue.id)}
                                  className="flex-1 h-12 text-red-600 font-medium bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-lg transition-colors duration-200 flex items-center justify-center"
                                  data-testid={`button-leave-queue-${queue.id}`}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  {leaveQueueMutation.isPending ? 'Leaving...' : 'Leave Queue'}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Queue History */}
                {completedQueues.length > 0 && (
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Queue History</h2>
                    <div className="space-y-3">
                      {completedQueues.map((queue) => (
                        <div key={queue.id} className="bg-white rounded-lg p-4 shadow-sm opacity-75" data-testid={`history-queue-${queue.id}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900 text-sm" data-testid={`text-history-salon-${queue.id}`}>
                                {queue.salon?.name}
                              </h4>
                              <p className="text-xs text-gray-600" data-testid={`text-history-service-${queue.id}`}>
                                {queue.services && queue.services.length > 0 ?
                                  (queue.services.length > 1 ?
                                    `${queue.services.length} services` :
                                    queue.services[0].name) :
                                  queue.service?.name} • {new Date(queue.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${queue.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                                }`} data-testid={`badge-history-status-${queue.id}`}>
                                {queue.status === 'completed' ? 'Completed' : 'No Show'}
                              </div>
                              {queue.status === 'completed' && (
                                <div className="flex items-center space-x-1 mt-1 justify-end">
                                  <Star className="h-3 w-3 text-yellow-400" />
                                  <span className="text-xs text-gray-600">
                                    +{Math.floor(parseFloat(queue.service?.price || '0') / 10)} pts
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}