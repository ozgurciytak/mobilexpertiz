import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { role: 'EXPERT' },
    select: {
      id: true,
      name: true,
      role: true,
      subscriptionEndDate: true,
      payments: {
        where: { status: 'APPROVED' },
        orderBy: { createdAt: 'desc' },
        take: 1,
        select: { createdAt: true }
      }
    }
  });
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
