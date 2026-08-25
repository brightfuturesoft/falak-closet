import { db } from './db';

async function main() {
  const count = await db.user.count();
  console.log("Total users in database:", count);
  await db.$disconnect();
}

main().catch(console.error);
