'use client';

import React, { useState } from 'react';
import { ChevronLeft, ShieldCheck, KeyRound, Send, CheckCheck } from 'lucide-react';
import { InputField, PasswordInput, SubmitButton, OtpInput } from './fields';

interface ForgotPasswordFormProps {
  onShowFeedback: (type: 'success' | 'error', message: string) => void;
  onSuccess: () => void;
}

function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { n: 1, label: 'Request OTP' },
    { n: 2, label: 'Set New Password' },
  ];
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          {i > 0 && (
            <span
              className={`flex-1 h-0.5 rounded-full transition-colors ${
                step > s.n - 1 ? 'bg-[#D92670]' : 'bg-stone-200'
              }`}
            />
          )}
          <div className="flex items-center gap-1.5">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                step >= s.n
                  ? 'bg-[#D92670] text-white'
                  : 'bg-stone-100 text-stone-400 border border-stone-200'
              }`}
            >
              {step > s.n ? <CheckCheck className="w-3 h-3" /> : s.n}
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wide ${
                step >= s.n ? 'text-[#D92670]' : 'text-stone-400'
              }`}
            >
              {s.label}
            </span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export function ForgotPasswordForm({ onShowFeedback, onSuccess }: ForgotPasswordFormProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [demoOtp, setDemoOtp] = useState('');
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const copyDemoOtp = async () => {
    try {
      await navigator.clipboard.writeText(demoOtp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — user can read it manually */
    }
  };

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
    <div className="space-y-5">
      <StepIndicator step={step} />

      {/* Demo OTP hint */}
      {demoOtp && step === 2 && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-pink-50 border border-pink-200 text-xs text-pink-900">
          <ShieldCheck className="w-4 h-4 shrink-0 text-[#D92670]" />
          <span className="flex-1">
            Demo OTP (SMS/Email):{' '}
            <strong className="font-mono tracking-widest text-sm">{demoOtp}</strong>
          </span>
          <button
            type="button"
            onClick={copyDemoOtp}
            className="shrink-0 px-2.5 py-1 bg-white border border-pink-200 rounded-full text-[10px] font-bold text-[#D92670] hover:bg-pink-100 transition-colors cursor-pointer flex items-center gap-1"
          >
            {copied ? <CheckCheck className="w-3 h-3" /> : null}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}

      {step === 1 ? (
        <form id="forgot-step1-form" onSubmit={handleRequestOtp} className="space-y-4">
          <InputField
            label="Email or Phone Number"
            value={identifier}
            onChange={setIdentifier}
            placeholder="sarah@example.com or 01700000000"
            required
            disabled={isLoading}
            icon={KeyRound}
            hint="The email or phone linked to your account"
          />
          <SubmitButton loading={isLoading}>
            <Send className="w-4 h-4" /> Send OTP Code
          </SubmitButton>
        </form>
      ) : (
        <form id="forgot-step2-form" onSubmit={handleResetPassword} className="space-y-4">
          <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />
          <PasswordInput
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="Min 6 characters"
            required
            disabled={isLoading}
            icon={KeyRound}
            showStrength
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
            className="w-full text-center text-[11px] text-stone-500 hover:text-[#D92670] cursor-pointer transition-colors flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back to step 1
          </button>
        </form>
      )}
    </div>
  );
}
