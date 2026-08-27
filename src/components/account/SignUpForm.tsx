'use client';

import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Home, UserPlus } from 'lucide-react';
import { InputField, PasswordInput, SubmitButton, SelectField } from './fields';
import { useDistrictOptions } from '@/lib/useDistrictOptions';
import type { SignUpData } from '@/app/account/useAccount';

interface SignUpFormProps {
  onSignUp: (payload: SignUpData) => Promise<boolean>;
  onShowFeedback: (type: 'success' | 'error', message: string) => void;
}

export function SignUpForm({ onSignUp, onShowFeedback }: SignUpFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { districts } = useDistrictOptions();

  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) return;

    if (password.length < 6) {
      onShowFeedback('error', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      onShowFeedback('error', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    await onSignUp({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      district,
      fullAddress: address,
      password,
    });
    setIsLoading(false);
  };

  return (
    <form id="signup-form" onSubmit={handleSubmit} className="space-y-4">
      <InputField
        label="Full Name"
        value={name}
        onChange={setName}
        placeholder="e.g. Sarah Akhtar"
        required
        disabled={isLoading}
        icon={User}
        autoComplete="name"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <InputField
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="sarah@example.com"
          required
          disabled={isLoading}
          icon={Mail}
          autoComplete="email"
        />
        <InputField
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="01XXXXXXXXX"
          required
          disabled={isLoading}
          icon={Phone}
          inputMode="tel"
          autoComplete="tel"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SelectField
          label="District"
          value={district}
          onChange={setDistrict}
          options={districts}
          required
          disabled={isLoading}
        />
        <InputField
          label="Full Address"
          value={address}
          onChange={setAddress}
          placeholder="House, road, area…"
          disabled={isLoading}
          icon={Home}
          hint="Optional — speeds up checkout"
          autoComplete="street-address"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <PasswordInput
          label="Password"
          value={password}
          onChange={setPassword}
          placeholder="Min 6 characters"
          required
          disabled={isLoading}
          icon={Lock}
        />
        <PasswordInput
          label="Confirm Password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          placeholder="Re-enter password"
          required
          disabled={isLoading}
        />
      </div>

      {confirmPassword.length > 0 && (
        <p
          className={`text-[10px] font-bold pl-1 ${
            passwordsMatch ? 'text-emerald-600' : 'text-rose-600'
          }`}
        >
          {passwordsMatch ? '✓ Passwords match' : 'Passwords do not match yet'}
        </p>
      )}

      <SubmitButton loading={isLoading}>
        <UserPlus className="w-4 h-4" /> Create Account
      </SubmitButton>
    </form>
  );
}
