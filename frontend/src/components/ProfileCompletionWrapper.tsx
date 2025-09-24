import React from 'react';
import { useProfileCompletion } from '../hooks/useProfileCompletion';
import BookingDetailsModal from './BookingDetailsModal';

interface ProfileCompletionWrapperProps {
  children: React.ReactNode;
  salonName?: string;
  serviceName?: string;
}

/**
 * Wrapper component that provides profile completion functionality
 * to any child components that need it.
 * 
 * Usage:
 * <ProfileCompletionWrapper salonName="Test Salon">
 *   <YourBookingComponent />
 * </ProfileCompletionWrapper>
 */
export default function ProfileCompletionWrapper({ 
  children, 
  salonName = "the salon",
  serviceName = "your service"
}: ProfileCompletionWrapperProps) {
  const { 
    isModalOpen, 
    completeProfile, 
    cancelProfileCompletion 
  } = useProfileCompletion();

  return (
    <>
      {children}
      
      {/* Profile Completion Modal */}
      <BookingDetailsModal
        isOpen={isModalOpen}
        onComplete={completeProfile}
        onCancel={cancelProfileCompletion}
        salonName={salonName}
        serviceName={serviceName}
      />
    </>
  );
}