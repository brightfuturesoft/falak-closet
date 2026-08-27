'use client';

import React, { useState } from 'react';
import { Mail, Lock, LogIn } from 'lucide-react';
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
        icon={Mail}
        autoComplete="email"
      />
      <PasswordInput
        label="Password"
        value={password}
        onChange={setPassword}
        required
        disabled={isLoading}
        icon={Lock}
      />
      <div className="flex justify-end -mt-1">
        <button
          type="button"
          id="forgot-password-link"
          onClick={() => onSwitchMode('forgot')}
          className="text-[11px] text-[#D92670] font-bold hover:text-[#C2185B] hover:underline cursor-pointer transition-colors"
        >
          Forgot password?
        </button>
      </div>
      <SubmitButton loading={isLoading}>
        <LogIn className="w-4 h-4" /> Sign In
      </SubmitButton>
    </form>
  );
}
