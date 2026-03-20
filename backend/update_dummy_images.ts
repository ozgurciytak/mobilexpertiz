import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const request = await prisma.expertiseRequest.findFirst({ where: { status: 'COMPLETED' } });
  if (!request) return console.log('No completed request found');

  const detailedParts = {
    "Ön Kaput": { status: "Orijinal", imageUrl: "/uploads/part_sample.png" },
    "Motor Bölümü": { status: "Orijinal", imageUrl: "/uploads/part_sample.png" },
    "Sağ Ön Çamurluk": { status: "Boyalı", imageUrl: "/uploads/part_sample.png" },
    "Sol Ön Kapı": { status: "Değişen", imageUrl: "/uploads/part_sample.png" }
  };
  
  await prisma.report.update({
    where: { requestId: request.id },
    data: {
      content: 'Araç genel durumu çok iyi. Motor performansı %92 olarak ölçüldü. Şaselerde ve podyelerde işlem yoktur. Belirtilen parçalarda düşük mikronlu boya uygulaması yapılmıştır.',
      vehicleParts: detailedParts
    }
  });
  console.log('Real expert report WITH IMAGES updated successfully');
}

main().finally(() => prisma.$disconnect());
