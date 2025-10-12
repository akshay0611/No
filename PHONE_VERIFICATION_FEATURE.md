# Phone Verification Feature for Google Auth Users

## Overview
This feature adds phone number verification for users who sign up via Google OAuth. When they try to join a queue, they'll be prompted to verify their phone number with OTP.

## Implementation Summary

### Frontend Changes

1. **PhoneVerificationModal Component** (`frontend/src/components/PhoneVerificationModal.tsx`)
   - Modal dialog for phone number entry and OTP verification
   - Testing mode: Shows OTP in toast and provides auto-fill button
   - Two-step process: Enter phone → Verify OTP

2. **Updated useProfileCompletion Hook** (`frontend/src/hooks/useProfileCompletion.ts`)
   - Added `isPhoneModalOpen` state
   - Added `needsPhoneVerification()` check
   - Added `completePhoneVerification()` method
   - Now handles both name/email completion AND phone verification

3. **Updated QueueSummary Page** (`frontend/src/pages/QueueSummary.tsx`)
   - Added PhoneVerificationModal component
   - Integrated with profile completion flow

4. **Updated API Client** (`frontend/src/lib/api.ts`)
   - Added `updatePhone()` method to update user's phone number

5. **Updated AuthContext** (`frontend/src/context/AuthContext.tsx`)
   - Added `needsPhoneVerification()` helper
   - Updated `isProfileComplete` to check both name/email AND phone

### Backend Changes

1. **New API Endpoint** (`backend/routes.ts`)
   - `PUT /api/user/phone` - Updates user's phone number after verification
   - Validates phone format
   - Checks for duplicate phone numbers
   - Marks phone as verified

## User Flow

### For Phone Auth Users (Existing):
1. Sign up with phone + OTP
2. Try to join queue
3. Prompted for name and email → Complete profile
4. Can join queue

### For Google Auth Users (New):
1. Sign up with Google (has name + email, NO phone)
2. Try to join queue
3. Prompted for phone number → Enter phone
4. Receive OTP (shown in toast for testing)
5. Enter OTP or click "Auto-fill OTP" button
6. Phone verified and saved to profile
7. Can join queue

## Testing Mode Features

- OTP is displayed in a toast notification for 10 seconds
- "Auto-fill OTP (Testing)" button automatically fills the OTP field
- Makes testing much faster without needing real SMS

## Database Updates

The phone number is saved to the user's profile with `phoneVerified: true` flag, so they won't need to verify again on subsequent queue joins.

## Next Steps (Production)

When moving to production:
1. Remove the OTP display from toast
2. Remove the "Auto-fill OTP" button
3. Ensure Twilio is properly configured for real SMS delivery
4. Consider adding rate limiting for OTP requests
