'use client';

import React from 'react';
import { User, UserPlus, KeyRound, ChevronLeft, PackageCheck, Heart, Zap } from 'lucide-react';
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

const HEADER_CONTENT: Record<AuthMode, { icon: typeof User; title: string; subtitle: string }> = {
  signin: {
    icon: User,
    title: 'Welcome Back',
    subtitle: 'Sign in to manage your orders and profile',
  },
  signup: {
    icon: UserPlus,
    title: 'Create Account',
    subtitle: 'Join Falak Closet for exclusive access',
  },
  forgot: {
    icon: KeyRound,
    title: 'Reset Password',
    subtitle: 'We will send a verification code to your email or phone',
  },
};

export function AuthTabs({
  authMode,
  onSwitchMode,
  feedback,
  onShowFeedback,
  onSignIn,
  onSignUp,
}: AuthTabsProps) {
  const { icon: HeaderIcon, title, subtitle } = HEADER_CONTENT[authMode];

  return (
    <div className="max-w-md mx-auto space-y-5">
      {/* Card */}
      <div className="bg-white rounded-3xl border border-stone-200/80 overflow-hidden shadow-sm">
        {/* Brand header */}
        <div className="relative bg-gradient-to-br from-[#D92670] to-[#C2185B] px-6 py-8 text-center overflow-hidden">
          <div className="absolute -top-10 -left-10 w-36 h-36 bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-14 -right-8 w-40 h-40 bg-white/10 rounded-full pointer-events-none" />

          <div className="relative">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-3 rotate-3 shadow-inner">
              <HeaderIcon className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-serif font-extrabold text-2xl text-white">{title}</h1>
            <p className="text-white/75 text-xs mt-1.5">{subtitle}</p>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          {/* Mode switcher */}
          {authMode !== 'forgot' ? (
            <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-full" role="tablist" aria-label="Authentication mode">
              <button
                type="button"
                role="tab"
                id="switch-to-signin"
                aria-selected={authMode === 'signin'}
                onClick={() => onSwitchMode('signin')}
                className={`min-h-[38px] rounded-full text-xs font-bold transition-all cursor-pointer ${
                  authMode === 'signin'
                    ? 'bg-[#D92670] text-white shadow-md shadow-[#D92670]/25'
                    : 'text-stone-500 hover:text-[#0C163A]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                id="switch-to-signup"
                aria-selected={authMode === 'signup'}
                onClick={() => onSwitchMode('signup')}
                className={`min-h-[38px] rounded-full text-xs font-bold transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-[#D92670] text-white shadow-md shadow-[#D92670]/25'
                    : 'text-stone-500 hover:text-[#0C163A]'
                }`}
              >
                Create Account
              </button>
            </div>
          ) : (
            <button
              type="button"
              id="switch-to-signin"
              onClick={() => onSwitchMode('signin')}
              className="flex items-center gap-1 text-xs font-bold text-[#D92670] hover:text-[#C2185B] cursor-pointer transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to sign in
            </button>
          )}

          {/* Feedback inside card */}
          {feedback && <Feedback type={feedback.type} message={feedback.message} />}

          {/* Render active form */}
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
        </div>

        {/* Card footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-100 text-center">
          <p className="text-[10px] text-stone-500 leading-relaxed">
            Protected by secure encryption. By continuing you agree to our{' '}
            <a href="/terms" className="text-[#D92670] hover:underline">Terms</a> and{' '}
            <a href="/privacy" className="text-[#D92670] hover:underline">Privacy Policy</a>.
          </p>
        </div>
      </div>

      {/* Trust bullets */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: PackageCheck, label: 'Live order tracking' },
          { icon: Heart, label: 'Sync your wishlist' },
          { icon: Zap, label: 'Faster checkout' },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-1.5 px-2 py-3 bg-white border border-stone-200/70 rounded-2xl text-center"
          >
            <Icon className="w-4 h-4 text-[#D92670]" />
            <span className="text-[10px] font-semibold text-stone-500 leading-tight">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
