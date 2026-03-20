import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const reports = await prisma.report.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      request: true
    }
  });

  console.log('Last 5 reports:');
  reports.forEach(r => {
    console.log(`Report ID: ${r.id}, Request ID: ${r.requestId}, Status: ${r.request.status}`);
    console.log(`Content: ${r.content.substring(0, 50)}...`);
    console.log(`Vehicle Parts: ${JSON.stringify(r.vehicleParts)}`);
    console.log(`Document URLs: ${r.documentUrls}`);
    console.log('---');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
