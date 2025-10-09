import { useState, useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import { CartProvider } from "./context/CartContext";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import NewAuthPage from "./pages/NewAuthPage";
import SalonProfile from "./pages/SalonProfile";
import QueueSummary from "./pages/QueueSummary";
import Queue from "./pages/Queue";
import Dashboard from "./pages/Dashboard";
import ContactUs from "./pages/ContactUs";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import HelpCenter from "./pages/HelpCenter";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import NotFound from "@/pages/not-found";
import SkeletonLoadingScreen from "./components/SkeletonLoadingScreen";
import IntroScreen from "./components/IntroScreen";
import PhoneAuthFlow from "./components/PhoneAuthFlow";
import CategorySelection from "./components/CategorySelection";
import { UserCategory, getUserCategory, setUserCategory, clearUserCategory } from "./utils/categoryUtils";


function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={NewAuthPage} />
      <Route path="/salon/:id" component={SalonProfile} />
      <Route path="/queue-summary" component={QueueSummary} />
      <Route path="/queue" component={Queue} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/contact" component={ContactUs} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/help" component={HelpCenter} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [currentPhase, setCurrentPhase] = useState<'auth' | 'intro' | 'phone-auth' | 'skeleton' | 'category' | 'app'>('auth');
  const [authenticatedUser, setAuthenticatedUser] = useState<any>(null);
  const [, setLocation] = useLocation();

  // Check for existing authentication on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('smartq_token');
    const storedUser = localStorage.getItem('smartq_user');
    const storedCategory = getUserCategory();
    
    if (storedToken && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('Found existing auth, user:', user);
        setAuthenticatedUser(user);
        
        // If user is admin (salon_owner), skip category selection
        if (user.role === 'salon_owner') {
          setCurrentPhase('app');
        } else if (storedCategory) {
          // Regular user with category already selected
          setCurrentPhase('app');
        } else {
          // Regular user without category - show category selection
          setCurrentPhase('category');
        }
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('smartq_token');
        localStorage.removeItem('smartq_user');
        clearUserCategory();
        // Stay in auth phase if stored data is invalid
      }
    }
  }, []);

  const handleAuthComplete = (user?: any) => {
    console.log('App: Auth complete, user:', user);
    setAuthenticatedUser(user);
    // If user is an admin (salon_owner), skip intro and go directly to app
    if (user && user.role === 'salon_owner') {
      console.log('Admin user detected, skipping intro screen');
      setCurrentPhase('skeleton');
    } else {
      console.log('Regular user, showing intro screen');
      setCurrentPhase('intro');
    }
  };

  const handleIntroComplete = () => {
    console.log('App: Intro complete, switching to skeleton loading');
    setCurrentPhase('skeleton');
  };

  const handleSkeletonComplete = () => {
    console.log('App: Skeleton loading complete');
    
    // Check if user needs category selection
    if (authenticatedUser && authenticatedUser.role !== 'salon_owner') {
      const storedCategory = getUserCategory();
      if (!storedCategory) {
        console.log('No category selected, showing category selection');
        setCurrentPhase('category');
        return;
      }
    }
    
    console.log('Switching to app');
    setCurrentPhase('app');
  };

  const handleCategorySelect = (category: UserCategory) => {
    console.log('Category selected:', category);
    setUserCategory(category);
    setCurrentPhase('app');
  };

  // Navigate to appropriate page when entering app phase
  useEffect(() => {
    if (currentPhase === 'app' && authenticatedUser) {
      console.log('App phase reached with user:', authenticatedUser);
      if (authenticatedUser.role === 'salon_owner') {
        console.log('Navigating admin to dashboard');
        setLocation('/dashboard');
      } else {
        console.log('Navigating customer to home');
        setLocation('/');
      }
    }
  }, [currentPhase, authenticatedUser, setLocation]);

  const handleSignIn = () => {
    console.log('App: Sign in requested, going to phone auth');
    setCurrentPhase('phone-auth');
  };

  const handlePhoneAuthComplete = (user?: any) => {
    console.log('App: Phone auth complete, user:', user);
    setAuthenticatedUser(user);
    // All phone auth goes to skeleton loading (admins will be routed by the auth context)
    setCurrentPhase('skeleton');
  };

  console.log('App render, currentPhase:', currentPhase);

  return (
    <>
      {currentPhase === 'auth' ? (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <WebSocketProvider>
                <CartProvider>
                  <NewAuthPage onComplete={handleAuthComplete} />
                </CartProvider>
              </WebSocketProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      ) : currentPhase === 'intro' ? (
        <IntroScreen onNext={handleIntroComplete} onSignIn={handleSignIn} />
      ) : currentPhase === 'phone-auth' ? (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <WebSocketProvider>
                <CartProvider>
                  <PhoneAuthFlow onComplete={handlePhoneAuthComplete} />
                </CartProvider>
              </WebSocketProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      ) : currentPhase === 'skeleton' ? (
        <SkeletonLoadingScreen onComplete={handleSkeletonComplete} />
      ) : currentPhase === 'category' ? (
        <CategorySelection onCategorySelect={handleCategorySelect} />
      ) : (
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <AuthProvider>
              <WebSocketProvider>
                <CartProvider>
                  <Layout>
                    <Toaster />
                    <Router />
                  </Layout>
                </CartProvider>
              </WebSocketProvider>
            </AuthProvider>
          </TooltipProvider>
        </QueryClientProvider>
      )}
    </>
  );
}

export default App;