import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ select: { email: true, role: true } });
  users.forEach(u => console.log(`${u.email} - ${u.role}`));
}

main().finally(() => prisma.$disconnect());
