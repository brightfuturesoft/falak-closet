## Purpose

Provides secure user authentication, registration, session management, and password recovery via OTP for customers of Falak Closet modest fashion brand.

## ADDED Requirements

### Requirement: User Registration
The system MUST allow new users to register a unique customer account with name, email, phone number, and password.

#### Scenario: Successful Registration
- **WHEN** client submits POST to `/api/user` with name, unique email, phone number, and password
- **THEN** a new user is saved with a hashed password, and the API returns the user profile.

### Requirement: User Login Authentication
The system MUST verify user credentials securely using password hashing and deny login access for incorrect credentials.

#### Scenario: Successful Login
- **WHEN** client submits POST to `/api/user/login` with correct email and password
- **THEN** the response returns success with the user details.

#### Scenario: Unsuccessful Login (Incorrect Password)
- **WHEN** client submits POST to `/api/user/login` with correct email but incorrect password
- **THEN** the response returns HTTP status 401 with an error message indicating invalid credentials.

### Requirement: Password Reset Generation
The system MUST generate a 6-digit OTP code to verify identity when a password reset is requested.

#### Scenario: Generate Reset OTP
- **WHEN** client submits POST to `/api/user/reset-password` with action `request-otp` and a valid email or phone
- **THEN** a 6-digit code is generated and saved as `resetOtp` on the user, and returned in the response.

### Requirement: Complete Password Reset
The system MUST verify the generated OTP and update the user's password when a valid reset is submitted.

#### Scenario: Successful Password Reset
- **WHEN** client submits POST to `/api/user/reset-password` with action `reset-password`, the correct OTP, and a new password
- **THEN** the user's password hash is updated, `resetOtp` is cleared, and the response indicates success.
