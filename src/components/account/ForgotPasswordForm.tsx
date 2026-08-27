'use client';

import React, { useState } from 'react';
import { ChevronLeft, ShieldCheck } from 'lucide-react';
import { InputField, PasswordInput, SubmitButton } from './fields';

interface ForgotPasswordFormProps {
  onShowFeedback: (type: 'success' | 'error', message: string) => void;
  onSuccess: () => void;
}

export function ForgotPasswordForm({ onShowFeedback, onSuccess }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'request-otp', identifier: identifier.trim() }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        onShowFeedback('error', data.error || 'Could not find an account with that email or phone.');
        setIsLoading(false);
        return;
      }

      if (data.demoOtp) setDemoOtp(data.demoOtp);
      setStep(2);
      onShowFeedback('success', 'OTP sent! Check your email/phone for the code.');
    } catch {
      onShowFeedback('error', 'Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      onShowFeedback('error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      onShowFeedback('error', 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset-password',
          identifier: identifier.trim(),
          otp: otp.trim(),
          newPassword: newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        onShowFeedback('error', data.error || 'Reset failed. Please check your OTP and try again.');
        setIsLoading(false);
        return;
      }

      onShowFeedback('success', 'Password updated! You can now sign in.');
      onSuccess();
    } catch {
      onShowFeedback('error', 'Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Demo OTP hint */}
      {demoOtp && step === 2 && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            Demo OTP (SMS/Email):{' '}
            <strong className="font-mono tracking-widest">{demoOtp}</strong>
          </span>
        </div>
      )}

      {step === 1 ? (
        <form id="forgot-step1-form" onSubmit={handleRequestOtp} className="space-y-4">
          <InputField
            label="Email or Phone Number"
            value={identifier}
            onChange={setIdentifier}
            placeholder="e.g. sarah@example.com or 01700000000"
            required
            disabled={isLoading}
          />
          <SubmitButton loading={isLoading}>Send OTP Code</SubmitButton>
        </form>
      ) : (
        <form id="forgot-step2-form" onSubmit={handleResetPassword} className="space-y-4">
          <InputField
            label="OTP Code"
            value={otp}
            onChange={setOtp}
            placeholder="6-digit code"
            required
            disabled={isLoading}
          />
          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Min 6 characters"
            required
            disabled={isLoading}
          />
          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter new password"
            required
            disabled={isLoading}
          />
          <SubmitButton loading={isLoading}>Reset Password</SubmitButton>
          <button
            type="button"
            onClick={() => {
              setStep(1);
              setDemoOtp('');
            }}
            className="w-full text-center text-[11px] text-stone-500 hover:text-[#9B050B] cursor-pointer transition-colors flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to step 1
          </button>
        </form>
      )}
    </div>
  );
}
