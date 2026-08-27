'use client';

/**
 * fields.tsx — shared form primitives for the account area.
 * Unified brand palette: #D92670 (primary) · #C2185B (hover) · #0C163A (ink).
 */

import React, { useId, useState } from 'react';
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';

/* ─────────────────────────── Feedback banner ─────────────────────────── */

export function Feedback({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs font-medium border animate-fade-in ${
        type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-rose-50 border-rose-200 text-rose-700'
      }`}
    >
      {type === 'success' ? (
        <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
      ) : (
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
      )}
      <span>{message}</span>
    </div>
  );
}

/* ─────────────────────────── Text input ─────────────────────────── */

export function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required,
  disabled,
  icon: Icon,
  hint,
  maxLength,
  inputMode,
  autoComplete,
  className = '',
  rightElement,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  hint?: string;
  maxLength?: number;
  inputMode?: 'numeric' | 'tel' | 'text' | 'email';
  autoComplete?: string;
  className?: string;
  rightElement?: React.ReactNode;
}) {
  const fieldId = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-[11px] font-bold uppercase tracking-wide text-stone-500">
        {label}
        {required && <span className="text-[#D92670] ml-0.5" aria-hidden="true">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
        )}
        <input
          id={fieldId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          maxLength={maxLength}
          inputMode={inputMode}
          autoComplete={autoComplete}
          className={`w-full min-h-[44px] px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-[#0C163A] text-sm
                     placeholder:text-stone-500 focus:outline-none focus:ring-2 focus:ring-[#D92670]/20
                     focus:border-[#D92670] hover:border-stone-300 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-all ${Icon ? 'pl-10' : ''} ${rightElement ? 'pr-10' : ''} ${className}`}
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-3 flex items-center">{rightElement}</div>
        )}
      </div>
      {hint && <p className="text-[10px] text-stone-500 pl-1">{hint}</p>}
    </div>
  );
}

/* ─────────────────────────── OTP input ─────────────────────────── */

export function OtpInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const otpId = useId();
  return (
    <div className="space-y-1.5">
      <label htmlFor={otpId} className="block text-[11px] font-bold uppercase tracking-wide text-stone-500">
        OTP Code <span className="text-[#D92670] ml-0.5" aria-hidden="true">*</span>
      </label>
      <input
        id={otpId}
        type="text"
        aria-label="6-digit OTP code"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
        placeholder="••••••"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        disabled={disabled}
        className="w-full min-h-[52px] px-4 py-2.5 bg-white border border-stone-200 rounded-xl text-[#0C163A]
                   text-lg font-mono font-bold tracking-[0.5em] text-center placeholder:tracking-[0.5em]
                   placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-[#D92670]/20
                   focus:border-[#D92670] hover:border-stone-300 disabled:opacity-50 transition-all"
      />
      <p className="text-[10px] text-stone-500 pl-1">Enter the 6-digit code we sent you</p>
    </div>
  );
}

/* ─────────────────────────── Password input ─────────────────────────── */

function scorePassword(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[0-9]/.test(pw) && /[a-zA-Z]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return Math.min(score, 4);
}

const STRENGTH_LABELS = ['Too short', 'Weak', 'Okay', 'Good', 'Strong'];
const STRENGTH_COLORS = ['bg-stone-200', 'bg-rose-400', 'bg-amber-400', 'bg-sky-400', 'bg-emerald-500'];
const STRENGTH_TEXT = ['text-stone-500', 'text-rose-600', 'text-amber-600', 'text-sky-600', 'text-emerald-600'];

export function PasswordInput({
  label,
  value,
  onChange,
  placeholder,
  required,
  disabled,
  icon,
  showStrength = false,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  icon?: LucideIcon;
  showStrength?: boolean;
  autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const score = scorePassword(value);

  return (
    <div className="space-y-1.5">
      <InputField
        label={label}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder ?? '••••••••'}
        required={required}
        disabled={disabled}
        icon={icon}
        autoComplete={autoComplete ?? (show ? 'off' : 'current-password')}
        rightElement={
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="text-stone-500 hover:text-[#D92670] transition-colors cursor-pointer"
            tabIndex={-1}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />
      {showStrength && value.length > 0 && (
        <div className="flex items-center gap-2 pl-1 animate-fade-in">
          <div className="flex gap-1 flex-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < score ? STRENGTH_COLORS[score] : 'bg-stone-200'
                }`}
              />
            ))}
          </div>
          <span className={`text-[10px] font-bold ${STRENGTH_TEXT[score]}`}>{STRENGTH_LABELS[score]}</span>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────── Select ─────────────────────────── */

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold uppercase tracking-wide text-stone-500">
        {label}
        {required && <span className="text-[#D92670] ml-0.5">*</span>}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-full min-h-[44px] px-4 py-2.5 pr-10 bg-white border border-stone-200 rounded-xl text-[#0C163A]
                     text-sm focus:outline-none focus:ring-2 focus:ring-[#D92670]/20 focus:border-[#D92670]
                     hover:border-stone-300 disabled:opacity-50 appearance-none cursor-pointer transition-all"
        >
          {options.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
      </div>
    </div>
  );
}

/* ─────────────────────────── Submit button ─────────────────────────── */

export function SubmitButton({
  loading,
  children,
  disabled,
}: {
  loading?: boolean;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full min-h-[46px] py-3 bg-[#D92670] hover:bg-[#C2185B] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed
                 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md shadow-[#D92670]/25
                 transition-all flex items-center justify-center gap-2 cursor-pointer"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
