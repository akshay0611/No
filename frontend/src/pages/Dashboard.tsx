import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import QueueStatusBadge from "../components/QueueStatusBadge";
import QueueActionButtons from "../components/QueueActionButtons";
import ArrivalVerificationPanel from "../components/ArrivalVerificationPanel";

import {
  User,
  Users,
  Clock,
  Star,
  IndianRupee,
  Plus,
  Percent,
  BarChart3,
  Settings,
  TrendingUp,
  Sparkles,
  Camera,
  TrendingDown,
  LogOut,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { queryClient } from "../lib/queryClient";
import { insertSalonSchema, insertServiceSchema, insertOfferSchema } from "../lib/schemas";
import type { QueueWithDetails, Analytics } from "../types";
import GalleryManager from "../components/GalleryManager";
import LocationPicker from "../components/LocationPicker";
import LocationInputModal from "../components/LocationInputModal";
import QuickServiceTemplates from "../components/QuickServiceTemplates";

const serviceFormSchema = insertServiceSchema.omit({ salonId: true });
const offerFormSchema = insertOfferSchema.omit({ salonId: true });
const salonFormSchema = insertSalonSchema.omit({ ownerId: true });

type ServiceForm = z.infer<typeof serviceFormSchema>;
type OfferForm = z.infer<typeof offerFormSchema>;
type SalonForm = z.infer<typeof salonFormSchema>;

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedSalonId, setSelectedSalonId] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState("queue");
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set());
  const [expandedOffers, setExpandedOffers] = useState<Set<string>>(new Set());
  const [showCompletedQueues, setShowCompletedQueues] = useState(false);

  // Redirect to auth if no user (e.g., after logout)
  useEffect(() => {
    if (!user) {
      setLocation('/auth');
    }
  }, [user, setLocation]);

  // Get user's salons
  const { data: salons = [], isLoading: salonsLoading } = useQuery({
    queryKey: ['/api/salons'],
    enabled: !!user && user.role === 'salon_owner',
    select: (data: any[]) => data.filter((salon: any) => salon.ownerId === user?.id),
  });

  // Auto-select first salon if none selected
  if (!selectedSalonId && salons.length > 0) {
    setSelectedSalonId(salons[0].id);
  }

  // Get queue data for selected salon with real-time updates
  const { data: queues = [], isLoading: queuesLoading } = useQuery<QueueWithDetails[]>({
    queryKey: ['/api/salons', selectedSalonId, 'queues'],
    enabled: !!selectedSalonId,
    refetchInterval: 5000, // Fallback: refetch every 5 seconds
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  // Listen for WebSocket events to update queue list in real-time
  useEffect(() => {
    const handleQueueUpdate = () => {
      if (selectedSalonId) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/salons', selectedSalonId, 'queues'] 
        });
      }
    };

    // Listen for various queue-related WebSocket events
    window.addEventListener('queue_update', handleQueueUpdate);
    window.addEventListener('queue_position_update', handleQueueUpdate);
    window.addEventListener('customer_arrived', handleQueueUpdate);

    return () => {
      window.removeEventListener('queue_update', handleQueueUpdate);
      window.removeEventListener('queue_position_update', handleQueueUpdate);
      window.removeEventListener('customer_arrived', handleQueueUpdate);
    };
  }, [selectedSalonId]);

  // Filter and sort queues
  const filteredQueues = useMemo(() => {
    let filtered = queues;

    // Filter out completed and no-show queues unless showCompletedQueues is true
    if (!showCompletedQueues) {
      filtered = filtered.filter(q => q.status !== 'completed' && q.status !== 'no-show');
    }

    // Sort by position (ascending)
    return filtered.sort((a, b) => a.position - b.position);
  }, [queues, showCompletedQueues]);

  // Check if there are pending verifications
  const hasPendingVerifications = useMemo(() => {
    return queues.some(q => q.status === 'pending_verification');
  }, [queues]);

  // Get analytics for selected salon
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ['/api/analytics', selectedSalonId],
    enabled: !!selectedSalonId,
  });

  // Get offers for selected salon
  const { data: offers = [], isLoading: offersLoading, error: offersError } = useQuery({
    queryKey: ['salon-offers', selectedSalonId],
    enabled: !!selectedSalonId,
    queryFn: async () => {
      console.log('Fetching offers for salon:', selectedSalonId);
      const token = localStorage.getItem('smartq_token');
      console.log('Using token:', token ? 'Token exists' : 'No token');

      const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
      const response = await fetch(`${baseURL}/api/salons/${selectedSalonId}/offers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch offers:', errorText);
        throw new Error(`Failed to fetch offers: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('Received offers data:', data);
      return data;
    },
  });

  // Get services for selected salon
  const { data: services = [], isLoading: servicesLoading, error: servicesError } = useQuery({
    queryKey: ['salon-services', selectedSalonId],
    enabled: !!selectedSalonId,
    queryFn: async () => {
      console.log('Fetching services for salon:', selectedSalonId);
      const token = localStorage.getItem('smartq_token');
      console.log('Using token:', token ? 'Token exists' : 'No token');

      const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
      const response = await fetch(`${baseURL}/api/salons/${selectedSalonId}/services`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('Response status:', response.status);
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to fetch services:', errorText);
        throw new Error(`Failed to fetch services: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log('Received services data:', data);
      return data;
    },
  });

  // Debug offers
  console.log('Offers state:', { offers, offersLoading, offersError, selectedSalonId });

  // Debug services
  console.log('Services state:', { services, servicesLoading, servicesError, selectedSalonId });

  // Forms
  const salonForm = useForm<SalonForm>({
    resolver: zodResolver(salonFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "unisex",
      operatingHours: {},
      images: [],
    },
    mode: "onChange", // Enable real-time validation
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

  const serviceForm = useForm<ServiceForm>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      duration: 30,
      price: "0",
      description: "",
    },
  });

  const offerForm = useForm<OfferForm>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      title: "",
      description: "",
      discount: 10,
      validityPeriod: new Date(new Date().setMonth(new Date().getMonth() + 1)),
      isActive: true,
    },
  });

  // Mutations
  const createSalonMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('=== STARTING SALON CREATION ===');
      console.log('Salon data:', data);
      console.log('Selected images count:', selectedImages.length);

      try {
        // First create the salon
        console.log('Step 1: Creating salon...');
        const createdSalon = await api.salons.create(data);
        console.log('✅ Salon created successfully:', createdSalon);

        // Then upload images if any are selected
        if (selectedImages.length > 0) {
          console.log('Step 2: Starting image upload process...');

          for (let i = 0; i < selectedImages.length; i++) {
            const image = selectedImages[i];
            console.log(`Uploading image ${i + 1}/${selectedImages.length}: ${image.name}`);

            const formData = new FormData();
            formData.append('image', image);

            const token = localStorage.getItem('smartq_token');
            const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
            const uploadUrl = `${baseURL}/api/salons/${createdSalon.id}/photos`;

            const response = await fetch(uploadUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: formData,
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('❌ Image upload failed:', response.status, errorText);
              throw new Error(`Failed to upload image ${image.name}: ${response.status} ${errorText}`);
            }

            const result = await response.json();
            console.log(`✅ Image ${i + 1} uploaded successfully:`, result);
          }

          console.log('✅ All images uploaded successfully');
        }

        console.log('=== SALON CREATION COMPLETED SUCCESSFULLY ===');
        return createdSalon;

      } catch (error) {
        console.error('❌ Salon creation failed:', error);
        throw error;
      }
    },
    onSuccess: (createdSalon) => {
      console.log('🎉 Salon creation success callback triggered');
      toast({
        title: "Success!",
        description: "Salon created successfully!",
      });

      // Refresh the salons list
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });

      // Reset form and state
      salonForm.reset();
      setSelectedImages([]);
      setSelectedLocation(null);

      console.log('✅ Form reset and queries invalidated');
    },
    onError: (error: any) => {
      console.error('❌ Salon creation error callback triggered:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create salon. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: api.services.create,
    onSuccess: () => {
      toast({
        title: "Service added successfully!",
        description: "The new service is now available for booking.",
      });
      queryClient.invalidateQueries({ queryKey: ['salon-services', selectedSalonId] });
      serviceForm.reset();
      setIsServiceDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to add service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createOfferMutation = useMutation({
    mutationFn: api.offers.create,
    onSuccess: () => {
      toast({
        title: "Offer created successfully!",
        description: "Your promotion is now active.",
      });
      offerForm.reset();
      setIsOfferDialogOpen(false);
      // Invalidate offers query to refresh the list
      queryClient.invalidateQueries({
        queryKey: ['salon-offers', selectedSalonId]
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to create offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateQueueMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      api.queue.update(id, updates),
    onSuccess: () => {
      toast({
        title: "Queue updated successfully",
        description: "Customer status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/salons', selectedSalonId, 'queues'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update queue",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateOfferMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<OfferForm> }) =>
      api.offers.update(id, updates),
    onSuccess: () => {
      toast({
        title: "Offer updated successfully!",
        description: "Your promotion has been updated.",
      });
      queryClient.invalidateQueries({
        queryKey: ['salon-offers', selectedSalonId]
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (id: string) => api.offers.delete(id),
    onSuccess: () => {
      toast({
        title: "Offer deleted successfully!",
        description: "The promotion has been removed.",
      });
      queryClient.invalidateQueries({
        queryKey: ['salon-offers', selectedSalonId]
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete offer",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      api.services.update(id, updates),
    onSuccess: () => {
      toast({
        title: "Service updated successfully!",
        description: "The service status has been updated.",
      });
      queryClient.invalidateQueries({
        queryKey: ['salon-services', selectedSalonId]
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to update service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => api.services.delete(id),
    onSuccess: () => {
      toast({
        title: "Service deleted successfully!",
        description: "The service has been removed.",
      });
      queryClient.invalidateQueries({
        queryKey: ['salon-services', selectedSalonId]
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete service",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSalonSubmit = async (data: SalonForm) => {
    console.log('🚀 Form submission started');
    console.log('Form data:', data);
    console.log('Selected location:', selectedLocation);
    console.log('Selected images count:', selectedImages.length);
    console.log('User:', user);

    // Validation checks
    if (selectedImages.length === 0) {
      console.log('❌ Validation failed: No images selected');
      toast({
        title: "Images Required",
        description: "Please select at least one salon photo.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.id) {
      console.log('❌ Validation failed: No user ID');
      toast({
        title: "Authentication Error",
        description: "Please log in again to create a salon.",
        variant: "destructive",
      });
      return;
    }

    if (!data.name?.trim()) {
      console.log('❌ Validation failed: No salon name');
      toast({
        title: "Salon Name Required",
        description: "Please enter a salon name.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedLocation) {
      console.log('❌ Validation failed: No location provided');
      toast({
        title: "Location Required",
        description: "Please select or enter a salon location.",
        variant: "destructive",
      });
      return;
    }

    // Prepare salon data
    const salonData = {
      ...data,
      address: selectedLocation.address,
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      ownerId: user.id,
    };

    console.log('✅ Validation passed, submitting salon data:', salonData);

    try {
      await createSalonMutation.mutateAsync(salonData);
      console.log('🎉 Salon creation completed successfully');
    } catch (error) {
      console.error('❌ Salon creation failed in submit handler:', error);
    }
  };

  const onServiceSubmit = (data: ServiceForm) => {
    if (!selectedSalonId) return;
    createServiceMutation.mutate({
      ...data,
      salonId: selectedSalonId,
    });
  };

  const onOfferSubmit = (data: OfferForm) => {
    if (!selectedSalonId) return;
    console.log('Offer form data:', data);

    // Ensure all required fields are present and properly formatted
    const offerData = {
      title: data.title.trim(),
      description: data.description.trim(),
      discount: typeof data.discount === 'number' ? data.discount : parseFloat(data.discount.toString()),
      validityPeriod: data.validityPeriod instanceof Date ? data.validityPeriod : new Date(data.validityPeriod),
      isActive: Boolean(data.isActive),
      salonId: selectedSalonId,
    };

    console.log('Sending offer data:', offerData);
    createOfferMutation.mutate(offerData);
  };

  // Show access denied only for authenticated users who are not salon owners
  if (user && user.role !== 'salon_owner') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white border border-teal-200 rounded-3xl p-8 text-center shadow-lg">
          <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-teal-900 mb-3">Access Denied</h1>
          <p className="text-teal-700 text-sm">This dashboard is only available for salon owners.</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (salonsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Mobile Loading Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-teal-200 rounded-full w-32 mb-2"></div>
            <div className="h-4 bg-teal-100 rounded-full w-24"></div>
          </div>
        </div>

        {/* Loading Cards */}
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-teal-100 rounded-2xl animate-pulse"></div>
            ))}
          </div>
          <div className="h-96 bg-teal-50 rounded-3xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Background Logo */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <img
          src="/loadlogo.png"
          alt="Background Logo"
          className="w-96 h-96 opacity-5 filter grayscale"
        />
      </div>

      {/* Mobile Header */}
      <div className="sticky top-0 bg-white border-b border-gray-100 z-50 relative">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center p-1">
                <img
                  src="/loadlogo.png"
                  alt="YEF Samrat Logo"
                  className="h-8 w-8 filter brightness-0 invert"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-teal-700">
                  {salons.find((s: any) => s.id === selectedSalonId)?.name || "Salon Dashboard"}
                </p>
                {salons.find((s: any) => s.id === selectedSalonId)?.name && (
                  <p className="text-xs text-gray-500">Welcome 👋</p>
                )}
              </div>
            </div>
          </div>
          {/* <div className="flex items-center space-x-2">
            <Button variant="ghost" size="lg" className="p-2 rounded-full hover:bg-gray-100">
              <User className="h-20 text-black" />
            </Button>
          </div> */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="lg" className="p-2 rounded-full hover:bg-gray-100">
                <User className="h-20 text-black" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>My Account</SheetTitle>
                <SheetDescription>
                  Manage your account settings and preferences.
                </SheetDescription>
              </SheetHeader>
              <div className="py-4">
                <Button
                  variant="ghost"
                  onClick={() => logout()}
                  className="w-full justify-start p-2 text-left font-normal"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Salon Selector - Mobile Scrollable */}
        {salons.length > 1 && (
          <div className="px-4 pb-3">
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
              {salons.map((salon: any) => (
                <Button
                  key={salon.id}
                  variant={selectedSalonId === salon.id ? "default" : "outline"}
                  onClick={() => setSelectedSalonId(salon.id)}
                  className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${selectedSalonId === salon.id
                    ? "bg-teal-600 text-white"
                    : "bg-white text-teal-700 border-teal-300 hover:bg-teal-50"
                    }`}
                  data-testid={`button-salon-${salon.id}`}
                >
                  {salon.name}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>

      {salons.length === 0 ? (
        <div className="p-4 pb-24 relative z-10">
          <div className="bg-white border border-teal-200 rounded-3xl p-8 text-center mt-8 shadow-sm">
            <div className="w-20 h-20 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Settings className="h-10 w-10 text-white" />
            </div>
            <h2 className="text-xl font-bold text-teal-900 mb-3">No salons found</h2>
            <p className="text-teal-700 text-sm mb-6">
              Create your first salon to start managing queues and tracking analytics.
            </p>

            {/* Create Salon Dialog */}
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  className="w-full bg-teal-600 text-white hover:bg-teal-700 rounded-2xl py-3 font-medium"
                  data-testid="button-create-salon"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Salon
                </Button>
              </DialogTrigger>
              <DialogContent className="mx-2 max-w-[95vw] sm:max-w-md w-full max-h-[90vh] overflow-hidden rounded-3xl p-0">
                <div className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader className="text-center p-6 pb-4 sticky top-0 bg-white z-10 border-b border-gray-100">
                    <DialogTitle className="text-lg font-bold">Create New Salon</DialogTitle>
                    <DialogDescription className="text-sm text-gray-600">
                      Add your salon to SmartQ and start managing queues.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="p-6 pt-4">
                    <Form {...salonForm}>
                      <form
                        onSubmit={(e) => {
                          console.log('🔥 Form submit event triggered');
                          console.log('Form errors:', salonForm.formState.errors);
                          console.log('Form values:', salonForm.getValues());
                          console.log('Form is valid:', salonForm.formState.isValid);
                          salonForm.handleSubmit(
                            (data) => {
                              console.log('✅ Form validation passed, calling onSalonSubmit');
                              onSalonSubmit(data);
                            },
                            (errors) => {
                              console.log('❌ Form validation failed:', errors);
                              // Show validation errors to user
                              const errorMessages = Object.entries(errors)
                                .map(([field, error]) => `${field}: ${error?.message}`)
                                .join(', ');
                              toast({
                                title: "Form Validation Error",
                                description: `Please fix the following: ${errorMessages}`,
                                variant: "destructive",
                              });
                            }
                          )(e);
                        }}
                        className="space-y-4"
                      >
                        <FormField
                          control={salonForm.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-teal-900">Salon Name</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter salon name"
                                  {...field}
                                  data-testid="input-salon-name"
                                  className="h-12 rounded-xl border-gray-300 focus:border-teal-500 focus:ring-teal-500 text-base"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={salonForm.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-teal-900">Salon Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger
                                    data-testid="select-salon-type"
                                    className="h-12 rounded-xl border-gray-300 focus:border-teal-500 focus:ring-teal-500 text-base"
                                  >
                                    <SelectValue placeholder="Select salon type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent className="rounded-xl">
                                  <SelectItem value="men">Men's Salon</SelectItem>
                                  <SelectItem value="women">Women's Salon</SelectItem>
                                  <SelectItem value="unisex">Unisex Salon</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={salonForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm font-medium text-teal-900">Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Describe your salon..."
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="textarea-salon-description"
                                  className="rounded-xl border-gray-300 focus:border-teal-500 focus:ring-teal-500 resize-none text-base min-h-[80px]"
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Location Picker */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-teal-900">
                            Salon Location <span className="text-red-500">*</span>
                          </label>
                          <LocationPicker
                            onLocationSelect={(location) => {
                              setSelectedLocation(location);
                              // Update the form's location field
                              salonForm.setValue('location', location.address);
                            }}
                            initialLocation={selectedLocation}
                          />
                        </div>

                        {/* Image Upload */}
                        <div className="space-y-3">
                          <label className="text-sm font-medium text-teal-900">
                            Salon Photos <span className="text-red-500">*</span>
                          </label>
                          <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${selectedImages.length === 0
                            ? 'border-red-200 bg-red-50'
                            : 'border-teal-200 bg-teal-50'
                            }`}>
                            <Camera className={`h-10 w-10 mx-auto mb-3 ${selectedImages.length === 0 ? 'text-red-400' : 'text-teal-400'
                              }`} />
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => {
                                const files = Array.from(e.target.files || []);
                                setSelectedImages(files);
                              }}
                              className="hidden"
                              id="salon-images"
                              data-testid="input-salon-images"
                            />
                            <label
                              htmlFor="salon-images"
                              className="cursor-pointer block"
                            >
                              <div className="text-base font-medium text-teal-900 mb-2">
                                {selectedImages.length === 0 ? "Add Photos" : `${selectedImages.length} Selected`}
                              </div>
                              <div className={`text-sm ${selectedImages.length === 0 ? 'text-red-500' : 'text-teal-600'
                                }`}>
                                {selectedImages.length === 0
                                  ? "Tap to select salon photos"
                                  : `${selectedImages.length} photo${selectedImages.length !== 1 ? 's' : ''} ready to upload`}
                              </div>
                            </label>

                            {selectedImages.length > 0 && (
                              <div className="grid grid-cols-3 gap-2 mt-4">
                                {selectedImages.slice(0, 3).map((file, index) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={URL.createObjectURL(file)}
                                      alt={`Preview ${index + 1}`}
                                      className="w-full h-20 object-cover rounded-lg border-2 border-teal-200"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setSelectedImages(prev => prev.filter((_, i) => i !== index));
                                      }}
                                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold shadow-lg"
                                    >
                                      ×
                                    </button>
                                  </div>
                                ))}
                                {selectedImages.length > 3 && (
                                  <div className="flex items-center justify-center bg-teal-100 rounded-lg text-sm text-teal-700 font-medium h-20">
                                    +{selectedImages.length - 3} more
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          type="submit"
                          className={`w-full rounded-2xl py-3 font-medium mt-6 ${selectedImages.length === 0
                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                            : "bg-teal-600 text-white hover:bg-teal-700"
                            }`}
                          disabled={createSalonMutation.isPending || selectedImages.length === 0}
                          data-testid="button-submit-salon"
                        >
                          {createSalonMutation.isPending ? (
                            <div className="flex items-center justify-center space-x-2">
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>Creating...</span>
                            </div>
                          ) : selectedImages.length === 0 ? (
                            "Add Photos to Continue"
                          ) : (
                            "Create Salon"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      ) : (
        <>
          {selectedSalonId && (
            <>
              {/* Analytics Cards - Mobile Grid */}
              <div className="p-4 pb-24 relative z-10">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-white border border-teal-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <Users className="h-5 w-5 text-teal-600" />
                      <span className="text-xs text-teal-500">TODAY</span>
                    </div>
                    <div className="text-2xl font-bold text-teal-900" data-testid="text-customers-today">
                      {analyticsLoading ? "..." : analytics?.customersToday || 0}
                    </div>
                    <div className="text-xs text-teal-700">Customers</div>
                  </div>

                  <div className="bg-white border border-teal-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <Clock className="h-5 w-5 text-teal-600" />
                      <span className="text-xs text-teal-500">AVG</span>
                    </div>
                    <div className="text-2xl font-bold text-teal-900" data-testid="text-avg-wait">
                      {analyticsLoading ? "..." : `${Math.round(analytics?.avgWaitTime || 0)}m`}
                    </div>
                    <div className="text-xs text-teal-700">Wait Time</div>
                  </div>

                  <div className="bg-white border border-teal-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <Star className="h-5 w-5 text-teal-600" />
                      <span className="text-xs text-teal-500">RATING</span>
                    </div>
                    <div className="text-2xl font-bold text-teal-900" data-testid="text-rating">
                      {analyticsLoading ? "..." : analytics?.rating?.toFixed(1) || "0.0"}
                    </div>
                    <div className="text-xs text-teal-700">Stars</div>
                  </div>

                  <div className="bg-white border border-teal-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <IndianRupee className="h-5 w-5 text-teal-600" />
                      <span className="text-xs text-teal-500">REVENUE</span>
                    </div>
                    <div className="text-2xl font-bold text-teal-900" data-testid="text-revenue">
                      {analyticsLoading ? "..." : `${analytics?.revenue?.toFixed(0) || "0"}`}
                    </div>
                    <div className="text-xs text-teal-700">Total</div>
                  </div>
                </div>

                {/* Mobile Tab Navigation */}
                {/* <div className="mb-6">
                  <div className="flex space-x-1 p-1 bg-gray-100 rounded-2xl">
                    {[
                      { id: 'queue', label: 'Queue', icon: Users },
                      { id: 'services', label: 'Services', icon: Settings },
                      { id: 'offers', label: 'Offers', icon: Percent },
                      { id: 'gallery', label: 'Gallery', icon: Camera },
                      { id: 'analytics', label: 'Stats', icon: BarChart3 }
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        onClick={() => setActiveTab(id)}
                        className={`flex-1 flex flex-col items-center py-2 px-1 rounded-xl text-xs font-medium transition-colors ${
                          activeTab === id 
                            ? 'bg-white text-black shadow-sm' 
                            : 'text-gray-600'
                        }`}
                        data-testid={`tab-${id}`}
                      >
                        <Icon className="h-4 w-4 mb-1" />
                        {label}
                      </button>
                    ))}
                  </div>
                </div> */}

                {/* Tab Content */}
                {activeTab === 'queue' && (
                  <div className="space-y-4">
                    {/* Arrival Verification Panel - Show when there are pending verifications */}
                    {hasPendingVerifications && selectedSalonId && (
                      <ArrivalVerificationPanel
                        salonId={selectedSalonId}
                        onVerificationComplete={() => {
                          queryClient.invalidateQueries({ 
                            queryKey: ['/api/salons', selectedSalonId, 'queues'] 
                          });
                        }}
                      />
                    )}

                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-black">Current Queue</h2>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCompletedQueues(!showCompletedQueues)}
                          className="text-xs"
                        >
                          {showCompletedQueues ? 'Hide' : 'Show'} Completed
                        </Button>
                        <Badge variant="outline" className="border-gray-300 text-gray-600">
                          {filteredQueues.length} {showCompletedQueues ? 'total' : 'active'}
                        </Badge>
                      </div>
                    </div>

                    {queuesLoading ? (
                      <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
                        ))}
                      </div>
                    ) : filteredQueues.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Users className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">No customers in queue</p>
                        <p className="text-gray-400 text-xs mt-1">New customers will appear here</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredQueues.map((queue) => (
                            <div key={queue.id} className="bg-white border border-teal-200 rounded-2xl p-4 shadow-sm" data-testid={`queue-item-${queue.id}`}>
                              <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${queue.status === 'in-progress'
                                    ? 'bg-black text-white'
                                    : 'border-2 border-dashed border-gray-300 text-gray-500'
                                    }`}>
                                    {queue.position}
                                  </div>
                                  <div>
                                    <div className="font-medium text-black text-sm" data-testid={`text-customer-name-${queue.id}`}>
                                      {queue.user?.name || 'Customer'}
                                    </div>
                                    {queue.user?.phone && (
                                      <div className="text-xs text-gray-500 mt-0.5">
                                        {queue.user.phone}
                                      </div>
                                    )}
                                    <div className="mt-1">
                                      <QueueStatusBadge status={queue.status} />
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Services */}
                              <div className="mb-4" data-testid={`text-services-${queue.id}`}>
                                {queue.services && Array.isArray(queue.services) && queue.services.length > 0 ? (
                                  <div className="space-y-2">
                                    {queue.services.map((service) => (
                                      <div key={service.id} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-700">{service.name}</span>
                                        <span className="text-black font-medium">₹{service.price}</span>
                                      </div>
                                    ))}
                                    <div className="border-t border-gray-100 pt-2 flex justify-between items-center">
                                      <span className="text-sm font-medium text-black">Total</span>
                                      <span className="font-bold text-black">₹{queue.totalPrice}</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-700">{queue.service?.name}</span>
                                    <span className="text-black font-medium">₹{queue.service?.price}</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <QueueActionButtons
                                queue={queue}
                                onActionComplete={() => {
                                  queryClient.invalidateQueries({ 
                                    queryKey: ['/api/salons', selectedSalonId, 'queues'] 
                                  });
                                }}
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'services' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-black">Services</h2>
                      <Button
                        className="bg-teal-600 text-white hover:bg-teal-700 rounded-xl px-4 py-2"
                        data-testid="button-add-service"
                        onClick={() => {
                          const currentSalon = salons.find((s: any) => s.id === selectedSalonId);
                          console.log('Add Service clicked - Current salon:', {
                            id: currentSalon?.id,
                            name: currentSalon?.name,
                            manualLocation: currentSalon?.manualLocation,
                            hasManualLocation: !!currentSalon?.manualLocation && currentSalon.manualLocation.trim() !== ''
                          });

                          if (!currentSalon?.manualLocation || currentSalon.manualLocation.trim() === '') {
                            console.log('Opening location modal - no manual location set');
                            setIsLocationModalOpen(true);
                          } else {
                            console.log('Opening service dialog - manual location exists:', currentSalon.manualLocation);
                            setIsServiceDialogOpen(true);
                          }
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add
                      </Button>
                      <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                        <DialogContent className="mx-2 max-w-[95vw] sm:max-w-md w-full max-h-[90vh] overflow-hidden rounded-3xl p-0">
                          <div className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader className="text-center p-6 pb-4 sticky top-0 bg-white z-10 border-b border-gray-100">
                              <DialogTitle className="text-lg font-bold">Add New Service</DialogTitle>
                              <DialogDescription className="text-sm text-gray-600">
                                Create a new service for your salon.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="p-6 pt-4">
                              <Form {...serviceForm}>
                                <form onSubmit={serviceForm.handleSubmit(onServiceSubmit)} className="space-y-4">
                                  <FormField
                                    control={serviceForm.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-sm font-medium text-teal-900">Service Name</FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="e.g., Haircut"
                                            {...field}
                                            data-testid="input-service-name"
                                            className="rounded-xl border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                      control={serviceForm.control}
                                      name="duration"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-medium text-teal-900">Duration (min)</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              {...field}
                                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                                              data-testid="input-service-duration"
                                              className="rounded-xl border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={serviceForm.control}
                                      name="price"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-medium text-teal-900">Price (₹)</FormLabel>
                                          <FormControl>
                                            <Input
                                              placeholder="0"
                                              {...field}
                                              data-testid="input-service-price"
                                              className="rounded-xl border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <FormField
                                    control={serviceForm.control}
                                    name="description"
                                    render={({ field }) => (
                                      <FormItem>
                                        <div className="flex justify-between items-center">
                                          <FormLabel className="text-sm font-medium text-teal-900">Description</FormLabel>
                                          <Button 
                                            type="button" 
                                            variant="outline" 
                                            size="sm"
                                            className="text-xs flex items-center gap-1 h-7 px-2 text-teal-600 border-teal-300 hover:bg-teal-50"
                                            onClick={async () => {
                                              const serviceName = serviceForm.getValues("name");
                                              if (!serviceName) {
                                                toast({
                                                  title: "Service name required",
                                                  description: "Please enter a service name first",
                                                  variant: "destructive",
                                                });
                                                return;
                                              }
                                              
                                              try {
                                                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/generate-description`, {
                                                  method: "POST",
                                                  headers: {
                                                    "Content-Type": "application/json",
                                                  },
                                                  body: JSON.stringify({ serviceName }),
                                                });
                                                
                                                if (!response.ok) {
                                                  throw new Error("Failed to generate description");
                                                }
                                                
                                                const data = await response.json();
                                                field.onChange(data.description);
                                                
                                                toast({
                                                  title: "Description generated",
                                                  description: "AI has created a description for your service",
                                                  variant: "default",
                                                });
                                              } catch (error) {
                                                console.error("Error generating description:", error);
                                                toast({
                                                  title: "Generation failed",
                                                  description: "Could not generate description. Please try again.",
                                                  variant: "destructive",
                                                });
                                              }
                                            }}
                                            disabled={!serviceForm.getValues("name")}
                                          >
                                            <Sparkles className="h-3 w-3" />
                                            Generate with AI
                                          </Button>
                                        </div>
                                        <FormControl>
                                          <Textarea
                                            placeholder="Service description..."
                                            {...field}
                                            value={field.value || ""}
                                            data-testid="textarea-service-description"
                                            className="rounded-xl border-gray-300 focus:border-black focus:ring-black resize-none"
                                            rows={3}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <Button
                                    type="submit"
                                    className="w-full bg-teal-600 text-white hover:bg-teal-700 rounded-2xl py-3 font-medium"
                                    disabled={createServiceMutation.isPending}
                                    data-testid="button-submit-service"
                                  >
                                    {createServiceMutation.isPending ? "Adding..." : "Add Service"}
                                  </Button>
                                </form>
                              </Form>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {/* Quick Service Templates */}
                    {selectedSalonId && salons.find((s: any) => s.id === selectedSalonId) && (
                      <QuickServiceTemplates
                        salonType={salons.find((s: any) => s.id === selectedSalonId)?.type || "unisex"}
                        salonId={selectedSalonId}
                        onServicesAdded={() => {
                          queryClient.invalidateQueries({ queryKey: ['salon-services', selectedSalonId] });
                        }}
                      />
                    )}

                    <div className="space-y-3">
                      {servicesLoading ? (
                        [...Array(3)].map((_, i) => (
                          <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse"></div>
                        ))
                      ) : services.length > 0 ? (
                        services.map((service: any) => (
                          <div key={service.id} className="bg-white border border-teal-200 rounded-2xl p-4 shadow-sm" data-testid={`service-item-${service.id}`}>
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h4 className="font-medium text-black" data-testid={`text-service-name-${service.id}`}>
                                  {service.name}
                                </h4>
                                <div className="flex items-center space-x-3 mt-1">
                                  <span className="text-sm text-gray-600" data-testid={`text-service-details-${service.id}`}>
                                    {service.duration} min
                                  </span>
                                  <span className="text-sm font-medium text-black">
                                    ₹{service.price}
                                  </span>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className="border-gray-300 text-gray-600"
                                data-testid={`badge-bookings-${service.id}`}
                              >
                                {analytics?.popularServices?.find(s => s.id === service.id)?.bookings || 0} bookings
                              </Badge>
                            </div>
                            {service.description && (
                              <div className="mb-3">
                                <p className="text-gray-600 leading-relaxed" data-testid={`text-service-description-${service.id}`}>
                                  {expandedServices.has(service.id)
                                    ? service.description
                                    : service.description.length > 80
                                      ? `${service.description.slice(0, 80)}...`
                                      : service.description
                                  }
                                </p>
                                {service.description.length > 80 && (
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedServices);
                                      if (expandedServices.has(service.id)) {
                                        newExpanded.delete(service.id);
                                      } else {
                                        newExpanded.add(service.id);
                                      }
                                      setExpandedServices(newExpanded);
                                    }}
                                    className="text-teal-600 hover:text-teal-700 font-semibold text-base mt-2 transition-colors inline-block"
                                  >
                                    {expandedServices.has(service.id) ? 'Read Less' : 'Read More'}
                                  </button>
                                )}
                              </div>
                            )}
                            <div className="flex space-x-2 pt-2 border-t border-gray-100">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateServiceMutation.mutate({
                                  id: service.id,
                                  updates: { isActive: !service.isActive }
                                })}
                                disabled={updateServiceMutation.isPending}
                                className={`flex-1 rounded-xl ${service.isActive
                                  ? 'border-orange-300 text-orange-600 hover:bg-orange-50'
                                  : 'border-green-300 text-green-600 hover:bg-green-50'
                                  }`}
                                data-testid={`button-toggle-service-${service.id}`}
                              >
                                {service.isActive ? 'Deactivate' : 'Activate'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this service?')) {
                                    deleteServiceMutation.mutate(service.id);
                                  }
                                }}
                                disabled={deleteServiceMutation.isPending}
                                className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                                data-testid={`button-delete-service-${service.id}`}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Settings className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-gray-500 text-sm">No services added yet</p>
                          <p className="text-gray-400 text-xs mt-1">Add services to start taking bookings</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'offers' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-bold text-black">Offers & Promotions</h2>
                      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            className="bg-teal-600 text-white hover:bg-teal-700 rounded-xl px-4 py-2"
                            data-testid="button-add-offer"
                          >
                            <Percent className="h-4 w-4 mr-2" />
                            Create
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="mx-2 max-w-[95vw] sm:max-w-md w-full max-h-[90vh] overflow-hidden rounded-3xl p-0">
                          <div className="max-h-[90vh] overflow-y-auto">
                            <DialogHeader className="text-center p-6 pb-4 sticky top-0 bg-white z-10 border-b border-gray-100">
                              <DialogTitle className="text-lg font-bold">Create New Offer</DialogTitle>
                              <DialogDescription className="text-sm text-gray-600">
                                Create a promotional offer for your customers.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="p-6 pt-4">
                              <Form {...offerForm}>
                                <form onSubmit={offerForm.handleSubmit(onOfferSubmit)} className="space-y-4">
                                  <FormField
                                    control={offerForm.control}
                                    name="title"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-sm font-medium text-black">Offer Title</FormLabel>
                                        <FormControl>
                                          <Input
                                            placeholder="e.g., Summer Special"
                                            {...field}
                                            data-testid="input-offer-title"
                                            className="rounded-xl border-gray-300 focus:border-black focus:ring-black"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={offerForm.control}
                                    name="description"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="text-sm font-medium text-black">Description</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            placeholder="Describe your offer..."
                                            {...field}
                                            data-testid="textarea-offer-description"
                                            className="rounded-xl border-gray-300 focus:border-black focus:ring-black resize-none"
                                            rows={3}
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="grid grid-cols-2 gap-3">
                                    <FormField
                                      control={offerForm.control}
                                      name="discount"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-medium text-black">Discount (%)</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              min="1"
                                              max="99"
                                              step="0.01"
                                              placeholder="10"
                                              {...field}
                                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                              data-testid="input-offer-discount"
                                              className="rounded-xl border-gray-300 focus:border-black focus:ring-black"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={offerForm.control}
                                      name="validityPeriod"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="text-sm font-medium text-black">Valid Until</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="date"
                                              {...field}
                                              min={new Date().toISOString().split('T')[0]}
                                              value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : ''}
                                              onChange={(e) => {
                                                const selectedDate = new Date(e.target.value);
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);

                                                if (selectedDate < today) {
                                                  toast({
                                                    title: "Invalid date",
                                                    description: "Please select a future date",
                                                    variant: "destructive"
                                                  });
                                                  return;
                                                }

                                                field.onChange(selectedDate);
                                              }}
                                              data-testid="input-offer-validity"
                                              className="rounded-xl border-gray-300 focus:border-black focus:ring-black"
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <Button
                                    type="submit"
                                    className="w-full bg-teal-600 text-white hover:bg-teal-700 rounded-2xl py-3 font-medium"
                                    disabled={createOfferMutation.isPending}
                                    data-testid="button-submit-offer"
                                  >
                                    {createOfferMutation.isPending ? "Creating..." : "Create Offer"}
                                  </Button>
                                </form>
                              </Form>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {offersLoading ? (
                      <div className="space-y-3">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="h-24 bg-gray-100 rounded-2xl animate-pulse"></div>
                        ))}
                      </div>
                    ) : offers.length > 0 ? (
                      <div className="space-y-3">
                        {offers.map((offer: any) => (
                          <div key={offer.id} className="bg-white border border-teal-200 rounded-2xl p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex-1">
                                <h3 className="font-medium text-black">{offer.title}</h3>
                                <div className="mt-1">
                                  <p className="text-sm text-gray-600">
                                    {expandedOffers.has(offer.id)
                                      ? offer.description
                                      : offer.description.length > 80
                                        ? `${offer.description.slice(0, 80)}...`
                                        : offer.description
                                    }
                                  </p>
                                  {offer.description.length > 80 && (
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
                                      className="text-teal-600 hover:text-teal-700 font-semibold text-sm mt-1 transition-colors inline-block"
                                    >
                                      {expandedOffers.has(offer.id) ? 'Read Less' : 'Read More'}
                                    </button>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Badge
                                  className={`${offer.isActive
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}
                                >
                                  {offer.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                            </div>

                            <div className="flex items-center justify-between mb-3">
                              <Badge variant="outline" className="border-black text-black font-medium">
                                {offer.discount}% OFF
                              </Badge>
                              <span className="text-xs text-gray-500">
                                Valid until {new Date(offer.validityPeriod).toLocaleDateString()}
                              </span>
                            </div>

                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateOfferMutation.mutate({
                                  id: offer.id,
                                  updates: { isActive: !offer.isActive }
                                })}
                                disabled={updateOfferMutation.isPending}
                                className="flex-1 border-gray-300 text-black hover:bg-gray-50 rounded-xl"
                              >
                                {offer.isActive ? "Deactivate" : "Activate"}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this offer?")) {
                                    deleteOfferMutation.mutate(offer.id);
                                  }
                                }}
                                disabled={deleteOfferMutation.isPending}
                                className="px-3 border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Percent className="h-8 w-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 text-sm">No active offers</p>
                        <p className="text-gray-400 text-xs mt-1">Create offers to attract more customers</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'gallery' && (
                  <div className="space-y-4">
                    <h2 className="text-lg font-bold text-black">Gallery</h2>
                    <GalleryManager salonId={selectedSalonId} />
                  </div>
                )}

                {activeTab === 'analytics' && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-bold text-black">Analytics</h2>

                    <div className="bg-white border border-teal-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-teal-900">Performance Metrics</h3>
                        <TrendingUp className="h-5 w-5 text-teal-600" />
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-sm text-gray-600">Show-up Rate</span>
                          <span className="font-medium text-black" data-testid="text-show-rate">
                            {analyticsLoading ? "..." : `${Math.round(analytics?.showRate || 0)}%`}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-sm text-gray-600">Total Customers</span>
                          <span className="font-medium text-black" data-testid="text-total-customers">
                            {analyticsLoading ? "..." : analytics?.totalCustomers || 0}
                          </span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="text-sm text-gray-600">Average Rating</span>
                          <span className="font-medium text-black" data-testid="text-average-rating">
                            {analyticsLoading ? "..." : analytics?.rating?.toFixed(1) || "0.0"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-teal-200 rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-medium text-teal-900">Popular Services</h3>
                        <BarChart3 className="h-5 w-5 text-teal-600" />
                      </div>
                      <div className="space-y-3">
                        {analyticsLoading ? (
                          [...Array(3)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse"></div>
                          ))
                        ) : analytics?.popularServices?.length ? (
                          analytics.popularServices.slice(0, 5).map((service) => (
                            <div key={service.id} className="flex items-center justify-between p-3 bg-teal-50 rounded-xl" data-testid={`popular-service-${service.id}`}>
                              <span className="font-medium text-teal-900 text-sm" data-testid={`text-popular-service-name-${service.id}`}>
                                {service.name}
                              </span>
                              <Badge variant="outline" className="border-gray-300 text-gray-600 text-xs" data-testid={`badge-popular-service-bookings-${service.id}`}>
                                {service.bookings} bookings
                              </Badge>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <TrendingDown className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">No service data available</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-pb shadow-lg">
        <div className="grid grid-cols-5 py-3">
          {[
            { id: 'queue', label: 'Queue', icon: Users, active: activeTab === 'queue' },
            { id: 'services', label: 'Services', icon: Settings, active: activeTab === 'services' },
            { id: 'offers', label: 'Offers', icon: Percent, active: activeTab === 'offers' },
            { id: 'gallery', label: 'Gallery', icon: Camera, active: activeTab === 'gallery' },
            { id: 'analytics', label: 'Analytics', icon: BarChart3, active: activeTab === 'analytics' }
          ].map(({ id, label, icon: Icon, active }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex flex-col items-center py-2 px-1 transition-colors duration-200 ${active
                ? 'text-teal-600'
                : 'text-gray-400 hover:text-gray-600'
                }`}
            >
              <Icon className={`h-5 w-5 mb-1 ${active ? 'text-teal-600' : 'text-gray-400'}`} />
              <span className="text-xs font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Location Input Modal */}
      {selectedSalonId && (
        <LocationInputModal
          isOpen={isLocationModalOpen}
          onClose={() => setIsLocationModalOpen(false)}
          salonId={selectedSalonId}
          onSuccess={() => {
            setIsLocationModalOpen(false);
            setIsServiceDialogOpen(true);
            queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
          }}
        />
      )}
    </div>
  );
}