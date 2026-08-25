## Why

Currently, customer authentication in Falak Closet is half-baked and insecure:
1. The Sign In process fetches all registered user accounts from the backend via `/api/user/all` and performs matching on the client-side without verifying password credentials, which exposes all user profiles.
2. The Sign Up and Forgot Password screens/flows are completely missing from the customer portal UI, even though basic backend support exists for user creation and password reset.

Completing the customer authentication system is required now to secure user profiles and provide a standard modest fashion shopping experience where users can safely register, sign in, and reset their passwords.

## What Changes

- **Secure Login Endpoint**: Add a new `POST /api/user/login` endpoint that securely verifies user credentials against the database using hashed passwords.
- **Complete Auth UI**: Update `src/app/account/AccountClient.tsx` to implement a tabbed or multi-mode UI allowing users to switch between Sign In, Sign Up, and Forgot Password (OTP entry & new password submission).
- **Remove Insecure User Fetch**: Remove client-side scanning of `/api/user/all` for authentication.
- **Password Reset Integration**: Hook the OTP-based password reset UI to the existing `POST /api/user/reset-password` API.

## Capabilities

### New Capabilities

- `user-auth`: Provides secure customer registration, login verification, password recovery with OTP, and frontend session state management.

### Modified Capabilities

<!-- None -->

## Impact

- **Affected Components**:
  - `src/app/account/AccountClient.tsx` (Complete UI integration of auth modes)
  - `src/app/api/user/login/route.ts` (New login validation endpoint)
  - `src/app/api/user/all/route.ts` (Ensure it is not exposed or used insecurely by clients)
- **Dependencies**: No external library additions are required; uses existing node `crypto` package.
