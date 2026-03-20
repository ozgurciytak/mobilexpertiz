import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const request = await prisma.expertiseRequest.findFirst({ where: { status: 'COMPLETED' } });
  if (!request) return console.log('No completed request found');

  const VEHICLE_PARTS_LIST = [
    'Ön Kaput', 'Tavan', 'Bagaj Kapağı', 
    'Sol Ön Çamurluk', 'Sol Ön Kapı', 'Sol Arka Kapı', 'Sol Arka Çamurluk',
    'Sağ Ön Çamurluk', 'Sağ Ön Kapı', 'Sağ Arka Kapı', 'Sağ Arka Çamurluk',
    'Ön Tampon', 'Arka Tampon'
  ];

  const detailedParts = {};
  VEHICLE_PARTS_LIST.forEach(part => {
    detailedParts[part] = { 
      status: part === 'Ön Kaput' || part === 'Tavan' ? 'Orijinal' : 'Boyalı', 
      imageUrl: "/uploads/part_sample.png" 
    };
  });
  
  await prisma.report.update({
    where: { requestId: request.id },
    data: {
      content: 'Araç genel durumu çok iyi. Motor performansı %92 olarak ölçüldü. Şaselerde ve podyelerde işlem yoktur. Belirtilen parçalarda düşük mikronlu boya uygulaması yapılmıştır. Fren sistemi ve ön takım kontrolleri yapıldı, herhangi bir sorun tespit edilmedi.',
      vehicleParts: detailedParts
    }
  });

  // Also update request with plate if it was missing
  await prisma.expertiseRequest.update({
    where: { id: request.id },
    data: {
      plate: '34 ME 1234',
      chassisNumber: 'WBA5G110X0M987654'
    }
  });

  console.log('Final expert report with ALL IMAGES and FOOTER test updated successfully');
}

main().finally(() => prisma.$disconnect());
