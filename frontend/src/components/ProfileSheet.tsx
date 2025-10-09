import { Link } from "wouter";
import { User, LogOut, Settings } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getUserCategory, setUserCategory, type UserCategory } from "../utils/categoryUtils";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface ProfileSheetProps {
    user: any;
    logout: () => void;
    onClose: () => void;
}

export default function ProfileSheet({ user, logout, onClose }: ProfileSheetProps) {
    const [selectedCategory, setSelectedCategory] = useState<UserCategory>(getUserCategory() || 'unisex');
    const { toast } = useToast();

    // Update local state when category changes in localStorage
    useEffect(() => {
        const handleStorageChange = () => {
            setSelectedCategory(getUserCategory() || 'unisex');
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);

    const handleCategoryChange = (category: UserCategory) => {
        setSelectedCategory(category);
        setUserCategory(category);

        toast({
            title: "Category Updated",
            description: `Your preferred category has been changed to ${category === 'men' ? "Men's" : category === 'women' ? "Women's" : "Unisex"} Salons`,
        });

        // Reload the page to update the home page with new category
        window.location.reload();
    };

    return (
        <div className="flex flex-col h-full">
            {/* Profile Header with Gradient Background */}
            <div className="relative -mx-6 -mt-6 mb-6 overflow-hidden">
                {/* Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700"></div>

                {/* Decorative Elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>

                {/* Content */}
                <div className="relative px-6 py-8">
                    <div className="flex items-center space-x-4">
                        <div className="relative">
                            <div className="w-20 h-20 rounded-2xl overflow-hidden border-4 border-white/20 shadow-xl">
                                {user.profileImage ? (
                                    <img
                                        src={user.profileImage}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold text-2xl">
                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full border-4 border-teal-600"></div>
                        </div>
                        <div className="flex-1">
                            <p className="text-xl font-bold text-white mb-1">{user.name || 'User'}</p>
                            <p className="text-sm text-teal-100 capitalize">{user.role?.replace('_', ' ') || 'Customer'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Section */}
            <div className="flex-1 px-1">
                <div className="space-y-1">
                    <Link
                        href="/profile"
                        onClick={onClose}
                        className="group flex items-center space-x-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-teal-50 rounded-xl transition-all duration-200"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                            <User className="h-5 w-5 text-gray-600 group-hover:text-teal-600 transition-colors" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900">My Profile</p>
                            <p className="text-xs text-gray-500">View and edit your profile</p>
                        </div>
                    </Link>

                    <Link
                        href="/settings"
                        onClick={onClose}
                        className="group flex items-center space-x-3 px-4 py-3.5 text-sm text-gray-700 hover:bg-teal-50 rounded-xl transition-all duration-200"
                    >
                        <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-teal-100 flex items-center justify-center transition-colors">
                            <Settings className="h-5 w-5 text-gray-600 group-hover:text-teal-600 transition-colors" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-gray-900">Settings</p>
                            <p className="text-xs text-gray-500">Manage your preferences</p>
                        </div>
                    </Link>
                </div>

                {/* Category Selector */}
                <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-100">
                    <div className="flex items-center justify-between mb-3">
                        <label className="text-sm font-bold text-gray-900">
                            Salon Preference
                        </label>
                        <div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div>
                    </div>
                    <Select
                        value={selectedCategory}
                        onValueChange={(value: UserCategory) => handleCategoryChange(value)}
                    >
                        <SelectTrigger className="h-12 text-sm border-gray-200 focus:border-teal-500 rounded-xl bg-white shadow-sm hover:shadow transition-shadow">
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="men">
                                <div className="flex items-center gap-3 py-1">
                                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                    <div>
                                        <p className="font-medium">Men's Salons</p>
                                        <p className="text-xs text-gray-500">Grooming services for men</p>
                                    </div>
                                </div>
                            </SelectItem>
                            <SelectItem value="women">
                                <div className="flex items-center gap-3 py-1">
                                    <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                                    <div>
                                        <p className="font-medium">Women's Salons</p>
                                        <p className="text-xs text-gray-500">Beauty services for women</p>
                                    </div>
                                </div>
                            </SelectItem>
                            <SelectItem value="unisex">
                                <div className="flex items-center gap-3 py-1">
                                    <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                                    <div>
                                        <p className="font-medium">Unisex Salons</p>
                                        <p className="text-xs text-gray-500">Services for everyone</p>
                                    </div>
                                </div>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-2.5 flex items-center">
                        <span className="inline-block w-1 h-1 rounded-full bg-gray-400 mr-2"></span>
                        Personalizes your home page experience
                    </p>
                </div>
            </div>

            {/* Logout Button - Fixed at Bottom */}
            <div className="mt-auto pt-6 border-t border-gray-100">
                <button
                    onClick={() => {
                        onClose();
                        logout();
                    }}
                    className="group flex items-center justify-center space-x-3 px-4 py-3.5 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 w-full"
                    data-testid="button-logout"
                >
                    <div className="w-10 h-10 rounded-xl bg-red-50 group-hover:bg-red-100 flex items-center justify-center transition-colors">
                        <LogOut className="h-5 w-5 text-red-600" />
                    </div>
                    <span className="font-semibold flex-1 text-left">Sign Out</span>
                </button>
            </div>
        </div>
    );
}
