# Progressive Authentication Integration Guide

This guide explains how to integrate the progressive authentication system with existing booking flows.

## Overview

The progressive authentication system allows users to:
1. Sign up with just their phone number
2. Complete profile details (name, email) only when needed for booking
3. Maintain backward compatibility with existing complete profiles

## Key Components

### 1. useProfileCompletion Hook

The main hook for handling profile completion:

```typescript
import { useProfileCompletion } from '../hooks/useProfileCompletion';

function BookingComponent() {
  const { 
    isModalOpen, 
    requireProfileCompletion, 
    completeProfile, 
    cancelProfileCompletion,
    needsCompletion 
  } = useProfileCompletion();

  const handleBooking = () => {
    // This will show profile completion modal if needed
    requireProfileCompletion(() => {
      // This function runs after profile is complete
      proceedWithBooking();
    });
  };

  return (
    <>
      <button onClick={handleBooking}>Book Now</button>
      
      <BookingDetailsModal
        isOpen={isModalOpen}
        onComplete={completeProfile}
        onCancel={cancelProfileCompletion}
        salonName="Salon Name"
      />
    </>
  );
}
```

### 2. BookingDetailsModal Component

Modal that collects user's name (required) and email (optional):

```typescript
<BookingDetailsModal
  isOpen={isModalOpen}
  onComplete={(details) => {
    // details: { name: string; email?: string }
    console.log('Profile completed:', details);
  }}
  onCancel={() => setIsModalOpen(false)}
  salonName="Test Salon"
  serviceName="Haircut"
/>
```

### 3. ProfileCompletionWrapper Component

Wrapper component for easy integration:

```typescript
import ProfileCompletionWrapper from '../components/ProfileCompletionWrapper';

function MyBookingPage() {
  return (
    <ProfileCompletionWrapper salonName="Test Salon">
      <YourExistingBookingComponent />
    </ProfileCompletionWrapper>
  );
}
```

## Integration Examples

### Example 1: Queue Joining (Already Implemented)

```typescript
// In QueueSummary.tsx
const handleConfirmAndJoin = () => {
  if (!user) {
    setLocation('/auth');
    return;
  }
  
  requireProfileCompletion(() => {
    joinQueueMutation.mutate();
  });
};
```

### Example 2: Direct Service Booking

```typescript
function ServiceBookingButton({ service, salonId }) {
  const { requireProfileCompletion } = useProfileCompletion();
  
  const handleBookService = () => {
    requireProfileCompletion(() => {
      // Book the service
      api.queue.join({
        serviceIds: [service.id],
        salonId,
        // ... other booking data
      });
    });
  };

  return <button onClick={handleBookService}>Book {service.name}</button>;
}
```

### Example 3: Favorite Salon (No Profile Completion Needed)

```typescript
function FavoriteButton({ salonId }) {
  const { user } = useAuth();
  
  const handleFavorite = () => {
    if (!user) {
      // Redirect to auth - no profile completion needed for favorites
      setLocation('/auth');
      return;
    }
    
    // Add to favorites directly
    api.users.addFavorite(salonId);
  };

  return <button onClick={handleFavorite}>Add to Favorites</button>;
}
```

## When to Use Profile Completion

### ✅ Use profile completion for:
- Joining queues/booking services
- Making reservations
- Any action where the salon needs to identify the customer

### ❌ Don't use profile completion for:
- Adding favorites
- Browsing salons
- Reading reviews
- General app navigation

## AuthContext Updates

The AuthContext now includes:

```typescript
interface AuthContextType {
  // ... existing properties
  authFlow: 'customer' | 'admin' | null;
  setAuthFlow: (flow: 'customer' | 'admin' | null) => void;
  isProfileComplete: boolean;
  needsProfileCompletion: () => boolean;
}
```

### Usage:

```typescript
const { needsProfileCompletion, isProfileComplete } = useAuth();

// Check if user needs profile completion
if (needsProfileCompletion()) {
  // Show profile completion flow
}

// Or use the boolean directly
if (!isProfileComplete) {
  // Handle incomplete profile
}
```

## API Integration

### Profile Completion Endpoint

```typescript
// POST /api/user/complete
await api.auth.completeProfile(name, email);
```

### Phone Authentication Endpoints

```typescript
// Send OTP
await api.auth.sendOTP(phoneNumber);

// Verify OTP
const { user, token } = await api.auth.verifyOTP(phoneNumber, otp);
```

## Backward Compatibility

The system maintains full backward compatibility:

- Existing users with complete profiles work unchanged
- New phone-only users get progressive completion
- All existing booking flows continue to work
- No breaking changes to existing components

## Testing

Test files are provided for all components:

- `PhoneAuth.test.tsx` - Phone authentication
- `PhoneOTPVerification.test.tsx` - OTP verification
- `BookingDetailsModal.test.tsx` - Profile completion modal
- `AuthRouter.test.tsx` - Authentication flow routing
- `auth-integration.test.tsx` - End-to-end integration tests

Run tests with:
```bash
npm test
```

## Migration Checklist

To integrate progressive authentication in existing components:

1. ✅ Import `useProfileCompletion` hook
2. ✅ Wrap booking actions with `requireProfileCompletion()`
3. ✅ Add `BookingDetailsModal` to component
4. ✅ Update authentication checks to redirect unauthenticated users
5. ✅ Test the complete flow
6. ✅ Add tests for the integration

## Common Patterns

### Pattern 1: Simple Booking Action

```typescript
const { requireProfileCompletion } = useProfileCompletion();

const handleAction = () => {
  requireProfileCompletion(() => {
    // Your booking logic here
  });
};
```

### Pattern 2: Conditional Profile Completion

```typescript
const { needsProfileCompletion } = useAuth();

if (needsProfileCompletion()) {
  // Show different UI for incomplete profiles
  return <CompleteProfilePrompt />;
}

// Normal UI for complete profiles
return <NormalBookingInterface />;
```

### Pattern 3: Wrapper Component

```typescript
<ProfileCompletionWrapper salonName={salon.name}>
  <BookingInterface />
</ProfileCompletionWrapper>
```

This integration guide ensures smooth adoption of the progressive authentication system while maintaining all existing functionality.