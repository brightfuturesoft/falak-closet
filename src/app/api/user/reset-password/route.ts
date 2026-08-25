import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { UserModel } from '@/models/User';
import { hashPassword } from '@/lib/authCrypto';

// Generate OTP or verify and update password
export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { action, identifier, otp, newPassword } = body;

    if (!identifier) {
      return NextResponse.json({ success: false, error: 'Email or phone required' }, { status: 400 });
    }

    const queryInput = identifier.trim();
    const filter = queryInput.includes('@') ? { email: queryInput.toLowerCase() } : { phone: queryInput };
    const user = await UserModel.findOne(filter);

    if (!user) {
      return NextResponse.json({ success: false, error: 'No account found matching this email or phone number' }, { status: 404 });
    }

    if (action === 'request-otp') {
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      user.resetOtp = generatedOtp;
      await user.save();

      return NextResponse.json({
        success: true,
        message: `Verification code generated! (Demo SMS/Email OTP: ${generatedOtp})`,
        demoOtp: generatedOtp
      });
    }

    if (action === 'reset-password') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json({ success: false, error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      if (user.resetOtp && otp !== user.resetOtp) {
        return NextResponse.json({ success: false, error: 'Invalid verification OTP code' }, { status: 400 });
      }

      user.passwordHash = hashPassword(newPassword);
      user.resetOtp = '';
      await user.save();

      return NextResponse.json({ success: true, message: 'Password updated successfully! You can now sign in with your new password.' });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}
