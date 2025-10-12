import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useToast } from './use-toast';

interface ProfileCompletionData {
  name: string;
  email?: string;
  phone?: string;
}

export function useProfileCompletion() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const { user, updateUser, needsProfileCompletion } = useAuth();
  const { toast } = useToast();

  const needsPhoneVerification = (): boolean => {
    if (!user) return false;
    // User needs phone verification if they don't have a phone number (Google auth)
    return !user.phone || user.phone.trim() === '';
  };

  const requireProfileCompletion = (action: () => void) => {
    if (!user) {
      // User not authenticated, redirect to auth
      window.location.href = '/auth';
      return;
    }

    // Check if user needs name/email completion (phone auth users)
    if (needsProfileCompletion()) {
      setPendingAction(() => action);
      setIsModalOpen(true);
      return;
    }

    // Check if user needs phone verification (Google auth users)
    if (needsPhoneVerification()) {
      setPendingAction(() => action);
      setIsPhoneModalOpen(true);
      return;
    }

    // Profile is complete, execute action immediately
    action();
  };

  const completeProfile = async (data: ProfileCompletionData) => {
    try {
      await api.auth.completeProfile(data.name, data.email);
      
      // Update user in context
      const updatedUser = {
        ...user!,
        name: data.name,
        email: data.email || user!.email,
      };
      updateUser(updatedUser);

      toast({
        title: 'Profile Updated!',
        description: 'Your profile has been completed successfully.',
      });

      // Close modal
      setIsModalOpen(false);

      // Check if phone verification is needed next
      if (needsPhoneVerification()) {
        setIsPhoneModalOpen(true);
      } else if (pendingAction) {
        // Execute pending action if profile is fully complete
        pendingAction();
        setPendingAction(null);
      }

      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const completePhoneVerification = async (phone: string) => {
    try {
      // Update user phone in backend
      await api.auth.updatePhone(phone);
      
      // Update user in context
      const updatedUser = {
        ...user!,
        phone: phone,
      };
      updateUser(updatedUser);

      toast({
        title: 'Phone Verified!',
        description: 'Your phone number has been added to your profile.',
      });

      // Close phone modal
      setIsPhoneModalOpen(false);

      // Execute pending action if any
      if (pendingAction) {
        pendingAction();
        setPendingAction(null);
      }

      return true;
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update phone number.',
        variant: 'destructive',
      });
      return false;
    }
  };

  const cancelProfileCompletion = () => {
    setIsModalOpen(false);
    setIsPhoneModalOpen(false);
    setPendingAction(null);
  };

  return {
    isModalOpen,
    isPhoneModalOpen,
    requireProfileCompletion,
    completeProfile,
    completePhoneVerification,
    cancelProfileCompletion,
    needsCompletion: needsProfileCompletion() || needsPhoneVerification(),
  };
}