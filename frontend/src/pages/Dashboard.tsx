import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  Clock,
  Star,
  DollarSign,
  Plus,
  Percent,
  BarChart3,
  Settings,
  TrendingUp,
  UserCheck,
  UserX,
  PlayCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { queryClient } from "../lib/queryClient";
import { insertSalonSchema, insertServiceSchema, insertOfferSchema } from "../lib/schemas";
import type { QueueWithDetails, Analytics } from "../types";
import GalleryManager from "../components/GalleryManager";
import LocationPicker from "../components/LocationPicker";

const serviceFormSchema = insertServiceSchema.omit({ salonId: true });
const offerFormSchema = insertOfferSchema.omit({ salonId: true });
const salonFormSchema = insertSalonSchema.omit({ ownerId: true });

type ServiceForm = z.infer<typeof serviceFormSchema>;
type OfferForm = z.infer<typeof offerFormSchema>;
type SalonForm = z.infer<typeof salonFormSchema>;

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedSalonId, setSelectedSalonId] = useState<string>("");
  const [selectedLocation, setSelectedLocation] = useState<{
    latitude: number;
    longitude: number;
    address: string;
  } | null>(null);

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

  // Get queue data for selected salon
  const { data: queues = [], isLoading: queuesLoading } = useQuery<QueueWithDetails[]>({
    queryKey: ['/api/salons', selectedSalonId, 'queues'],
    enabled: !!selectedSalonId,
  });

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

  // Debug offers
  console.log('Offers state:', { offers, offersLoading, offersError, selectedSalonId });

  // Forms
  const salonForm = useForm<SalonForm>({
    resolver: zodResolver(salonFormSchema),
    defaultValues: {
      name: "",
      description: "",
      location: "", // Will be set by LocationPicker
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
      queryClient.invalidateQueries({ queryKey: ['/api/salons'] });
      serviceForm.reset();
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

    // Check if location is provided
    const locationAddress = selectedLocation?.address || data.location;
    if (!locationAddress?.trim()) {
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
      location: locationAddress.trim(),
      ownerId: user.id,
      latitude: selectedLocation?.latitude,
      longitude: selectedLocation?.longitude,
      fullAddress: selectedLocation?.address,
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

  const startService = (queueId: string) => {
    updateQueueMutation.mutate({
      id: queueId,
      updates: { status: 'in-progress' },
    });
  };

  const completeService = (queueId: string) => {
    updateQueueMutation.mutate({
      id: queueId,
      updates: { status: 'completed' },
    });
  };

  const markNoShow = (queueId: string) => {
    updateQueueMutation.mutate({
      id: queueId,
      updates: { status: 'no-show' },
    });
  };

  if (!user || user.role !== 'salon_owner') {
    return (
      <div className="min-h-screen gradient-pink flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6 text-center">
            <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-4">This dashboard is only available for salon owners.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (salonsLoading) {
    return (
      <div className="min-h-screen gradient-pink py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-2xl"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded-2xl"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-pink py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Salon Dashboard</h1>
            <p className="text-sm sm:text-base text-muted-foreground">Manage your salons and track performance</p>
          </div>

          {salons.length === 0 && (
            <Dialog>
              <DialogTrigger asChild>
                <Button data-testid="button-create-salon">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Salon
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-w-[95vw] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Salon</DialogTitle>
                  <DialogDescription>
                    Add your salon to SmartQ and start managing queues.
                  </DialogDescription>
                </DialogHeader>
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
                    className="space-y-3"
                  >
                    <FormField
                      control={salonForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salon Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter salon name" {...field} data-testid="input-salon-name" />
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
                          <FormLabel>Salon Type</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-salon-type">
                                <SelectValue placeholder="Select salon type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
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
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your salon..."
                              {...field}
                              value={field.value || ""}
                              data-testid="textarea-salon-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Location Picker */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
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
                      {/* Hidden field to satisfy form validation */}
                      <FormField
                        control={salonForm.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem className="hidden">
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Salon Photos <span className="text-red-500">*</span>
                      </label>
                      <div className={`border-2 border-dashed rounded-lg p-3 ${selectedImages.length === 0 ? 'border-red-300 bg-red-50' : 'border-green-300 bg-green-50'
                        }`}>
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            setSelectedImages(files);
                          }}
                          className="w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                          data-testid="input-salon-images"
                        />
                        <p className={`text-xs mt-1 ${selectedImages.length === 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {selectedImages.length === 0
                            ? "⚠️ Please select at least one photo to continue"
                            : `✅ ${selectedImages.length} photo${selectedImages.length !== 1 ? 's' : ''} selected`}
                        </p>
                        {selectedImages.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-foreground">
                              Selected: {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedImages.map((file, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={URL.createObjectURL(file)}
                                    alt={`Preview ${index + 1}`}
                                    className="w-12 h-12 object-cover rounded border"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedImages(prev => prev.filter((_, i) => i !== index));
                                    }}
                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Debug button - remove in production */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        console.log('🔍 DEBUG - Form State:');
                        console.log('Values:', salonForm.getValues());
                        console.log('Errors:', salonForm.formState.errors);
                        console.log('Is Valid:', salonForm.formState.isValid);
                        console.log('Selected Location:', selectedLocation);
                        console.log('Selected Images:', selectedImages.length);
                      }}
                    >
                      Debug Form State
                    </Button>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createSalonMutation.isPending || selectedImages.length === 0}
                      data-testid="button-submit-salon"
                    >
                      {createSalonMutation.isPending ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Creating Salon...
                        </div>
                      ) : selectedImages.length === 0 ? (
                        "Select at least 1 image to continue"
                      ) : (
                        "Create Salon"
                      )}
                    </Button>
                    {selectedImages.length === 0 && (
                      <p className="text-xs text-red-500 text-center mt-1">
                        ⚠️ Please select at least one salon photo to create your salon
                      </p>
                    )}
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {salons.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Settings className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">No salons found</h2>
              <p className="text-muted-foreground mb-6">
                Create your first salon to start managing queues and tracking analytics.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Salon Selector */}
            {salons.length > 1 && (
              <div className="mb-8">
                <div className="flex space-x-2 overflow-x-auto">
                  {salons.map((salon: any) => (
                    <Button
                      key={salon.id}
                      variant={selectedSalonId === salon.id ? "default" : "outline"}
                      onClick={() => setSelectedSalonId(salon.id)}
                      className="whitespace-nowrap"
                      data-testid={`button-salon-${salon.id}`}
                    >
                      {salon.name}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {selectedSalonId && (
              <>
                {/* Analytics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Customers Today</p>
                          <p className="text-2xl font-bold text-foreground" data-testid="text-customers-today">
                            {analyticsLoading ? "..." : analytics?.customersToday || 0}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Avg Wait Time</p>
                          <p className="text-2xl font-bold text-foreground" data-testid="text-avg-wait">
                            {analyticsLoading ? "..." : `${Math.round(analytics?.avgWaitTime || 0)}min`}
                          </p>
                        </div>
                        <Clock className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Rating</p>
                          <p className="text-2xl font-bold text-foreground" data-testid="text-rating">
                            {analyticsLoading ? "..." : analytics?.rating?.toFixed(1) || "0.0"}
                          </p>
                        </div>
                        <Star className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                          <p className="text-2xl font-bold text-foreground" data-testid="text-revenue">
                            {analyticsLoading ? "..." : `$${analytics?.revenue?.toFixed(2) || "0.00"}`}
                          </p>
                        </div>
                        <DollarSign className="h-8 w-8 text-primary" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Main Content */}
                <Tabs defaultValue="queue" className="space-y-6">
                  <TabsList className="grid w-full grid-cols-5">
                    <TabsTrigger value="queue" data-testid="tab-queue">Current Queue</TabsTrigger>
                    <TabsTrigger value="services" data-testid="tab-services">Services</TabsTrigger>
                    <TabsTrigger value="offers" data-testid="tab-offers">Offers</TabsTrigger>
                    <TabsTrigger value="gallery" data-testid="tab-gallery">Gallery</TabsTrigger>
                    <TabsTrigger value="analytics" data-testid="tab-analytics">Analytics</TabsTrigger>
                  </TabsList>

                  {/* Queue Management */}
                  <TabsContent value="queue" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>Current Queue</CardTitle>
                        <CardDescription>
                          Manage customer queue and service status
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {queuesLoading ? (
                          <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="h-20 bg-muted rounded-lg animate-pulse"></div>
                            ))}
                          </div>
                        ) : queues.length === 0 ? (
                          <div className="text-center py-8">
                            <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No customers in queue</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {queues
                              .filter(q => q.status === 'waiting' || q.status === 'in-progress')
                              .map((queue) => (
                                <div key={queue.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg" data-testid={`queue-item-${queue.id}`}>
                                  <div className="flex items-center space-x-4">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${queue.status === 'in-progress' ? 'bg-primary' : 'bg-muted border-2 border-dashed border-border text-muted-foreground'
                                      }`}>
                                      {queue.position}
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground" data-testid={`text-customer-name-${queue.id}`}>
                                        {queue.user?.name || 'Customer'}
                                      </p>
                                      <div className="text-sm text-muted-foreground" data-testid={`text-services-${queue.id}`}>
                                        {queue.services && Array.isArray(queue.services) && queue.services.length > 0 ? (
                                          <div>
                                            <p className="font-medium">Services:</p>
                                            <div className="mt-1">
                                              {queue.services.map((service) => (
                                                <p key={service.id} className="text-xs">
                                                  - {service.name} • {service.duration}min • ${service.price}
                                                </p>
                                              ))}
                                            </div>
                                            <p className="text-xs font-medium mt-1">Total: ${queue.totalPrice}</p>
                                          </div>
                                        ) : (
                                          <p>{queue.service?.name} • {queue.service?.duration}min • ${queue.service?.price}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge
                                      variant={queue.status === 'in-progress' ? 'default' : 'secondary'}
                                      data-testid={`badge-status-${queue.id}`}
                                    >
                                      {queue.status === 'waiting' ? 'Waiting' : 'In Progress'}
                                    </Badge>
                                    <div className="flex space-x-2">
                                      {queue.user && queue.user.phone && (
                                        <>
                                          <a
                                            href={`tel:${queue.user.phone}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              data-testid={`button-call-${queue.id}`}
                                            >
                                              <span role="img" aria-label="phone">📞</span> Call
                                            </Button>
                                          </a>
                                          <a
                                            href={`https://wa.me/${queue.user.phone.replace(/\D/g, '')}?text=Hello%20Your%20turn%20has%20come%20at%20SmartQ%20Salon`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              data-testid={`button-whatsapp-${queue.id}`}
                                            >
                                              <span role="img" aria-label="whatsapp">💬</span> WhatsApp
                                            </Button>
                                          </a>
                                        </>
                                      )}
                                      {queue.status === 'waiting' ? (
                                        <Button
                                          size="sm"
                                          onClick={() => startService(queue.id)}
                                          disabled={updateQueueMutation.isPending}
                                          data-testid={`button-start-${queue.id}`}
                                        >
                                          <PlayCircle className="h-4 w-4 mr-1" />
                                          Start
                                        </Button>
                                      ) : (
                                        <Button
                                          size="sm"
                                          onClick={() => completeService(queue.id)}
                                          disabled={updateQueueMutation.isPending}
                                          data-testid={`button-complete-${queue.id}`}
                                        >
                                          <UserCheck className="h-4 w-4 mr-1" />
                                          Complete
                                        </Button>
                                      )}
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => markNoShow(queue.id)}
                                        disabled={updateQueueMutation.isPending}
                                        data-testid={`button-no-show-${queue.id}`}
                                      >
                                        <UserX className="h-4 w-4 mr-1" />
                                        No Show
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Services Management */}
                  <TabsContent value="services" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Services</CardTitle>
                            <CardDescription>Manage your salon services</CardDescription>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button data-testid="button-add-service">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Service
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Add New Service</DialogTitle>
                                <DialogDescription>
                                  Create a new service for your salon.
                                </DialogDescription>
                              </DialogHeader>
                              <Form {...serviceForm}>
                                <form onSubmit={serviceForm.handleSubmit(onServiceSubmit)} className="space-y-4">
                                  <FormField
                                    control={serviceForm.control}
                                    name="name"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Service Name</FormLabel>
                                        <FormControl>
                                          <Input placeholder="e.g., Haircut" {...field} data-testid="input-service-name" />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={serviceForm.control}
                                      name="duration"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Duration (minutes)</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              {...field}
                                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                                              data-testid="input-service-duration"
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
                                          <FormLabel>Price ($)</FormLabel>
                                          <FormControl>
                                            <Input placeholder="0.00" {...field} data-testid="input-service-price" />
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
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            placeholder="Service description..."
                                            {...field}
                                            value={field.value || ""}
                                            data-testid="textarea-service-description"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={createServiceMutation.isPending}
                                    data-testid="button-submit-service"
                                  >
                                    {createServiceMutation.isPending ? "Adding..." : "Add Service"}
                                  </Button>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {salons.find((s: any) => s.id === selectedSalonId)?.services?.map((service: any) => (
                            <div key={service.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg" data-testid={`service-item-${service.id}`}>
                              <div>
                                <h4 className="font-semibold text-foreground" data-testid={`text-service-name-${service.id}`}>
                                  {service.name}
                                </h4>
                                <p className="text-sm text-muted-foreground" data-testid={`text-service-details-${service.id}`}>
                                  {service.duration} minutes • ${service.price}
                                </p>
                                {service.description && (
                                  <p className="text-sm text-muted-foreground mt-1" data-testid={`text-service-description-${service.id}`}>
                                    {service.description}
                                  </p>
                                )}
                              </div>
                              <Badge variant="secondary" data-testid={`badge-bookings-${service.id}`}>
                                {analytics?.popularServices?.find(s => s.id === service.id)?.bookings || 0} bookings
                              </Badge>
                            </div>
                          )) || (
                              <div className="text-center py-8">
                                <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground">No services added yet</p>
                              </div>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Offers Management */}
                  <TabsContent value="offers" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>Offers & Promotions</CardTitle>
                            <CardDescription>Create and manage special offers</CardDescription>
                          </div>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button data-testid="button-add-offer">
                                <Percent className="h-4 w-4 mr-2" />
                                Create Offer
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create New Offer</DialogTitle>
                                <DialogDescription>
                                  Create a promotional offer for your customers.
                                </DialogDescription>
                              </DialogHeader>
                              <Form {...offerForm}>
                                <form onSubmit={offerForm.handleSubmit(onOfferSubmit)} className="space-y-4">
                                  <FormField
                                    control={offerForm.control}
                                    name="title"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Offer Title</FormLabel>
                                        <FormControl>
                                          <Input placeholder="e.g., Summer Special" {...field} data-testid="input-offer-title" />
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
                                        <FormLabel>Description</FormLabel>
                                        <FormControl>
                                          <Textarea
                                            placeholder="Describe your offer..."
                                            {...field}
                                            data-testid="textarea-offer-description"
                                          />
                                        </FormControl>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={offerForm.control}
                                      name="discount"
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel>Discount (%)</FormLabel>
                                          <FormControl>
                                            <Input
                                              type="number"
                                              min="1"
                                              max="99"
                                              step="0.01"
                                              placeholder="10.00"
                                              {...field}
                                              onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                              data-testid="input-offer-discount"
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
                                          <FormLabel>Valid Until</FormLabel>
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
                                            />
                                          </FormControl>
                                          <FormMessage />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={createOfferMutation.isPending}
                                    data-testid="button-submit-offer"
                                  >
                                    {createOfferMutation.isPending ? "Creating..." : "Create Offer"}
                                  </Button>
                                </form>
                              </Form>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {offersLoading ? (
                          <div className="space-y-4">
                            {[...Array(2)].map((_, i) => (
                              <div key={i} className="h-24 bg-muted rounded animate-pulse"></div>
                            ))}
                          </div>
                        ) : offers.length > 0 ? (
                          <div className="space-y-4">
                            {offers.map((offer: any) => (
                              <div key={offer.id} className="bg-card border rounded-lg p-4 shadow-sm">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-semibold text-lg">{offer.title}</h3>
                                    <p className="text-muted-foreground text-sm mt-1">{offer.description}</p>
                                    <div className="flex items-center mt-2 space-x-4">
                                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                                        {offer.discount}% OFF
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">
                                        Valid until {new Date(offer.validityPeriod).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <Badge variant={offer.isActive ? "success" : "secondary"}>
                                      {offer.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => updateOfferMutation.mutate({
                                        id: offer.id,
                                        updates: { isActive: !offer.isActive }
                                      })}
                                      disabled={updateOfferMutation.isPending}
                                    >
                                      {offer.isActive ? "Deactivate" : "Activate"}
                                    </Button>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() => {
                                        if (confirm("Are you sure you want to delete this offer?")) {
                                          deleteOfferMutation.mutate(offer.id);
                                        }
                                      }}
                                      disabled={deleteOfferMutation.isPending}
                                    >
                                      Delete
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <Percent className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No active offers</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Gallery Management */}
                  <TabsContent value="gallery" className="space-y-6">
                    <GalleryManager salonId={selectedSalonId} />
                  </TabsContent>

                  {/* Analytics */}
                  <TabsContent value="analytics" className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <TrendingUp className="h-5 w-5" />
                            <span>Performance Metrics</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Show-up Rate</span>
                              <span className="font-semibold text-foreground" data-testid="text-show-rate">
                                {analyticsLoading ? "..." : `${Math.round(analytics?.showRate || 0)}%`}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Total Customers</span>
                              <span className="font-semibold text-foreground" data-testid="text-total-customers">
                                {analyticsLoading ? "..." : analytics?.totalCustomers || 0}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Average Rating</span>
                              <span className="font-semibold text-foreground" data-testid="text-average-rating">
                                {analyticsLoading ? "..." : analytics?.rating?.toFixed(1) || "0.0"}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                            <BarChart3 className="h-5 w-5" />
                            <span>Popular Services</span>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {analyticsLoading ? (
                              [...Array(3)].map((_, i) => (
                                <div key={i} className="h-12 bg-muted rounded animate-pulse"></div>
                              ))
                            ) : analytics?.popularServices?.length ? (
                              analytics.popularServices.slice(0, 5).map((service) => (
                                <div key={service.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg" data-testid={`popular-service-${service.id}`}>
                                  <span className="font-medium text-foreground" data-testid={`text-popular-service-name-${service.id}`}>
                                    {service.name}
                                  </span>
                                  <Badge variant="secondary" data-testid={`badge-popular-service-bookings-${service.id}`}>
                                    {service.bookings} bookings
                                  </Badge>
                                </div>
                              ))
                            ) : (
                              <p className="text-muted-foreground text-center py-4">No service data available</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
