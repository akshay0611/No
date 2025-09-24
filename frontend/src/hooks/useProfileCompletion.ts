import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useToast } from './use-toast';

interface ProfileCompletionData {
  name: string;
  email?: string;
}

export function useProfileCompletion() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const { user, updateUser, needsProfileCompletion } = useAuth();
  const { toast } = useToast();

  const requireProfileCompletion = (action: () => void) => {
    if (!user) {
      // User not authenticated, redirect to auth
      window.location.href = '/auth';
      return;
    }

    if (needsProfileCompletion()) {
      // Store the action to execute after profile completion
      setPendingAction(() => action);
      setIsModalOpen(true);
    } else {
      // Profile is complete, execute action immediately
      action();
    }
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

      // Execute pending action if any
      if (pendingAction) {
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

  const cancelProfileCompletion = () => {
    setIsModalOpen(false);
    setPendingAction(null);
  };

  return {
    isModalOpen,
    requireProfileCompletion,
    completeProfile,
    cancelProfileCompletion,
    needsCompletion: needsProfileCompletion(),
  };
}