'use server';

import { db } from '@/prisma/db';

export async function getSystemSettings() {
  try {
    let settings = await db.systemSettings.findFirst();
    if (!settings) {
      // Seed default settings on first load
      settings = await db.systemSettings.create({
        data: {
          deliveryFeeInsideDhaka: 60,
          deliveryFeeOutsideDhaka: 120,
          freeShippingMinSpend: 3000,
          adminBkashNumber: '01700000000'
        }
      });
    }
    return { success: true, settings };
  } catch (error: any) {
    console.error('getSystemSettings error:', error);
    return { success: false, error: error.message };
  }
}

export async function updateSystemSettings(data: {
  deliveryFeeInsideDhaka: number;
  deliveryFeeOutsideDhaka: number;
  freeShippingMinSpend: number;
  adminBkashNumber: string;
}) {
  try {
    const existing = await db.systemSettings.findFirst();
    let settings;
    if (existing) {
      settings = await db.systemSettings.update({
        where: { id: existing.id },
        data
      });
    } else {
      settings = await db.systemSettings.create({
        data
      });
    }
    return { success: true, settings };
  } catch (error: any) {
    console.error('updateSystemSettings error:', error);
    return { success: false, error: error.message };
  }
}
