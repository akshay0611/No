import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../context/AuthContext";
import AuthRouter from "../components/AuthRouter";

export default function NewAuth() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Redirect authenticated users
  useEffect(() => {
    if (user) {
      if (user.role === 'salon_owner') {
        setLocation('/dashboard');
      } else {
        setLocation('/');
      }
    }
  }, [user, setLocation]);

  // Don't render if user is already authenticated
  if (user) {
    return null;
  }

  return <AuthRouter defaultFlow="customer" />;
}