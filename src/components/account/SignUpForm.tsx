'use client';

import React, { useState } from 'react';
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
    <form id="signup-form" onSubmit={handleSubmit} className="space-y-3.5">
      <InputField
        label="Full Name"
        value={name}
        onChange={setName}
        placeholder="e.g. Sarah Akhtar"
        required
        disabled={isLoading}
      />
      <InputField
        label="Email Address"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="e.g. sarah@example.com"
        required
        disabled={isLoading}
      />
      <InputField
        label="Phone Number"
        type="tel"
        value={phone}
        onChange={setPhone}
        placeholder="01XXXXXXXXX"
        required
        disabled={isLoading}
      />
      <SelectField
        label="District"
        value={district}
        onChange={setDistrict}
        options={districts}
        required
        disabled={isLoading}
      />
      <InputField
        label="Full Address (optional)"
        value={address}
        onChange={setAddress}
        placeholder="House, road, area..."
        disabled={isLoading}
      />
      <PasswordInput
        label="Password (min 6 chars)"
        value={password}
        onChange={setPassword}
        placeholder="Create a strong password"
        required
        disabled={isLoading}
      />
      <PasswordInput
        label="Confirm Password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        placeholder="Re-enter your password"
        required
        disabled={isLoading}
      />
      <SubmitButton loading={isLoading}>Create Account</SubmitButton>
    </form>
  );
}
