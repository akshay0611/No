import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Camera,
    Edit3,
    Save,
    X,
    Heart,
    Clock,
    Star,
    Calendar,
    Award,
    TrendingUp,
    CheckCircle,
    Sparkles,
    Crown,
    UserCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getUserCategory, setUserCategory, type UserCategory } from "../utils/categoryUtils";
import ImageCropModal from "../components/ImageCropModal";

export default function Profile() {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const [selectedCategory, setSelectedCategory] = useState<UserCategory>(getUserCategory() || 'unisex');
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [showCropModal, setShowCropModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        location: user?.location || "",
        bio: user?.bio || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    });



    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async () => {
        try {
            // Update profile via API with all fields
            const token = localStorage.getItem('smartq_token');

            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app'}/api/user/complete`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email || undefined,
                    location: formData.location || undefined,
                    bio: formData.bio || undefined
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }

            const data = await response.json();

            // Save category preference
            setUserCategory(selectedCategory);

            // Update user context with new data
            if (user) {
                const updatedUser = {
                    ...user,
                    name: formData.name,
                    email: formData.email || user.email,
                    location: formData.location,
                    bio: formData.bio,
                } as any;
                updateUser(updatedUser);
            }

            toast({
                title: "Profile updated successfully!",
                description: "Your changes have been saved.",
            });

            setIsEditing(false);
        } catch (error: any) {
            toast({
                title: "Error updating profile",
                description: error.message || "Failed to update profile. Please try again.",
                variant: "destructive",
            });
        }
    };

    const handleCancel = () => {
        setFormData({
            name: user?.name || "",
            email: user?.email || "",
            phone: user?.phone || "",
            location: user?.location || "",
            bio: user?.bio || "",
            currentPassword: "",
            newPassword: "",
            confirmPassword: ""
        });
        setSelectedCategory(getUserCategory() || 'unisex');
        setIsEditing(false);
    };

    // Fetch user activity data
    const fetchActivityData = async () => {
        try {
            const { api } = await import("../lib/api");

            // Fetch queue history
            const queues = await api.queue.getMy();

            // Calculate stats
            const totalQueues = queues.length;
            const completedQueues = queues.filter((q: any) => q.status === 'completed');
            const favoritesCount = user?.favoriteSalons?.length || 0;

            // Get member since year
            const memberSince = user?.createdAt
                ? new Date(user.createdAt).getFullYear().toString()
                : new Date().getFullYear().toString();

            // Update stats
            setUserStats([
                { label: "Queues Joined", value: totalQueues.toString(), icon: Clock, color: "purple" },
                { label: "Favorite Salons", value: favoritesCount.toString(), icon: Heart, color: "pink" },
                { label: "Completed", value: completedQueues.length.toString(), icon: CheckCircle, color: "green" },
                { label: "Member Since", value: memberSince, icon: Calendar, color: "blue" }
            ]);

            // Format activity from completed/no-show queues only
            const activities = queues
                .filter((q: any) => q.status === 'completed' || q.status === 'no-show')
                .sort((a: any, b: any) => new Date(b.timestamp || b.createdAt).getTime() - new Date(a.timestamp || a.createdAt).getTime())
                .map((queue: any) => {
                    const timeAgo = getTimeAgo(new Date(queue.timestamp || queue.createdAt));
                    const salonName = queue.salon?.name || "Unknown Salon";
                    const serviceName = queue.services && queue.services.length > 0
                        ? (queue.services.length > 1 ? `${queue.services.length} services` : queue.services[0].name)
                        : queue.service?.name || 'Service';

                    return {
                        type: "queue",
                        title: `${salonName} - ${serviceName}`,
                        time: timeAgo,
                        date: new Date(queue.timestamp || queue.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
                        status: queue.status,
                        loyaltyPoints: queue.status === 'completed' ? 25 : 0,
                        totalPrice: queue.totalPrice,
                        icon: queue.status === 'completed' ? CheckCircle : Clock,
                        salonId: queue.salonId
                    };
                });

            setRecentActivity(activities);

            // Update achievements based on loyalty points
            const salonLoyaltyPoints = user?.salonLoyaltyPoints || {};
            const maxSalonPoints = Math.max(...Object.values(salonLoyaltyPoints), 0);

            setAchievements([
                {
                    title: "Early Adopter",
                    description: "One of the first 1000 users",
                    icon: Crown,
                    earned: true,
                    color: "from-yellow-400 to-orange-500"
                },
                {
                    title: "Queue Master",
                    description: "Joined 50+ queues",
                    icon: Award,
                    earned: totalQueues >= 50,
                    color: "from-purple-400 to-indigo-500",
                    progress: Math.min((totalQueues / 50) * 100, 100)
                },
                {
                    title: "Loyal Customer",
                    description: "Earn 50 points at any salon",
                    icon: Star,
                    earned: maxSalonPoints >= 50,
                    color: "from-blue-400 to-cyan-500",
                    progress: Math.min((maxSalonPoints / 50) * 100, 100)
                },
                {
                    title: "VIP Member",
                    description: "Earn 100 points at any salon",
                    icon: Crown,
                    earned: maxSalonPoints >= 100,
                    color: "from-pink-400 to-rose-500",
                    progress: Math.min((maxSalonPoints / 100) * 100, 100)
                }
            ]);
        } catch (error) {
            console.error('Error fetching activity data:', error);
        }
    };

    // Helper function to calculate time ago
    const getTimeAgo = (date: Date) => {
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        const diffWeeks = Math.floor(diffMs / 604800000);

        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    // Fetch activity data on component mount
    React.useEffect(() => {
        if (user) {
            fetchActivityData();
        }
    }, [user]);

    // Handle profile image selection
    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                title: "Invalid file type",
                description: "Please upload an image file",
                variant: "destructive",
            });
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                title: "File too large",
                description: "Please upload an image smaller than 5MB",
                variant: "destructive",
            });
            return;
        }

        // Read file and show crop modal
        const reader = new FileReader();
        reader.onload = () => {
            setSelectedImage(reader.result as string);
            setShowCropModal(true);
        };
        reader.readAsDataURL(file);

        // Reset input
        event.target.value = '';
    };

    // Handle cropped image upload
    const handleCroppedImage = async (croppedBlob: Blob) => {
        setShowCropModal(false);
        setIsUploadingImage(true);

        try {
            const token = localStorage.getItem('smartq_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            // Create form data with cropped image
            const formData = new FormData();
            formData.append('image', croppedBlob, 'profile.jpg');

            // Upload to backend
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app'}/api/user/profile-image`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to upload image');
            }

            const data = await response.json();

            // Update user context with new profile image
            if (user) {
                const updatedUser = {
                    ...user,
                    profileImage: data.profileImage,
                } as any;
                updateUser(updatedUser);
            }

            toast({
                title: "Profile picture updated!",
                description: "Your profile picture has been updated successfully.",
            });
        } catch (error: any) {
            toast({
                title: "Upload failed",
                description: error.message || "Failed to upload profile picture",
                variant: "destructive",
            });
        } finally {
            setIsUploadingImage(false);
            setSelectedImage(null);
        }
    };

    const [userStats, setUserStats] = useState([
        { label: "Queues Joined", value: "0", icon: Clock, color: "purple" },
        { label: "Favorite Salons", value: "0", icon: Heart, color: "pink" },
        { label: "Reviews Written", value: "0", icon: Star, color: "yellow" },
        { label: "Member Since", value: "2024", icon: Calendar, color: "blue" }
    ]);

    const [recentActivity, setRecentActivity] = useState<Array<{
        type: string;
        title: string;
        time: string;
        date?: string;
        status: string;
        loyaltyPoints?: number;
        totalPrice?: number;
        icon: any;
        salonId?: string;
    }>>([]);

    const [achievements, setAchievements] = useState([
        {
            title: "Early Adopter",
            description: "One of the first 1000 users",
            icon: Crown,
            earned: true,
            color: "from-yellow-400 to-orange-500"
        },
        {
            title: "Queue Master",
            description: "Joined 50+ queues",
            icon: Award,
            earned: false,
            color: "from-purple-400 to-indigo-500",
            progress: 0
        },
        {
            title: "Loyal Customer",
            description: "Earn 50 points at any salon",
            icon: Star,
            earned: false,
            color: "from-blue-400 to-cyan-500",
            progress: 0
        },
        {
            title: "VIP Member",
            description: "Earn 100 points at any salon",
            icon: Crown,
            earned: false,
            color: "from-pink-400 to-rose-500",
            progress: 0
        }
    ]);

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "activity", label: "Activity", icon: TrendingUp },
        { id: "achievements", label: "Achievements", icon: Award }
    ];

    return (
        <>
            {/* Image Crop Modal */}
            {showCropModal && selectedImage && (
                <ImageCropModal
                    image={selectedImage}
                    onCropComplete={handleCroppedImage}
                    onClose={() => {
                        setShowCropModal(false);
                        setSelectedImage(null);
                    }}
                />
            )}

            <div className="min-h-screen bg-gray-50 relative overflow-hidden">
                {/* Animated Background Elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="relative max-w-7xl mx-auto px-6 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 sm:pb-8">
                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <div className="flex-1 min-w-0">
                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                                    My Profile
                                </h1>
                                <p className="text-base sm:text-xl text-gray-600 mt-2">
                                    Manage your account and preferences
                                </p>
                            </div>
                            <Badge className="bg-gradient-to-r from-teal-100 to-teal-200 text-teal-700 border-0 px-3 py-1.5 sm:px-4 sm:py-2 self-start sm:self-auto whitespace-nowrap">
                                <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                Premium Member
                            </Badge>
                        </div>

                        {/* Tab Navigation */}
                        <div className="flex overflow-x-auto space-x-1 bg-white/80 backdrop-blur-sm p-1 rounded-2xl shadow-lg scrollbar-hide">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-teal-600 to-teal-700 text-white shadow-lg'
                                        : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4 mr-1.5 sm:mr-2" />
                                    <span className="text-sm sm:text-base">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Profile Tab */}
                    {activeTab === "profile" && (
                        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
                            {/* Profile Card */}
                            <div className="lg:col-span-1">
                                <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden mx-1">
                                    <div className="relative">
                                        <div className="h-32 bg-gradient-to-r from-teal-600 to-teal-700"></div>
                                        <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                                            <div className="relative group">
                                                <div className="w-32 h-32 bg-white rounded-full p-2 shadow-xl">
                                                    {isUploadingImage ? (
                                                        <div className="w-full h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center">
                                                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                                                        </div>
                                                    ) : user?.profileImage ? (
                                                        <img
                                                            src={user.profileImage}
                                                            alt="Profile"
                                                            className="w-full h-full rounded-full object-contain bg-white"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center">
                                                            <User className="w-12 h-12 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <input
                                                    type="file"
                                                    id="profile-image-upload"
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="hidden"
                                                    disabled={isUploadingImage}
                                                />
                                                <label
                                                    htmlFor="profile-image-upload"
                                                    className={`absolute bottom-2 right-2 w-10 h-10 bg-teal-600 hover:bg-teal-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors group-hover:scale-110 transform duration-300 ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                >
                                                    <Camera className="w-4 h-4" />
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <CardContent className="pt-20 pb-6 sm:pb-8 text-center px-4">
                                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 break-words">
                                            {user?.name || "User Name"}
                                        </h2>
                                        <p className="text-sm sm:text-base text-gray-600 mb-4 break-all">
                                            {user?.phone || "phone-"}
                                        </p>
                                        <p className="text-xs sm:text-sm text-gray-500 break-all">
                                            {user?.email || "+919508212112@placeholder.com"}
                                        </p>

                                        {/* User Stats */}
                                        <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-6">
                                            {userStats.map((stat, index) => (
                                                <div key={index} className="text-center">
                                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 rounded-xl bg-gradient-to-r ${stat.color === 'purple' ? 'from-teal-500 to-teal-600' :
                                                        stat.color === 'pink' ? 'from-pink-500 to-pink-600' :
                                                            stat.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
                                                                'from-teal-500 to-teal-600'
                                                        } flex items-center justify-center`}>
                                                        <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                                                    </div>
                                                    <div className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</div>
                                                    <div className="text-xs sm:text-sm text-gray-500">{stat.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Profile Form */}
                            <div className="lg:col-span-2">
                                <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl mx-1">
                                    <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                                        <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900">
                                            Profile Information
                                        </CardTitle>
                                        {!isEditing ? (
                                            <Button
                                                onClick={() => setIsEditing(true)}
                                                className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 w-full sm:w-auto"
                                            >
                                                <Edit3 className="w-4 h-4 mr-2" />
                                                Edit Profile
                                            </Button>
                                        ) : (
                                            <div className="flex space-x-2">
                                                <Button
                                                    onClick={handleSave}
                                                    className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 flex-1 sm:flex-none"
                                                >
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Save
                                                </Button>
                                                <Button
                                                    onClick={handleCancel}
                                                    variant="outline"
                                                    className="border-gray-300 flex-1 sm:flex-none"
                                                >
                                                    <X className="w-4 h-4 mr-2" />
                                                    Cancel
                                                </Button>
                                            </div>
                                        )}
                                    </CardHeader>

                                    <CardContent className="space-y-4 sm:space-y-6">
                                        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                    Full Name
                                                </label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                    <Input
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleInputChange}
                                                        disabled={!isEditing}
                                                        className="pl-12 h-12 border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                                                        placeholder="Enter your full name"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                    Email Address
                                                </label>
                                                <div className="relative">
                                                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                    <Input
                                                        name="email"
                                                        type="email"
                                                        value={formData.email}
                                                        onChange={handleInputChange}
                                                        disabled={!isEditing}
                                                        className="pl-12 h-12 border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                                                        placeholder="Enter your email"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                    Phone Number
                                                </label>
                                                <div className="relative">
                                                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                    <Input
                                                        name="phone"
                                                        value={formData.phone}
                                                        onChange={handleInputChange}
                                                        disabled={!isEditing}
                                                        className="pl-12 h-12 border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                                                        placeholder="Enter your phone number"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                    Location
                                                </label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                    <Input
                                                        name="location"
                                                        value={formData.location}
                                                        onChange={handleInputChange}
                                                        disabled={!isEditing}
                                                        className="pl-12 h-12 border-2 border-gray-200 focus:border-teal-500 rounded-xl"
                                                        placeholder="Enter your location"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                Preferred Salon Category
                                            </label>
                                            <div className="relative">
                                                <UserCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                                                <Select
                                                    value={selectedCategory}
                                                    onValueChange={(value: UserCategory) => setSelectedCategory(value)}
                                                    disabled={!isEditing}
                                                >
                                                    <SelectTrigger className="pl-12 h-12 border-2 border-gray-200 focus:border-teal-500 rounded-xl bg-white">
                                                        <SelectValue placeholder="Select your preferred category" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="men">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                                                                <span>Men's Salons</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="women">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                                                                <span>Women's Salons</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="unisex">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                                                                <span>Unisex Salons</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">
                                                This will personalize your home page to show relevant salons
                                            </p>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                                                Bio
                                            </label>
                                            <Textarea
                                                name="bio"
                                                value={formData.bio}
                                                onChange={handleInputChange}
                                                disabled={!isEditing}
                                                rows={4}
                                                className="border-2 border-gray-200 focus:border-teal-500 rounded-xl resize-none"
                                                placeholder="Tell us about yourself..."
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    )}

                    {/* Activity Tab */}
                    {activeTab === "activity" && (
                        <div className="space-y-6 sm:space-y-8">
                            <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl mx-1">
                                <CardHeader>
                                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                                        <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-teal-600" />
                                        Recent Activity
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {recentActivity.length === 0 ? (
                                        <div className="text-center py-12">
                                            <Clock className="w-12 h-12 sm:w-16 sm:h-16 mx-auto text-gray-300 mb-4" />
                                            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">No Activity Yet</h3>
                                            <p className="text-sm sm:text-base text-gray-500">
                                                Complete services to see your history here
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {recentActivity.map((activity, index) => (
                                                <div key={index} className="bg-white rounded-xl p-4 shadow-sm border-2 border-gray-100 hover:border-teal-200 transition-all">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-semibold text-gray-900 text-sm mb-1 truncate">
                                                                {activity.title}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 mb-2">
                                                                {activity.date}
                                                            </p>
                                                            {activity.totalPrice && (
                                                                <p className="text-sm text-gray-700 font-medium">
                                                                    ₹{activity.totalPrice}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end gap-2">
                                                            <Badge
                                                                variant={activity.status === 'completed' ? 'default' : 'destructive'}
                                                                className={`text-xs ${activity.status === 'completed' ? 'bg-green-100 text-green-700 hover:bg-green-100' : 'bg-red-100 text-red-700 hover:bg-red-100'}`}
                                                            >
                                                                {activity.status === 'completed' ? 'Completed' : 'No Show'}
                                                            </Badge>
                                                            {activity.status === 'completed' && activity.loyaltyPoints && activity.loyaltyPoints > 0 && (
                                                                <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-full">
                                                                    <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                                                                    <span className="text-xs font-semibold text-amber-700">
                                                                        +{activity.loyaltyPoints || 0} pts
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Achievements Tab */}
                    {activeTab === "achievements" && (
                        <div className="space-y-6 sm:space-y-8">
                            <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl mx-1">
                                <CardHeader>
                                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                                        <Award className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-teal-600" />
                                        Achievements
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
                                        {achievements.map((achievement, index) => (
                                            <div key={index} className={`relative p-4 sm:p-6 rounded-2xl border-2 transition-all duration-300 ${achievement.earned
                                                ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50'
                                                : 'border-gray-200 bg-gray-50 hover:border-purple-300'
                                                }`}>
                                                <div className="flex items-start space-x-3 sm:space-x-4">
                                                    <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r ${achievement.color} flex items-center justify-center flex-shrink-0 ${!achievement.earned ? 'opacity-50' : ''
                                                        }`}>
                                                        <achievement.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-2">
                                                            <h3 className="font-bold text-base sm:text-lg text-gray-900">{achievement.title}</h3>
                                                            {achievement.earned && (
                                                                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                                                            )}
                                                        </div>
                                                        <p className="text-sm sm:text-base text-gray-600 mb-3">{achievement.description}</p>
                                                        {!achievement.earned && achievement.progress && (
                                                            <div>
                                                                <div className="flex justify-between text-xs sm:text-sm text-gray-500 mb-1">
                                                                    <span>Progress</span>
                                                                    <span>{achievement.progress}%</span>
                                                                </div>
                                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                                    <div
                                                                        className="bg-gradient-to-r from-teal-500 to-teal-600 h-2 rounded-full transition-all duration-500"
                                                                        style={{ width: `${achievement.progress}%` }}
                                                                    ></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Salon Loyalty Points */}
                            <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl mx-1">
                                <CardHeader>
                                    <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                                        <Star className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-amber-500 fill-amber-500" />
                                        Salon Loyalty Points
                                    </CardTitle>
                                    <p className="text-sm text-gray-600 mt-2">
                                        Earn 25 points for each completed service. Reach 50 points for 10% off, 100 points for 20% off!
                                    </p>
                                </CardHeader>
                                <CardContent>
                                    {user?.salonLoyaltyPoints && Object.keys(user.salonLoyaltyPoints).length > 0 ? (
                                        <div className="space-y-4">
                                            {Object.entries(user.salonLoyaltyPoints)
                                                .sort(([, a], [, b]) => b - a)
                                                .map(([salonId, points]) => {
                                                    const discount = points >= 100 ? 20 : points >= 50 ? 10 : 0;
                                                    const nextMilestone = points >= 100 ? null : points >= 50 ? 100 : 50;
                                                    const progress = nextMilestone ? (points / nextMilestone) * 100 : 100;

                                                    return (
                                                        <div key={salonId} className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-200">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <div className="flex-1">
                                                                    <h4 className="font-bold text-gray-900 text-sm mb-1">
                                                                        Salon ID: {salonId.slice(0, 8)}...
                                                                    </h4>
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="flex items-center gap-1">
                                                                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                                                            <span className="text-lg font-bold text-amber-700">
                                                                                {points} points
                                                                            </span>
                                                                        </div>
                                                                        {discount > 0 && (
                                                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                                                                                {discount}% OFF
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            {nextMilestone && (
                                                                <div>
                                                                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                                                                        <span>Next reward at {nextMilestone} points</span>
                                                                        <span>{nextMilestone - points} more needed</span>
                                                                    </div>
                                                                    <div className="w-full bg-amber-200 rounded-full h-2">
                                                                        <div
                                                                            className="bg-gradient-to-r from-amber-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                                                                            style={{ width: `${progress}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Star className="w-10 h-10 text-amber-500" />
                                            </div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Loyalty Points Yet</h3>
                                            <p className="text-gray-600">
                                                Complete services at salons to start earning loyalty points and unlock discounts!
                                            </p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    )}


                </div>
            </div>
        </>
    );
}