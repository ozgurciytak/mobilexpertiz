import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning sample records...');
  
  // Order matters due to foreign keys
  const reportsCount = await prisma.report.deleteMany({});
  console.log(`Deleted ${reportsCount.count} reports.`);
  
  const quotesCount = await prisma.quote.deleteMany({});
  console.log(`Deleted ${quotesCount.count} quotes.`);
  
  const requestsCount = await prisma.expertiseRequest.deleteMany({});
  console.log(`Deleted ${requestsCount.count} requests.`);
  
  console.log('Sample records cleaned successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
