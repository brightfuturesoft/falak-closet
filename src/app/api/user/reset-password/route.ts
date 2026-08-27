import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/authCrypto';

// POST /api/user/reset-password
// body: { action: 'request-otp' | 'reset-password', identifier, otp?, newPassword? }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, identifier, otp, newPassword } = body;

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: 'Email or phone required' },
        { status: 400 }
      );
    }

    const query = identifier.trim();
    const isEmail = query.includes('@');

    const user = await prisma.user.findFirst({
      where: isEmail
        ? { email: query.toLowerCase() }
        : { phone: query },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found matching this email or phone number' },
        { status: 404 }
      );
    }

    // ── Step 1: Generate OTP ──────────────────────────────────────
    if (action === 'request-otp') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

      await prisma.user.update({
        where: { id: user.id },
        data: { resetOtp: generatedOtp },
      });

      return NextResponse.json({
        success: true,
        message: 'OTP generated successfully.',
        // Remove demoOtp in production and send via SMS/email instead
        // demoOtp: generatedOtp,
        demoOtp: ''
      });
    }

    // ── Step 2: Verify OTP & reset password ──────────────────────
    if (action === 'reset-password') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: 'New password must be at least 6 characters' },
          { status: 400 }
        );
      }

      if (user.resetOtp && otp !== user.resetOtp) {
        return NextResponse.json(
          { success: false, error: 'Invalid OTP code. Please try again.' },
          { status: 400 }
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordHash: hashPassword(newPassword),
          resetOtp: '',
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Password updated successfully! You can now sign in with your new password.',
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[reset-password]', error);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
