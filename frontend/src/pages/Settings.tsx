import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
    Bell,
    Shield,
    Lock,
    Eye,
    EyeOff,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [showPassword, setShowPassword] = useState(false);

    const [formData, setFormData] = useState({
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

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePasswordUpdate = async () => {
        if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
            toast({
                title: "Missing fields",
                description: "Please fill in all password fields",
                variant: "destructive",
            });
            return;
        }

        if (formData.newPassword !== formData.confirmPassword) {
            toast({
                title: "Passwords don't match",
                description: "New password and confirm password must match",
                variant: "destructive",
            });
            return;
        }

        if (formData.newPassword.length < 6) {
            toast({
                title: "Password too short",
                description: "Password must be at least 6 characters",
                variant: "destructive",
            });
            return;
        }

        try {
            const token = localStorage.getItem('smartq_token');
            if (!token) {
                throw new Error('No authentication token found');
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://no-production-d4fc.up.railway.app'}/api/user/change-password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    currentPassword: formData.currentPassword,
                    newPassword: formData.newPassword
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update password');
            }

            toast({
                title: "Password updated!",
                description: "Your password has been changed successfully.",
            });

            // Clear form
            setFormData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            });
        } catch (error: any) {
            toast({
                title: "Update failed",
                description: error.message || "Failed to update password",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 relative overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-teal-400/20 to-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-teal-500/20 to-teal-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative max-w-4xl mx-auto px-6 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 sm:pb-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent">
                        Settings
                    </h1>
                    <p className="text-base sm:text-xl text-gray-600 mt-2">
                        Manage your preferences and security
                    </p>
                </div>

                <div className="space-y-6 sm:space-y-8">
                    {/* Notifications */}
                    <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl mx-1">
                        <CardHeader>
                            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                                <Bell className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-teal-600" />
                                Notification Preferences
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 sm:space-y-6">
                            {Object.entries(notifications).map(([key, value]) => (
                                <div key={key} className="flex items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </h4>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
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
                                        className="flex-shrink-0"
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Privacy Settings */}
                    <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl mx-1">
                        <CardHeader>
                            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                                <Shield className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-purple-600" />
                                Privacy Settings
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 sm:space-y-6">
                            {Object.entries(privacy).map(([key, value]) => (
                                <div key={key} className="flex items-start sm:items-center justify-between gap-3 p-3 sm:p-4 bg-gray-50 rounded-xl">
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-semibold text-sm sm:text-base text-gray-900 capitalize">
                                            {key.replace(/([A-Z])/g, ' $1').trim()}
                                        </h4>
                                        <p className="text-xs sm:text-sm text-gray-500 mt-1">
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
                                        className="flex-shrink-0"
                                    />
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Password Change */}
                    <Card className="border-0 bg-white/90 backdrop-blur-sm shadow-xl mx-1">
                        <CardHeader>
                            <CardTitle className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                                <Lock className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-purple-600" />
                                Change Password
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 sm:space-y-6">
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

                            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
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

                            <Button
                                onClick={handlePasswordUpdate}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 w-full sm:w-auto"
                            >
                                <Lock className="w-4 h-4 mr-2" />
                                Update Password
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
