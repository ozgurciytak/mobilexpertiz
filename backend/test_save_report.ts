import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const requestId = 1; // Existing ACCEPTED request
  const expertId = 1; // Assuming expert Ahmet Eksper is ID 1 (Check beforehand if unsure)
  
  // First, find Ahmet's ID
  const expert = await prisma.user.findFirst({ where: { role: 'EXPERT' } });
  if (!expert) {
      console.log('No expert found');
      return;
  }

  // Create or Update Report
  const report = await prisma.report.upsert({
    where: { requestId: requestId },
    update: {
      content: 'Test content updated',
      vehicleParts: { 'Test Part': 'Orijinal' },
      documentUrls: 'http://test.com'
    },
    create: {
      requestId: requestId,
      expertId: expert.id,
      content: 'Test content created',
      vehicleParts: { 'Test Part': 'Orijinal' },
      documentUrls: 'http://test.com'
    }
  });

  console.log('Report upserted:', report);
  
  // Update request status
  await prisma.expertiseRequest.update({
      where: { id: requestId },
      data: { status: 'COMPLETED' }
  });
  console.log('Request status updated to COMPLETED');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
