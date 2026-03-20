import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const request = await prisma.expertiseRequest.findFirst({ where: { status: 'COMPLETED' } });
  if (!request) return console.log('No completed request found');
  
  await prisma.report.update({
    where: { requestId: request.id },
    data: {
      documentUrls: 'https://www.google.com,https://www.wikipedia.org'
    }
  });
  console.log('Dummy report URLs updated successfully');
}

main().finally(() => prisma.$disconnect());
