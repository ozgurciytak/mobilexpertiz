import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Fetching users...');
  const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
  if (users.length === 0) {
    console.log('No users found in database.');
  } else {
    users.forEach(u => console.log(`${u.id}: ${u.email} [${u.role}]`));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
