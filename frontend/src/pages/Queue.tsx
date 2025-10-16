import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Star, AlertCircle, Navigation, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { useWebSocket } from "../context/WebSocketContext";
import { api } from "../lib/api";
import { queryClient } from "../lib/queryClient";
import ReviewModal from "../components/ReviewModal";
import NotificationOverlay from "../components/NotificationOverlay";
import CheckInButton from "../components/CheckInButton";
import QueueStatusBadge from "../components/QueueStatusBadge";
import ServiceTimer from "../components/ServiceTimer";
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import type { QueueWithDetails, WebSocketMessage } from "../types";

// Helper function to capitalize each word
const capitalizeWords = (text: string) => {
  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function Queue() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { connected } = useWebSocket();
  const [, setLocation] = useLocation();
  const [reviewQueue, setReviewQueue] = useState<QueueWithDetails | null>(null);
  const [notificationData, setNotificationData] = useState<WebSocketMessage | null>(null);

  // Load reviewed queues from localStorage
  const [reviewedQueues, setReviewedQueues] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('reviewedQueues');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Listen for queue notification events from WebSocket
  useEffect(() => {
    const handleQueueNotification = (event: CustomEvent<WebSocketMessage>) => {
      setNotificationData(event.detail);
    };

    window.addEventListener('queue_notification', handleQueueNotification as EventListener);
    return () => {
      window.removeEventListener('queue_notification', handleQueueNotification as EventListener);
    };
  }, []);



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
    refetchInterval: connected ? 5000 : false, // Poll every 5 seconds when connected
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  // Listen for queue status changes and show notifications
  useEffect(() => {
    if (!queues || queues.length === 0) return;

    const activeQueues = queues.filter(q =>
      q.status === 'waiting' ||
      q.status === 'notified' ||
      q.status === 'pending_verification' ||
      q.status === 'nearby' ||
      q.status === 'in-progress'
    );

    activeQueues.forEach(queue => {
      // Check if status changed to in-progress
      if (queue.status === 'in-progress') {
        const notifiedKey = `notified-in-progress-${queue.id}`;
        const hasNotified = sessionStorage.getItem(notifiedKey);

        if (!hasNotified) {
          toast({
            title: "Your turn!",
            description: `${queue.salon?.name} is ready to serve you. Please proceed to the salon.`,
            duration: 10000,
          });
          sessionStorage.setItem(notifiedKey, 'true');
        }
      }
    });
  }, [queues, toast]);

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

  // Open Google Maps directions
  const openDirections = (salon: any) => {
    console.log('Opening directions for salon:', {
      name: salon.name,
      latitude: salon.latitude,
      longitude: salon.longitude,
      location: salon.location
    });

    // Open directions immediately with salon coordinates
    const openMapsToSalon = (userLat?: number, userLng?: number) => {
      if (salon.latitude && salon.longitude) {
        // Use exact salon coordinates
        let url;
        if (userLat && userLng) {
          // With user location as origin
          url = `https://www.google.com/maps/dir/${userLat},${userLng}/${salon.latitude},${salon.longitude}`;
        } else {
          // Just show salon location and let Google Maps handle routing
          url = `https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}&travelmode=driving`;
        }
        console.log('Opening Google Maps URL:', url);
        window.open(url, '_blank');
      } else {
        // Fallback to address search
        const query = encodeURIComponent(salon.fullAddress || salon.location || salon.name);
        const url = `https://www.google.com/maps/search/${query}`;
        console.log('Opening Google Maps with address search:', url);
        window.open(url, '_blank');
      }
    };

    // Try to get user location quickly, but don't wait too long
    if (navigator.geolocation) {
      const timeoutId = setTimeout(() => {
        // If location takes too long, just open without user location
        console.log('Location timeout, opening without user location');
        openMapsToSalon();
      }, 3000); // 3 second timeout

      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(timeoutId);
          const { latitude, longitude } = position.coords;
          console.log('Got user location:', { latitude, longitude });
          openMapsToSalon(latitude, longitude);
        },
        (error) => {
          clearTimeout(timeoutId);
          console.log('Geolocation error:', error.message);
          // Open without user location on error
          openMapsToSalon();
        },
        {
          enableHighAccuracy: false,
          timeout: 2500,
          maximumAge: 300000 // 5 minutes cache is fine
        }
      );
    } else {
      // No geolocation support, just open to salon
      openMapsToSalon();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-md p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-50 rounded-full mb-4">
            <AlertCircle className="w-7 h-7 text-teal-600" />
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Sign in required</h1>
          <p className="text-gray-600 text-sm mb-6">Please sign in to view your queue status</p>
          <Button
            onClick={() => setLocation('/auth')}
            className="w-full h-11 text-sm font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white"
          >
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-2xl mx-auto pt-6">
          <div className="mb-6">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse mb-4"></div>
                <div className="h-20 bg-gray-100 rounded-lg animate-pulse mb-4"></div>
                <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const activeQueues = queues.filter(q =>
    q.status === 'waiting' ||
    q.status === 'notified' ||
    q.status === 'pending_verification' ||
    q.status === 'nearby' ||
    q.status === 'in-progress'
  );

  const getServiceName = (queue: QueueWithDetails) => {
    if (queue.services && queue.services.length > 0) {
      return queue.services.length > 1
        ? `${queue.services.length} services`
        : capitalizeWords(queue.services[0].name);
    }
    return capitalizeWords(queue.service?.name || 'Service');
  };

  return (
    <>
      {/* Notification Overlay */}
      {notificationData && notificationData.queueId && (
        <NotificationOverlay
          isOpen={true}
          notification={{
            queueId: notificationData.queueId,
            salonName: notificationData.salonName || '',
            salonAddress: notificationData.salonAddress || '',
            estimatedMinutes: notificationData.estimatedMinutes || 10,
            services: notificationData.services || [],
            salonLocation: notificationData.salonLocation || { latitude: 0, longitude: 0 },
          }}

          onAccept={() => {
            // I'm On My Way - scroll to queue card
            if (notificationData.queueId) {
              // Dismiss notification first
              setNotificationData(null);

              // Wait a bit for animation, then scroll
              setTimeout(() => {
                const queueElement = document.querySelector(`[data-testid="queue-${notificationData.queueId}"]`);
                if (queueElement) {
                  queueElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

                  // Add a subtle highlight effect
                  queueElement.classList.add('ring-2', 'ring-teal-500', 'ring-offset-2');
                  setTimeout(() => {
                    queueElement.classList.remove('ring-2', 'ring-teal-500', 'ring-offset-2');
                  }, 2000);
                }
              }, 300);
            }
          }}
        />
      )}

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

      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-semibold text-gray-900">My Queues</h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className="text-xs text-gray-600">
                    {connected ? 'Live updates active' : 'Reconnecting...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {activeQueues.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
              <div className="w-14 h-14 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-7 w-7 text-gray-400" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No active queues</h2>
              <p className="text-gray-600 text-sm mb-6">
                Find a salon and join the queue to get started
              </p>
              <button
                data-testid="button-find-salons"
                onClick={() => setLocation('/')}
                className="w-full h-11 text-white font-medium bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors text-sm"
              >
                Find Salons
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Queues */}
              {activeQueues.length > 0 && (
                <div>
                  <h2 className="text-base font-semibold text-gray-900 mb-3">Active</h2>
                  <div className="space-y-3">
                    {activeQueues.map((queue) => (
                      <div key={queue.id} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden" data-testid={`queue-${queue.id}`}>
                        {/* Salon Header */}
                        <div className="px-4 py-3 bg-gradient-to-r from-teal-500 to-cyan-500">
                          <h3 className="font-semibold text-white" data-testid={`text-salon-name-${queue.id}`}>
                            {queue.salon?.name}
                          </h3>
                          <p className="text-xs text-teal-50 flex items-center gap-1 mt-0.5">
                            <MapPin className="h-3 w-3" />
                            <span data-testid={`text-salon-location-${queue.id}`}>
                              {capitalizeWords(queue.salon?.manualLocation || queue.salon?.fullAddress || queue.salon?.location || 'Location not available')}
                            </span>
                          </p>
                        </div>

                        <div className="p-4 bg-gray-50">
                          {/* Status Badge */}
                          <div className="flex items-center justify-between mb-4">
                            <QueueStatusBadge status={queue.status} />
                            <span className="text-xs text-gray-500" data-testid={`text-joined-time-${queue.id}`}>
                              {new Date(queue.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          {/* Position & Wait Time / Status Info */}
                          <div className="bg-white rounded-xl p-4 mb-4 shadow-md border-2 border-teal-200">
                            {queue.status === 'waiting' ? (
                              <div className="space-y-3">
                                {/* Sloth Meditation Animation */}
                                <div className="flex justify-center">
                                  <div className="w-32 h-32">
                                    <DotLottieReact
                                      src="https://lottie.host/69c343de-1dc9-4a2d-8fd7-4e89db50a593/IhvM4es6TB.lottie"
                                      loop
                                      autoplay
                                    />
                                  </div>
                                </div>

                                {/* Waiting Message */}
                                <div className="text-center">
                                  <p className="text-sm font-medium text-gray-700 mb-1">Relax while you wait</p>
                                  <p className="text-xs text-gray-500">The salon will accept your request soon</p>
                                </div>

                                {/* Position & Time Info */}
                                <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                                  <div className="text-center flex-1">
                                    <div className="text-3xl font-bold text-teal-600" data-testid={`text-queue-position-${queue.id}`}>
                                      #{queue.position}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1 font-medium">Position</div>
                                  </div>
                                  <div className="w-px h-12 bg-teal-200"></div>
                                  <div className="text-center flex-1">
                                    <div className="text-3xl font-bold text-gray-900" data-testid={`text-estimated-wait-${queue.id}`}>
                                      {queue.estimatedWaitTime || queue.position * 15}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1 font-medium">Minutes</div>
                                  </div>
                                </div>
                              </div>
                            ) : queue.status === 'in-progress' ? (
                              <div className="space-y-3 py-2">
                                {/* Your Turn Animation */}
                                <div className="flex justify-center">
                                  <div className="w-32 h-32">
                                    <DotLottieReact
                                      src="https://lottie.host/787b9dd3-735d-40ca-9db5-e5f36f906c6f/K4mdkWnszN.lottie"
                                      loop
                                      autoplay
                                    />
                                  </div>
                                </div>

                                {/* Your Turn Message */}
                                {/* <div className="text-center">
                                  <p className="text-lg font-bold text-teal-700 mb-1">Your turn!</p>
                                  <p className="text-sm text-gray-600">Please proceed to the salon</p>
                                </div> */}
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {/* Position & Time Info for other statuses */}
                                <div className="flex items-center justify-between">
                                  <div className="text-center flex-1">
                                    <div className="text-3xl font-bold text-teal-600" data-testid={`text-queue-position-${queue.id}`}>
                                      {queue.position === 1 ? "You're next!" : `#${queue.position}`}
                                    </div>
                                    <div className="text-xs text-gray-600 mt-1 font-medium">Position</div>
                                  </div>
                                  {queue.estimatedWaitTime && (
                                    <>
                                      <div className="w-px h-12 bg-teal-200"></div>
                                      <div className="text-center flex-1">
                                        <div className="text-3xl font-bold text-gray-900" data-testid={`text-estimated-wait-${queue.id}`}>
                                          {queue.estimatedWaitTime}
                                        </div>
                                        <div className="text-xs text-gray-600 mt-1 font-medium">Minutes</div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Service Timer for in-progress status */}
                          {queue.status === 'in-progress' && queue.serviceStartedAt && (
                            <ServiceTimer
                              startTime={new Date(queue.serviceStartedAt)}
                              estimatedDuration={queue.services?.reduce((sum, s) => sum + (s.duration || 0), 0)}
                              className="mb-4"
                            />
                          )}

                          {/* Check-in Button for notified status */}
                          {queue.status === 'notified' && queue.salon?.latitude && queue.salon?.longitude && (
                            <div className="mb-4 space-y-3">
                              <CheckInButton
                                queueId={queue.id}
                                salonLocation={{
                                  latitude: queue.salon.latitude,
                                  longitude: queue.salon.longitude,
                                }}
                                onCheckInSuccess={() => {
                                  queryClient.invalidateQueries({ queryKey: ['/api/queues/my'] });
                                }}
                                onCheckInError={(error) => {
                                  console.error('Check-in error:', error);
                                }}
                              />

                              {/* Verification Disclaimer */}
                              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-amber-900 mb-1">
                                      Verification Required
                                    </p>
                                    <p className="text-xs text-amber-700 leading-relaxed">
                                      Your arrival will be verified by the salon. Please ensure you're actually at or near the location. Fake check-ins may result in account suspension.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Pending Verification Message */}
                          {queue.status === 'pending_verification' && (
                            <div className="mb-4">
                              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <Clock className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-blue-900 mb-1">
                                      Verifying Your Arrival
                                    </p>
                                    <p className="text-xs text-blue-700 leading-relaxed">
                                      The salon is reviewing your check-in. This usually takes a few moments. Please wait nearby.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Nearby Confirmed Message */}
                          {queue.status === 'nearby' && (
                            <div className="mb-4">
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="flex items-start gap-2">
                                  <MapPin className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-green-900 mb-1">
                                      Arrival Confirmed
                                    </p>
                                    <p className="text-xs text-green-700 leading-relaxed">
                                      Great! The salon has confirmed your arrival. Please wait for your turn to be called.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Service Details */}
                          <div className="space-y-2 mb-4 bg-white rounded-lg p-3 shadow-sm">
                            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Services</h4>
                            {queue.services && Array.isArray(queue.services) && queue.services.length > 0 ? (
                              <div className="space-y-1.5">
                                <p className="text-sm text-gray-700" data-testid={`text-services-count-${queue.id}`}>
                                  {queue.services.length} {queue.services.length === 1 ? 'service' : 'services'} selected
                                </p>
                                <div className="space-y-1" data-testid={`text-services-list-${queue.id}`}>
                                  {queue.services.map((service) => (
                                    <div key={service.id} className="flex justify-between text-xs">
                                      <span className="text-gray-600">{capitalizeWords(service.name)}</span>
                                      <span className="text-gray-900 font-medium">₹{Math.round(Number(service.price))}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex justify-between pt-1.5 border-t border-gray-200">
                                  <span className="text-sm font-medium text-gray-900">Total</span>
                                  <span className="text-sm font-semibold text-gray-900" data-testid={`text-total-price-${queue.id}`}>
                                    ₹{Math.round(Number(queue.totalPrice))}
                                  </span>
                                </div>
                                {queue.appliedOffers && queue.appliedOffers.length > 0 && (
                                  <p className="text-xs text-green-600 flex items-center gap-1">
                                    <Star className="w-3 h-3" />
                                    {queue.appliedOffers.length} discount applied
                                  </p>
                                )}
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-600" data-testid={`text-service-name-${queue.id}`}>{capitalizeWords(queue.service?.name || '')}</span>
                                  <span className="text-gray-900 font-medium" data-testid={`text-service-price-${queue.id}`}>₹{queue.service?.price}</span>
                                </div>
                                <p className="text-xs text-gray-500" data-testid={`text-service-duration-${queue.id}`}>
                                  {queue.service?.duration} minutes
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Action Buttons - Hide when service is in progress */}
                          {queue.status !== 'in-progress' && (
                            <div className="flex gap-2 pt-2">
                              <button
                                onClick={() => openDirections(queue.salon)}
                                className="flex-1 h-11 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                                data-testid={`button-directions-${queue.id}`}
                              >
                                <Navigation className="h-4 w-4" />
                                Show Map
                              </button>
                              <button
                                disabled={leaveQueueMutation.isPending}
                                onClick={() => leaveQueueMutation.mutate(queue.id)}
                                className="flex-1 h-11 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 disabled:opacity-50 rounded-lg transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                                data-testid={`button-leave-queue-${queue.id}`}
                              >
                                <XCircle className="h-4 w-4" />
                                {leaveQueueMutation.isPending ? 'Leaving...' : 'Leave'}
                              </button>
                            </div>
                          )}
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
    </>
  );
}