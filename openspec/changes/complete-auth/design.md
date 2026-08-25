## Context

Currently, the customer login flow is client-side only (see `proposal.md` for motivation), scanning `/api/user/all` without password validation. This design outlines how to implement secure backend credentials verification, build the missing customer Sign Up and Password Reset UI panels, and maintain the existing local storage session pattern (`falak_user_account`).

## Goals / Non-Goals

**Goals:**
- Add a new `POST /api/user/login` endpoint that securely verifies credentials using `pbkdf2Sync` hashing via `src/lib/authCrypto.ts`.
- Integrate functional customer registration (Sign Up) and recovery (Forgot Password) forms directly within `src/app/account/AccountClient.tsx`.
- Connect the OTP-based password reset UI flow to the existing `/api/user/reset-password` API.
- Maintain compatibility with `Header.tsx` and `CheckoutClient.tsx` by syncing session state to the `falak_user_account` localStorage key.

**Non-Goals:**
- OAuth/Social login integration (e.g., Google, Facebook).
- Complete migration of customer session storage to HttpOnly JWTs (local storage caching is retained to match current checkout/header behaviors).

## Decisions

### 1. New Login API Endpoint (`POST /api/user/login`)
- **API Spec**:
  - Request: `POST /api/user/login` with body: `{ identifier: string, password: string }`
  - The `identifier` can be either the email or phone number.
  - Validation: Query user using email (lowercase) or phone. If found, verify password using `verifyPassword(password, user.passwordHash)`.
  - Response:
    - On success: Status 200 with `{ success: true, user }` (without exposing the `passwordHash` or `resetOtp`).
    - On failure: Status 401 with `{ success: false, error: 'Incorrect credentials' }`.
- **Alternative**: Modifying the existing `GET` method in `/api/user/route.ts` to verify passwords.
- **Rationale**: Exposing passwords in GET query parameters is insecure. Creating a dedicated `POST` endpoint separates concerns and follows REST/Next.js conventions.

### 2. Multi-Mode Auth UI in `src/app/account/AccountClient.tsx`
- We will leverage the existing `authMode` state (`'signin' | 'signup' | 'forgot'`) to render distinct visual forms:
  - **Sign In**: Email/Phone and Password fields. Link to register (`signup`) and recover password (`forgot`).
  - **Sign Up**: Name, Email, Phone, District, Address, and Password fields.
  - **Forgot Password**:
    - Step 1: Input Email/Phone to request verification code (`POST /api/user/reset-password` with action `request-otp`). Shows code in a demo notification banner.
    - Step 2: Input code and new password (`POST /api/user/reset-password` with action `reset-password`).
- **Alternative**: Separate pages for `/account/register` and `/account/forgot-password`.
- **Rationale**: An inline/SPA-style tabbed flow keeps navigation fast, maintains consistent brand styling, and simplifies session state propagation.

## Risks / Trade-offs

- **Risk**: Plaintext password transit.
  - *Mitigation*: The app relies on SSL/TLS (HTTPS) encryption in transit (enforced in production on Vercel).
- **Risk**: Client-side session staleness.
  - *Mitigation*: Upon login, signup, or logout, update `localStorage` and trigger window redirect/reload or custom event so the `Header` component immediately syncs its display name.
