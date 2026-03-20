import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const requests = await prisma.expertiseRequest.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: {
        report: true,
        user: { select: { name: true } },
        selectedExpert: { select: { name: true } }
    }
  });

  console.log('Last 10 requests:');
  requests.forEach(r => {
    console.log(`ID: ${r.id}, Status: ${r.status}, Title: ${r.title}, Expert: ${r.selectedExpert?.name || 'None'}`);
    console.log(`Has Report: ${!!r.report}`);
    if (r.report) {
        console.log(`Report JSON: ${JSON.stringify(r.report.vehicleParts)}`);
    }
    console.log('---');
  });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
