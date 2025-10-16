import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Trash2, ImageIcon, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "../lib/queryClient";

interface SalonPhoto {
  id: string;
  salonId: string;
  url: string;
  publicId: string;
  category?: string;
  createdAt: string;
}

interface GalleryManagerProps {
  salonId: string;
}

const PHOTO_CATEGORIES = ['interior', 'services', 'exterior'] as const;
type PhotoCategory = typeof PHOTO_CATEGORIES[number];

export default function GalleryManager({ salonId }: GalleryManagerProps) {
  const { toast } = useToast();
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<PhotoCategory>('interior');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // Fetch salon photos
  const { data: photos = [], isLoading: photosLoading } = useQuery<SalonPhoto[]>({
    queryKey: ['salon-photos', salonId],
    queryFn: async () => {
      const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
      const response = await fetch(`${baseURL}/api/salons/${salonId}/photos`);
      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }
      return response.json();
    },
    enabled: !!salonId,
  });

  // Upload photos mutation
  const uploadPhotosMutation = useMutation({
    mutationFn: async ({ files, category }: { files: File[], category: PhotoCategory }) => {
      const token = localStorage.getItem('smartq_token');
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('category', category);
        
        const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
        const response = await fetch(`${baseURL}/api/salons/${salonId}/photos`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        return response.json();
      });
      
      return Promise.all(uploadPromises);
    },
    onSuccess: () => {
      toast({
        title: "Photos uploaded successfully!",
        description: "Your new photos have been added to the gallery.",
      });
      queryClient.invalidateQueries({ queryKey: ['salon-photos', salonId] });
      setSelectedImages([]);
      setIsUploadDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Failed to upload photos",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete photo mutation
  const deletePhotoMutation = useMutation({
    mutationFn: async (photoId: string) => {
      const token = localStorage.getItem('smartq_token');
      const baseURL = import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app';
      const response = await fetch(`${baseURL}/api/salons/${salonId}/photos/${photoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete photo');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Photo deleted successfully!",
        description: "The photo has been removed from your gallery.",
      });
      queryClient.invalidateQueries({ queryKey: ['salon-photos', salonId] });
    },
    onError: (error) => {
      toast({
        title: "Failed to delete photo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpload = () => {
    if (selectedImages.length > 0) {
      uploadPhotosMutation.mutate({ files: selectedImages, category: selectedCategory });
    }
  };

  const handleDelete = (photoId: string) => {
    if (photos.length <= 1) {
      toast({
        title: "Cannot delete photo",
        description: "At least one photo is required for your salon.",
        variant: "destructive",
      });
      return;
    }

    if (confirm("Are you sure you want to delete this photo?")) {
      deletePhotoMutation.mutate(photoId);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0">
            <CardTitle className="flex items-center space-x-2">
              <ImageIcon className="h-5 w-5" />
              <span>Photo Gallery</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm break-words">
              Upload photos in categories: Interior, Services & Exterior
            </CardDescription>
          </div>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto flex-shrink-0">
                <Plus className="h-4 w-4 mr-2" />
                Add Photos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Photos</DialogTitle>
                <DialogDescription>
                  Add more photos to showcase your salon
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Category Selection */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Photo Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {PHOTO_CATEGORIES.map((category) => (
                      <button
                        key={category}
                        type="button"
                        onClick={() => setSelectedCategory(category)}
                        className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                          selectedCategory === category
                            ? 'border-primary bg-primary/10 text-primary font-medium'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setSelectedImages(files);
                    }}
                    className="w-full"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Select one or more photos to upload
                  </p>
                  {selectedImages.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm font-medium text-foreground">
                        Selected: {selectedImages.length} image{selectedImages.length !== 1 ? 's' : ''}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedImages.map((file, index) => (
                          <div key={index} className="relative">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Preview ${index + 1}`}
                              className="w-16 h-16 object-cover rounded border"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedImages(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleUpload}
                    disabled={selectedImages.length === 0 || uploadPhotosMutation.isPending}
                    className="flex-1"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadPhotosMutation.isPending ? "Uploading..." : "Upload Photos"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedImages([]);
                      setIsUploadDialogOpen(false);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {photosLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : photos.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-2xl mx-auto mb-4 flex items-center justify-center">
              <ImageIcon className="h-10 w-10 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Photos Yet</h3>
            <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
              Start by uploading photos in different categories to showcase your salon to customers
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-2 rounded-lg">
              <span className="font-medium">💡 Tip:</span>
              <span>Upload at least one photo in each category for best results</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {PHOTO_CATEGORIES.map((category) => {
              const categoryPhotos = photos.filter(p => p.category === category);
              if (categoryPhotos.length === 0) return null;
              
              return (
                <div key={category}>
                  <h3 className="text-lg font-semibold capitalize mb-3 text-foreground">
                    {category} ({categoryPhotos.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {categoryPhotos.map((photo) => (
                      <div key={photo.id} className="relative group">
                        <img
                          src={photo.url}
                          alt={`${category} photo`}
                          className="w-full aspect-square object-cover rounded-lg border"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <Button
                            size="sm"
                            variant="destructive"
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            onClick={() => handleDelete(photo.id)}
                            disabled={deletePhotoMutation.isPending || photos.length <= 1}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        {photos.length <= 1 && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                              Required
                            </span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {/* Banner/Cover Images (uncategorized photos) */}
            {photos.filter(p => !p.category || !PHOTO_CATEGORIES.includes(p.category as PhotoCategory)).length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  Banner Image ({photos.filter(p => !p.category || !PHOTO_CATEGORIES.includes(p.category as PhotoCategory)).length})
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  Main cover image displayed on salon listings and search results
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {photos.filter(p => !p.category || !PHOTO_CATEGORIES.includes(p.category as PhotoCategory)).map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.url}
                        alt="Banner image"
                        className="w-full aspect-square object-cover rounded-lg border"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                        <Button
                          size="sm"
                          variant="destructive"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onClick={() => handleDelete(photo.id)}
                          disabled={deletePhotoMutation.isPending || photos.length <= 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
