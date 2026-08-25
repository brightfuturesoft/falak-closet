## 1. Backend Authentication API

- [ ] 1.1 Create `src/app/api/user/login/route.ts` implementing `POST /api/user/login` for credential validation using user model and password hashing.
- [ ] 1.2 Ensure `src/app/api/user/all/route.ts` is not used by the customer frontend.

## 2. Frontend Customer Auth Portal UI

- [ ] 2.1 Implement UI forms in `src/app/account/AccountClient.tsx` corresponding to each auth mode: `'signin'`, `'signup'`, and `'forgot'`.
- [ ] 2.2 Wire the Sign In form submission to execute a `POST` request to `/api/user/login`.
- [ ] 2.3 Wire the Sign Up form submission to execute a `POST` request to `/api/user` with registration details.
- [ ] 2.4 Wire the Forgot Password (OTP request & reset submission) to `/api/user/reset-password`.

## 3. Session Management Integration

- [ ] 3.1 Store the authenticated profile in local storage under `falak_user_account` upon successful Login and Sign Up.
- [ ] 3.2 Ensure the user session changes (Login/Logout/Signup) trigger UI updates in the `Header` component immediately.
- [ ] 3.3 Remove the insecure client-side profile scanning fallback from `AccountClient.tsx`.

## 4. Verification & Testing

- [ ] 4.1 Run standard build compiler checks (`npm run build` or equivalent) to verify compilation.
- [ ] 4.2 Perform manual browser validation of user signup, login with correct/incorrect passwords, OTP retrieval, and password reset.
