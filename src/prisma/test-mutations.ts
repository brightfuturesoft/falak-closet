import { db } from './db';

async function main() {
  try {
    console.log("Deleting users...");
    await db.user.deleteMany({
      where: { email: 'test@example.com' }
    });

    console.log("Creating user...");
    await db.user.create({
      data: {
        email: 'test@example.com',
        phone: '1234567890',
        name: 'Test User',
        district: 'Dhaka',
        fullAddress: 'Test Address',
        passwordHash: 'hash',
        resetOtp: '1234',
        cart: [],
        wishlist: [],
        ip: '127.0.0.1',
        isBlocked: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    console.log("Created user successfully!");
  } catch (error: any) {
    console.error("Mutation failed!", error);
  } finally {
    await db.$disconnect();
  }
}

main().catch(console.error);
