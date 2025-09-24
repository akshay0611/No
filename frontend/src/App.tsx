import { useState } from "react";
import { Switch, Route } from "wouter";
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
import NotFound from "@/pages/not-found";
import SkeletonLoadingScreen from "./components/SkeletonLoadingScreen";


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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [currentPhase, setCurrentPhase] = useState<'auth' | 'skeleton' | 'app'>('auth');

  const handleAuthComplete = () => {
    console.log('App: Auth complete, switching to skeleton loading');
    setCurrentPhase('skeleton');
  };

  const handleSkeletonComplete = () => {
    console.log('App: Skeleton loading complete, switching to app');
    setCurrentPhase('app');
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
      ) : currentPhase === 'skeleton' ? (
        <SkeletonLoadingScreen onComplete={handleSkeletonComplete} />
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