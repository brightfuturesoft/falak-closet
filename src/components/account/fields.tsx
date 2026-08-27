'use client';

/**
 * fields.tsx — shared form primitives for the account area.
 * Extracted 1:1 from the old monolithic AccountClient.tsx (same classes/ids).
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function Feedback({ type, message }: { type: 'success' | 'error'; message: string }) {
  return (
    <div
      className={`flex items-start gap-2.5 px-4 py-3 rounded-2xl text-xs font-medium border ${
        type === 'success'
          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}
    >
      {type === 'success'
        ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
        : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
      <span>{message}</span>
    </div>
  );
}

export function InputField({
  label, type = 'text', value, onChange, placeholder, required, disabled,
  rightElement,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  rightElement?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[11px] font-bold uppercase tracking-wide text-[#0C163A]/70">
        {label}{required && <span className="text-[#9B050B] ml-0.5">*</span>}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/70 rounded-xl text-[#0C163A] text-xs
                     placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9B050B]/25
                     focus:border-[#9B050B]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all
                     pr-10"
        />
        {rightElement && (
          <div className="absolute inset-y-0 right-3 flex items-center">{rightElement}</div>
        )}
      </div>
    </div>
  );
}

export function PasswordInput({
  label, value, onChange, placeholder, required, disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <InputField
      label={label}
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      placeholder={placeholder ?? '••••••••'}
      required={required}
      disabled={disabled}
      rightElement={
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="text-stone-400 hover:text-[#9B050B] transition-colors cursor-pointer"
          tabIndex={-1}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      }
    />
  );
}

export function SelectField({
  label, value, onChange, options, required, disabled,
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
      <label className="block text-[11px] font-bold uppercase tracking-wide text-[#0C163A]/70">
        {label}{required && <span className="text-[#9B050B] ml-0.5">*</span>}
      </label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-4 py-2.5 bg-[#FFFBF0] border border-[#F2C76E]/70 rounded-xl text-[#0C163A] text-xs focus:outline-none focus:ring-2 focus:ring-[#9B050B]/25 disabled:opacity-50"
      >
        {options.map(d => <option key={d}>{d}</option>)}
      </select>
    </div>
  );
}

export function SubmitButton({ loading, children, disabled }: { loading?: boolean; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || disabled}
      className="w-full py-3 bg-[#9B050B] hover:bg-[#B8000A] disabled:opacity-60 disabled:cursor-not-allowed
                 text-[#FFFBF0] font-bold text-xs uppercase tracking-wider rounded-full shadow-md
                 transition-all flex items-center justify-center gap-2 cursor-pointer"
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}
