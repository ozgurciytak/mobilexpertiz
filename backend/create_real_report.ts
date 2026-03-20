import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const request = await prisma.expertiseRequest.findFirst({ where: { status: 'COMPLETED' } });
  if (!request) return console.log('No completed request found');
  
  await prisma.report.upsert({
    where: { requestId: request.id },
    update: {
      content: 'Araç detaylı olarak incelendi. Şaselerde, podyelerde ve direklerde herhangi bir işlem veya boya yoktur. Motor performansı %92 olarak ölçüldü. Şanzıman geçişleri kusursuz olup, herhangi bir sarsıntı veya vuruntu tespit edilmemiştir. Fren balataları iyi durumdadır. Lastik diş derinlikleri 6mm seviyesindedir. Araca ait hasar kaydı (TRAMER) sorgulamasında 2.500 TL tutarında düşük bir meblağ görülmüştür. Genel kondisyonu mükemmel seviyededir.',
      vehicleParts: {
        "Ön Kaput": "Orijinal",
        "Tavan": "Orijinal",
        "Sağ Ön Kapı": "Boyalı",
        "Sol Arka Çamurluk": "Boyalı",
        "Ön Panel": "Orijinal",
        "Arka Bagaj": "Orijinal",
        "Sol Ön Çamurluk": "Boyalı"
      },
      documentUrls: '/uploads/report_1.pdf' // Reset URLs
    },
    create: {
      requestId: request.id,
      expertId: request.selectedExpertId || 1,
      content: 'Araç detaylı olarak incelendi. Şaselerde, podyelerde ve direklerde herhangi bir işlem veya boya yoktur. Motor performansı %92 olarak ölçüldü. Şanzıman geçişleri kusursuz olup, herhangi bir sarsıntı veya vuruntu tespit edilmemiştir. Fren balataları iyi durumdadır. Lastik diş derinlikleri 6mm seviyesindedir. Araca ait hasar kaydı (TRAMER) sorgulamasında 2.500 TL tutarında düşük bir meblağ görülmüştür. Genel kondisyonu mükemmel seviyededir.',
      vehicleParts: {
        "Ön Kaput": "Orijinal",
        "Tavan": "Orijinal",
        "Sağ Ön Kapı": "Boyalı",
        "Sol Arka Çamurluk": "Boyalı",
        "Ön Panel": "Orijinal",
        "Arka Bagaj": "Orijinal",
        "Sol Ön Çamurluk": "Boyalı"
      },
      documentUrls: '/uploads/report_1.pdf'
    }
  });
  console.log('Real expert report created successfully');
}

main().finally(() => prisma.$disconnect());
