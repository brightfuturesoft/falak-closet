'use client';

import React from 'react';
import { User, ShieldCheck, KeyRound, ChevronLeft } from 'lucide-react';
import { Feedback } from './fields';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import type { AuthMode, FeedbackMessage, SignUpData } from '@/app/account/useAccount';

interface AuthTabsProps {
  authMode: AuthMode;
  onSwitchMode: (mode: AuthMode) => void;
  feedback: FeedbackMessage | null;
  onShowFeedback: (type: 'success' | 'error', message: string) => void;
  onSignIn: (email: string, password: string) => Promise<boolean>;
  onSignUp: (payload: SignUpData) => Promise<boolean>;
}

export function AuthTabs({
  authMode,
  onSwitchMode,
  feedback,
  onShowFeedback,
  onSignIn,
  onSignUp,
}: AuthTabsProps) {
  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Card */}
      <div className="bg-white rounded-3xl border-2 border-[#F2C76E]/80 overflow-hidden shadow-sm">
        {/* Header */}
        <div className="bg-gradient-to-br from-[#9B050B] to-[#C0392B] px-6 py-7 text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            {authMode === 'signin' && <User className="w-6 h-6 text-white" />}
            {authMode === 'signup' && <ShieldCheck className="w-6 h-6 text-white" />}
            {authMode === 'forgot' && <KeyRound className="w-6 h-6 text-white" />}
          </div>
          <h1 className="font-serif font-extrabold text-xl text-white">
            {authMode === 'signin' && 'Welcome Back'}
            {authMode === 'signup' && 'Create Account'}
            {authMode === 'forgot' && 'Reset Password'}
          </h1>
          <p className="text-white/70 text-xs mt-1">
            {authMode === 'signin' && 'Sign in to manage your orders & profile'}
            {authMode === 'signup' && 'Join Falak Closet for exclusive access'}
            {authMode === 'forgot' && 'Enter your email or phone to receive an OTP'}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {/* Feedback inside card */}
          {feedback && <Feedback type={feedback.type} message={feedback.message} />}

          {/* Render Active Form */}
          {authMode === 'signin' && (
            <SignInForm onSignIn={onSignIn} onSwitchMode={onSwitchMode} />
          )}

          {authMode === 'signup' && (
            <SignUpForm onSignUp={onSignUp} onShowFeedback={onShowFeedback} />
          )}

          {authMode === 'forgot' && (
            <ForgotPasswordForm
              onShowFeedback={onShowFeedback}
              onSuccess={() => onSwitchMode('signin')}
            />
          )}

          {/* ── Mode Switcher ── */}
          <div className="pt-2 border-t border-[#F2C76E]/40 text-center space-y-2">
            {authMode !== 'signin' && (
              <button
                type="button"
                id="switch-to-signin"
                onClick={() => onSwitchMode('signin')}
                className="flex items-center justify-center gap-1 w-full text-xs text-[#0C163A]/70 hover:text-[#9B050B] cursor-pointer transition-colors font-medium"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Already have an account? Sign In
              </button>
            )}
            {authMode !== 'signup' && (
              <p className="text-[11px] text-stone-500">
                New to Falak Closet?{' '}
                <button
                  type="button"
                  id="switch-to-signup"
                  onClick={() => onSwitchMode('signup')}
                  className="text-[#9B050B] font-bold hover:underline cursor-pointer"
                >
                  Create an account
                </button>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
