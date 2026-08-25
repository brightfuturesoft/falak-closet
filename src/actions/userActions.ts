'use server';

import { db } from '@/prisma/db';
import { hashPassword, verifyPassword } from '@/lib/authCrypto';

export async function getUser(params: { email?: string; phone?: string; password?: string }) {
  try {
    const { email, phone, password } = params;

    if (!email && !phone) {
      return { success: false, error: 'Email or phone required' };
    }

    const filter = email ? { email: email.toLowerCase() } : { phone: phone! };
    const user = await db.user.findFirst({ where: filter });

    if (!user) {
      return { success: true, user: null };
    }

    // Verify password if provided
    if (password && user.passwordHash) {
      const isValid = verifyPassword(password, user.passwordHash);
      if (!isValid) {
        return { success: false, error: 'Incorrect password' };
      }
    }

    return { success: true, user };
  } catch (error: any) {
    console.error('getUser Action Error:', error);
    return { success: true, user: null, source: 'offline', error: error.message };
  }
}

export async function loginUser(body: { identifier: string; password?: string }) {
  try {
    const { identifier, password } = body;
    const queryInput = (identifier || '').trim();

    if (!queryInput || !password) {
      return { success: false, error: 'Email/phone and password required' };
    }

    const filter = queryInput.includes('@')
      ? { email: queryInput.toLowerCase() }
      : { phone: queryInput };

    const user = await db.user.findFirst({ where: filter });

    if (!user) {
      return { success: false, error: 'No account found with these credentials' };
    }

    if (user.isBlocked) {
      return { success: false, error: 'This account has been blocked.' };
    }

    if (!user.passwordHash) {
      return {
        success: false,
        error: 'This account has no password set. Please use password reset (Forgot Password) to configure one.'
      };
    }

    const isValid = verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return { success: false, error: 'Incorrect password credentials' };
    }

    // Strip sensitive fields
    const safeUser = {
      name: user.name,
      email: user.email,
      phone: user.phone,
      district: user.district,
      fullAddress: user.fullAddress,
      cart: user.cart || [],
      wishlist: user.wishlist || []
    };

    return { success: true, user: safeUser };
  } catch (error: any) {
    console.error('loginUser Action Error:', error);
    return { success: false, error: error.message || 'Login failed.' };
  }
}

export async function registerOrUpdateUser(body: {
  email: string;
  phone: string;
  name: string;
  district?: string;
  fullAddress?: string;
  password?: string;
  cart?: any[];
  wishlist?: string[];
  ip?: string;
}) {
  try {
    const { email, phone, name, district, fullAddress, password, cart, wishlist, ip } = body;

    if (!email || !phone || !name) {
      return { success: false, error: 'Name, email, and phone required' };
    }

    const targetEmail = email.toLowerCase();
    const updateFields: any = {
      email: targetEmail,
      phone,
      name: name.trim(),
      district: district || 'Dhaka',
      fullAddress: fullAddress || '',
      cart: cart?.map(item => ({
        productId: item.productId,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        quantity: item.quantity || 1
      })) || [],
      wishlist: wishlist || [],
      ip: ip || '',
      isBlocked: false
    };

    if (password) {
      updateFields.passwordHash = hashPassword(password);
    }

    const existing = await db.user.findUnique({ where: { email: targetEmail } });
    let userResult;

    if (existing) {
      await db.user.update({
        where: { email: targetEmail },
        data: {
          ...updateFields,
          updatedAt: new Date()
        }
      });
      userResult = await db.user.findUnique({ where: { email: targetEmail } });
    } else {
      userResult = await db.user.create({
        data: {
          ...updateFields,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    }

    return { success: true, user: userResult };
  } catch (error: any) {
    console.error('registerOrUpdateUser Action Error:', error);
    return { success: false, error: error.message || 'Registration/Update failed.' };
  }
}

export async function syncUserCart(email: string, cartItems: any[]) {
  try {
    if (!email) return { success: false, error: 'Email required' };

    const targetEmail = email.toLowerCase();
    const user = await db.user.findUnique({ where: { email: targetEmail } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const mappedCart = cartItems.map(item => ({
      productId: item.productId,
      selectedColor: item.selectedColor,
      selectedSize: item.selectedSize,
      quantity: Number(item.quantity) || 1
    }));

    await db.user.update({
      where: { email: targetEmail },
      data: {
        cart: mappedCart,
        updatedAt: new Date()
      }
    });

    return { success: true, message: 'Cart synced successfully' };
  } catch (error: any) {
    console.error('syncUserCart Action Error:', error);
    return { success: false, error: error.message || 'Cart sync failed.' };
  }
}

export async function blockUser(email: string, isBlocked: boolean) {
  try {
    if (!email) return { success: false, error: 'Email is required' };

    const targetEmail = email.toLowerCase();
    const user = await db.user.findUnique({ where: { email: targetEmail } });
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    await db.user.update({
      where: { email: targetEmail },
      data: {
        isBlocked,
        updatedAt: new Date()
      }
    });

    return { success: true, message: `User account has been ${isBlocked ? 'blocked' : 'unblocked'}.` };
  } catch (error: any) {
    console.error('blockUser Action Error:', error);
    return { success: false, error: error.message || 'Blocking action failed.' };
  }
}
