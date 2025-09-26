import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
    User,
    Mail,
    Phone,
    MapPin,
    Camera,
    Edit3,
    Save,
    X,
    Bell,
    Shield,
    Heart,
    Clock,
    Star,
    Settings,
    Smartphone,
    Globe,
    Lock,
    Eye,
    EyeOff,
    Calendar,
    Award,
    TrendingUp,
    Users,
    CheckCircle,
    AlertCircle,
    Sparkles,
    Crown,
    Gift,
    Zap
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Profile() {
    const { user, updateUser } = useAuth();
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");

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

    const [notifications, setNotifications] = useState({
        queueUpdates: true,
        promotions: false,
        reminders: true,
        newsletter: false
    });

    const [privacy, setPrivacy] = useState({
        profileVisible: true,
        showLocation: false,
        showPhone: false,
        allowMessages: true
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = async () => {
        try {
            // Import API dynamically to avoid circular dependencies
            const { api } = await import("../lib/api");
            
            // Update profile via API
            await api.auth.completeProfile(formData.name, formData.email || undefined);
            
            // Update user context with new data
            if (user) {
                const updatedUser = {
                    ...user,
                    name: formData.name,
                    email: formData.email || user.email,
                };
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
        setIsEditing(false);
    };

    const userStats = [
        { label: "Queues Joined", value: "47", icon: Clock, color: "purple" },
        { label: "Favorite Salons", value: "12", icon: Heart, color: "pink" },
        { label: "Reviews Written", value: "23", icon: Star, color: "yellow" },
        { label: "Member Since", value: "2024", icon: Calendar, color: "blue" }
    ];

    const recentActivity = [
        {
            type: "queue",
            title: "Joined queue at Glamour Studio",
            time: "2 hours ago",
            status: "completed",
            icon: Clock
        },
        {
            type: "review",
            title: "Reviewed Hair & Beauty Lounge",
            time: "1 day ago",
            status: "completed",
            icon: Star
        },
        {
            type: "favorite",
            title: "Added Trendy Cuts to favorites",
            time: "3 days ago",
            status: "completed",
            icon: Heart
        },
        {
            type: "queue",
            title: "Joined queue at Style Central",
            time: "1 week ago",
            status: "cancelled",
            icon: Clock
        }
    ];

    const achievements = [
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
            progress: 94
        },
        {
            title: "Review Expert",
            description: "Written 25+ helpful reviews",
            icon: Star,
            earned: false,
            color: "from-blue-400 to-cyan-500",
            progress: 92
        },
        {
            title: "Social Butterfly",
            description: "Referred 10+ friends",
            icon: Users,
            earned: false,
            color: "from-pink-400 to-rose-500",
            progress: 30
        }
    ];

    const tabs = [
        { id: "profile", label: "Profile", icon: User },
        { id: "activity", label: "Activity", icon: TrendingUp },
        { id: "achievements", label: "Achievements", icon: Award },
        { id: "settings", label: "Settings", icon: Settings }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 bg-clip-text text-transparent">
                                My Profile
                            </h1>
                            <p className="text-xl text-gray-600 mt-2">
                                Manage your account and preferences
                            </p>
                        </div>
                        <Badge className="bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-700 border-0 px-4 py-2">
                            <Sparkles className="w-4 h-4 mr-2" />
                            Premium Member
                        </Badge>
                    </div>

                    {/* Tab Navigation */}
                    <div className="flex space-x-1 bg-white/80 backdrop-blur-sm p-1 rounded-2xl shadow-lg">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all duration-300 ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                                        : 'text-gray-600 hover:text-purple-600 hover:bg-purple-50'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4 mr-2" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Profile Tab */}
                {activeTab === "profile" && (
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Profile Card */}
                        <div className="lg:col-span-1">
                            <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl overflow-hidden">
                                <div className="relative">
                                    <div className="h-32 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600"></div>
                                    <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2">
                                        <div className="relative group">
                                            <div className="w-32 h-32 bg-white rounded-full p-2 shadow-xl">
                                                {user?.profileImage ? (
                                                    <img
                                                        src={user.profileImage}
                                                        alt="Profile"
                                                        className="w-full h-full rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center">
                                                        <User className="w-12 h-12 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <button className="absolute bottom-2 right-2 w-10 h-10 bg-purple-600 hover:bg-purple-700 rounded-full flex items-center justify-center text-white shadow-lg transition-colors group-hover:scale-110 transform duration-300">
                                                <Camera className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <CardContent className="pt-20 pb-8 text-center">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                                        {user?.name || "User Name"}
                                    </h2>
                                    <p className="text-gray-600 mb-4">
                                        {user?.email || "user@example.com"}
                                    </p>

                                    {/* User Stats */}
                                    <div className="grid grid-cols-2 gap-4 mt-6">
                                        {userStats.map((stat, index) => (
                                            <div key={index} className="text-center">
                                                <div className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-r ${stat.color === 'purple' ? 'from-purple-500 to-purple-600' :
                                                        stat.color === 'pink' ? 'from-pink-500 to-pink-600' :
                                                            stat.color === 'yellow' ? 'from-yellow-500 to-yellow-600' :
                                                                'from-blue-500 to-blue-600'
                                                    } flex items-center justify-center`}>
                                                    <stat.icon className="w-6 h-6 text-white" />
                                                </div>
                                                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                                                <div className="text-sm text-gray-500">{stat.label}</div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Profile Form */}
                        <div className="lg:col-span-2">
                            <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-2xl font-bold text-gray-900">
                                        Profile Information
                                    </CardTitle>
                                    {!isEditing ? (
                                        <Button
                                            onClick={() => setIsEditing(true)}
                                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                        >
                                            <Edit3 className="w-4 h-4 mr-2" />
                                            Edit Profile
                                        </Button>
                                    ) : (
                                        <div className="flex space-x-2">
                                            <Button
                                                onClick={handleSave}
                                                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                                            >
                                                <Save className="w-4 h-4 mr-2" />
                                                Save
                                            </Button>
                                            <Button
                                                onClick={handleCancel}
                                                variant="outline"
                                                className="border-gray-300"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Cancel
                                            </Button>
                                        </div>
                                    )}
                                </CardHeader>

                                <CardContent className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
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
                                                    className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
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
                                                    className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
                                                    placeholder="Enter your email"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
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
                                                    className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
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
                                                    className="pl-12 h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
                                                    placeholder="Enter your location"
                                                />
                                            </div>
                                        </div>
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
                                            className="border-2 border-gray-200 focus:border-purple-500 rounded-xl resize-none"
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
                    <div className="space-y-8">
                        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                                    <TrendingUp className="w-6 h-6 mr-3 text-purple-600" />
                                    Recent Activity
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {recentActivity.map((activity, index) => (
                                        <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${activity.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                                                }`}>
                                                <activity.icon className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                                                <p className="text-sm text-gray-500">{activity.time}</p>
                                            </div>
                                            <Badge variant={activity.status === 'completed' ? 'default' : 'destructive'}>
                                                {activity.status}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Achievements Tab */}
                {activeTab === "achievements" && (
                    <div className="space-y-8">
                        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                                    <Award className="w-6 h-6 mr-3 text-purple-600" />
                                    Achievements
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {achievements.map((achievement, index) => (
                                        <div key={index} className={`relative p-6 rounded-2xl border-2 transition-all duration-300 ${achievement.earned
                                                ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50'
                                                : 'border-gray-200 bg-gray-50 hover:border-purple-300'
                                            }`}>
                                            <div className="flex items-start space-x-4">
                                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${achievement.color} flex items-center justify-center ${!achievement.earned ? 'opacity-50' : ''
                                                    }`}>
                                                    <achievement.icon className="w-8 h-8 text-white" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-2">
                                                        <h3 className="font-bold text-lg text-gray-900">{achievement.title}</h3>
                                                        {achievement.earned && (
                                                            <CheckCircle className="w-5 h-5 text-green-500" />
                                                        )}
                                                    </div>
                                                    <p className="text-gray-600 mb-3">{achievement.description}</p>
                                                    {!achievement.earned && achievement.progress && (
                                                        <div>
                                                            <div className="flex justify-between text-sm text-gray-500 mb-1">
                                                                <span>Progress</span>
                                                                <span>{achievement.progress}%</span>
                                                            </div>
                                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                                <div
                                                                    className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
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
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === "settings" && (
                    <div className="space-y-8">
                        {/* Notifications */}
                        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                                    <Bell className="w-6 h-6 mr-3 text-purple-600" />
                                    Notification Preferences
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {Object.entries(notifications).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                {key === 'queueUpdates' && 'Get notified about queue status changes'}
                                                {key === 'promotions' && 'Receive promotional offers and deals'}
                                                {key === 'reminders' && 'Get reminders about upcoming appointments'}
                                                {key === 'newsletter' && 'Receive our weekly newsletter'}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={value}
                                            onCheckedChange={(checked) =>
                                                setNotifications({ ...notifications, [key]: checked })
                                            }
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Privacy Settings */}
                        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                                    <Shield className="w-6 h-6 mr-3 text-purple-600" />
                                    Privacy Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {Object.entries(privacy).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <h4 className="font-semibold text-gray-900 capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </h4>
                                            <p className="text-sm text-gray-500">
                                                {key === 'profileVisible' && 'Make your profile visible to other users'}
                                                {key === 'showLocation' && 'Display your location on your profile'}
                                                {key === 'showPhone' && 'Show your phone number to salons'}
                                                {key === 'allowMessages' && 'Allow other users to send you messages'}
                                            </p>
                                        </div>
                                        <Switch
                                            checked={value}
                                            onCheckedChange={(checked) =>
                                                setPrivacy({ ...privacy, [key]: checked })
                                            }
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        {/* Password Change */}
                        <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl">
                            <CardHeader>
                                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                                    <Lock className="w-6 h-6 mr-3 text-purple-600" />
                                    Change Password
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-2">
                                        Current Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <Input
                                            name="currentPassword"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.currentPassword}
                                            onChange={handleInputChange}
                                            className="pl-12 pr-12 h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                                            New Password
                                        </label>
                                        <Input
                                            name="newPassword"
                                            type="password"
                                            value={formData.newPassword}
                                            onChange={handleInputChange}
                                            className="h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
                                            placeholder="Enter new password"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                                            Confirm Password
                                        </label>
                                        <Input
                                            name="confirmPassword"
                                            type="password"
                                            value={formData.confirmPassword}
                                            onChange={handleInputChange}
                                            className="h-12 border-2 border-gray-200 focus:border-purple-500 rounded-xl"
                                            placeholder="Confirm new password"
                                        />
                                    </div>
                                </div>

                                <Button className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700">
                                    <Lock className="w-4 h-4 mr-2" />
                                    Update Password
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}