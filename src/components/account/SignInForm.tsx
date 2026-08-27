'use client';

import React, { useState } from 'react';
import { InputField, PasswordInput, SubmitButton } from './fields';
import type { AuthMode } from '@/app/account/useAccount';

interface SignInFormProps {
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSwitchMode: (mode: AuthMode) => void;
}

export function SignInForm({ onSignIn, onSwitchMode }: SignInFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    await onSignIn(email, password);
    setIsLoading(false);
  };

  return (
    <form id="signin-form" onSubmit={handleSubmit} className="space-y-4">
      <InputField
        label="Email Address"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="e.g. sarah@example.com"
        required
        disabled={isLoading}
      />
      <PasswordInput
        label="Password"
        value={password}
        onChange={setPassword}
        required
        disabled={isLoading}
      />
      <div className="flex justify-end">
        <button
          type="button"
          id="forgot-password-link"
          onClick={() => onSwitchMode('forgot')}
          className="text-[11px] text-[#9B050B] font-bold hover:underline cursor-pointer"
        >
          Forgot password?
        </button>
      </div>
      <SubmitButton loading={isLoading}>Sign In to Account</SubmitButton>
    </form>
  );
}
