import { Link, useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Clock, Bell, User, Settings, Home } from "lucide-react";
import { useState } from "react";
import ProfileSheet from "./ProfileSheet";

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (user?.role === 'salon_owner') {
    return null;
  }

  return (
    <>
      {/* Mobile-First Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border shadow-sm hidden md:block">
        <div className="px-4 py-3">
          <div className="flex items-center justify-end md:justify-between">
            {/* Logo */}
            <div className="hidden md:flex items-center space-x-3">
              <Link href="/" className="flex items-center space-x-2" data-testid="link-home">
                <div className="w-8 h-8 bg-gradient-to-r from-teal-600 to-teal-700 rounded-lg flex items-center justify-center shadow-md">
                  <Clock className="h-4 w-4 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-teal-600 to-teal-700 bg-clip-text text-transparent md:text-2xl">
                  AltQ
                </span>
              </Link>
            </div>

            {/* Right Section - Sign In Button (Desktop Only) */}
            <div className="flex items-center space-x-2">
              {!user && (
                <Link href="/auth" data-testid="link-auth">
                  <Button
                    className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-medium px-4 py-2 text-sm rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
                    data-testid="button-signin"
                  >
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Desktop Navigation - Hidden on Mobile */}
        <div className="hidden md:block border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-4">
              {/* Desktop Navigation */}
              <nav className="flex items-center space-x-1">
                <Link
                  href="/"
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${location === '/'
                    ? 'text-teal-600 bg-teal-50'
                    : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
                    }`}
                  data-testid="link-discover"
                >
                  Home
                </Link>
                {user && (
                  <>
                    <Link
                      href="/queue"
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 relative ${location === '/queue'
                        ? 'text-teal-600 bg-teal-50'
                        : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
                        }`}
                      data-testid="link-queue"
                    >
                      My Queue
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    </Link>
                    {user.role === 'salon_owner' && (
                      <Link
                        href="/dashboard"
                        className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${location === '/dashboard'
                          ? 'text-teal-600 bg-teal-50'
                          : 'text-gray-600 hover:text-teal-600 hover:bg-teal-50'
                          }`}
                        data-testid="link-dashboard"
                      >
                        Dashboard
                      </Link>
                    )}
                  </>
                )}
              </nav>

              {/* Desktop User Section (Simplified) */}
              {user && (
                <div className="flex items-center space-x-4 ml-8">
                  <Link href="/profile">
                    <div className="flex items-center space-x-2 hover:bg-teal-50 rounded-lg p-2 transition-all duration-200 cursor-pointer">
                      <div className="w-8 h-8 rounded-full shadow-md overflow-hidden bg-white">
                        {user.profileImage ? (
                          <img
                            src={user.profileImage}
                            alt="Profile"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white font-medium">
                            <User className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 font-medium" data-testid="text-username">
                        {user.name?.split(' ')[0] || 'User'}
                      </span>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      {user && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 z-40 md:hidden">
          <nav className="flex justify-around">
            <Link
              href="/"
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${location === '/' ? 'text-teal-600 bg-teal-50' : 'text-gray-600'
                }`}
            >
              <Home className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">Home</span>
            </Link>

            <Link
              href="/queue"
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors relative ${location === '/queue' ? 'text-teal-600 bg-teal-50' : 'text-gray-600'
                }`}
            >
              <Bell className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium">My Queue</span>
              <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full"></span>
            </Link>

            {user.role === 'salon_owner' && (
              <Link
                href="/dashboard"
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors ${location === '/dashboard' ? 'text-teal-600 bg-teal-50' : 'text-gray-600'
                  }`}
              >
                <Settings className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Dashboard</span>
              </Link>
            )}

            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                <button
                  className="flex flex-col items-center py-2 px-3 rounded-lg text-gray-600"
                >
                  <div className="w-5 h-5 rounded-full overflow-hidden mb-1 bg-white">
                    {user.profileImage ? (
                      <img
                        src={user.profileImage}
                        alt="Profile"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-teal-500 to-teal-600 flex items-center justify-center text-white text-xs font-medium">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium">Profile</span>
                </button>
              </SheetTrigger>
              <SheetContent className="w-80">
                <ProfileSheet
                  user={user}
                  logout={logout}
                  onClose={() => setIsSheetOpen(false)}
                />
              </SheetContent>
            </Sheet>
          </nav>
        </div>
      )}
    </>
  );
}
