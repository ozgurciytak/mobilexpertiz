import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findUnique({ where: { email: 'user@test.com' } });
  if (!user) return console.log('User not found');
  const match = await bcrypt.compare('123456', user.password);
  console.log('Password match:', match);
}
test().finally(() => prisma.$disconnect());
