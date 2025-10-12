# Phone Verification Fix - Duplicate Phone Issue

## Problem
When Google auth users tried to add their phone number:
1. They entered phone → `sendOTP` created a NEW user with that phone
2. They verified OTP → tried to update their Google user's phone
3. Backend rejected it saying "phone already registered" (because of step 1)

## Solution

### 1. Updated `sendOTP` Endpoint (`backend/routes.ts`)
- Now checks if the request is from an authenticated user (via JWT token)
- If authenticated (Google auth user adding phone):
  - Uses the existing authenticated user
  - Only checks if phone is taken by a DIFFERENT user
  - Does NOT create a new user
- If not authenticated (phone-only auth flow):
  - Creates a new user as before

### 2. Updated `updatePhone` Endpoint (`backend/routes.ts`)
- Added logic to detect and delete temporary phone-only users
- A temporary user is identified by:
  - Email contains `@placeholder.com`
  - No name set
  - Phone matches the one being added
- If found, deletes the temporary user before updating the Google auth user's phone

### 3. Fixed OTP Display (`frontend/src/components/PhoneVerificationModal.tsx`)
- Changed from `response.otp` to `response.debug?.otp`
- Now correctly displays the OTP from backend response

### 4. Fixed MongoDB Unique Index (`backend/db.ts`)
- Added code to drop old non-sparse phone index
- Creates new sparse index that allows multiple documents without phone field
- Prevents "duplicate key error" for users without phone numbers

### 5. Fixed User Creation (`backend/mongoStorage.ts`)
- Only includes phone field in user object if it's provided
- Prevents setting `phone: undefined` which causes index issues

## Testing Steps

1. **Clean Database** (if needed):
   - Delete any test users with placeholder emails
   - Or restart backend to rebuild indexes

2. **Test Google Auth + Phone Verification**:
   - Sign in with Google
   - Add services to cart
   - Click "Confirm & Join Queue"
   - Phone verification modal appears
   - Enter phone number → Send OTP
   - OTP displays correctly in toast
   - Click "Auto-fill OTP"
   - Click "Verify"
   - ✅ Phone should be added successfully!

3. **Test Phone-Only Auth** (existing flow):
   - Sign out
   - Sign in with phone + OTP
   - Should work as before

## Files Modified
- `backend/routes.ts` - sendOTP and updatePhone endpoints
- `backend/db.ts` - Index management
- `backend/mongoStorage.ts` - User creation logic
- `frontend/src/components/PhoneVerificationModal.tsx` - OTP display

## Result
✅ Google auth users can now successfully add and verify their phone numbers
✅ No more "phone already registered" errors
✅ OTP displays correctly in testing mode
✅ Temporary users are automatically cleaned up
