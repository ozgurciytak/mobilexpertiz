import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const request = await prisma.expertiseRequest.findFirst({ where: { status: 'COMPLETED' } });
  if (!request) {
    console.log('No completed request found');
    return;
  }
  
  await prisma.report.upsert({
    where: { requestId: request.id },
    update: {},
    create: {
      requestId: request.id,
      expertId: request.selectedExpertId || 1,
      content: 'Araç genel olarak iyi durumdadır. Şaselerde işlem yoktur. Motor performansı %90 üzerindedir.',
      vehicleParts: {
        "Ön Kaput": "Orijinal",
        "Tavan": "Orijinal",
        "Sağ Ön Kapı": "Boyalı",
        "Sol Arka Çamurluk": "Değişen"
      }
    }
  });
  console.log('Dummy report created/updated for request:', request.id);
}

main().finally(() => prisma.$disconnect());
