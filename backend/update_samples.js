const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateData() {
  const parts = {
    "Tavan": { status: "Orijinal", imageUrl: "assets/samples/roof.png" },
    "Ön Kaput": { status: "Değişen", imageUrl: "assets/samples/hood.png" },
    "Sol Ön Çamurluk": { status: "Boyalı", imageUrl: "assets/samples/bumper.png" },
    "Sol Ön Kapı": { status: "Orijinal", imageUrl: "assets/samples/door.png" },
    "Bagaj Kapağı": { status: "Orijinal", imageUrl: "assets/samples/trunk.png" },
    "Ön Tampon": { status: "Orijinal", imageUrl: "assets/samples/bumper.png" },
    "Ara Tampon": { status: "Orijinal", imageUrl: "assets/samples/bumper.png" }
  };

  try {
    // 1. Update all requests with dummy plate/chassis if missing
    const requests = await prisma.expertiseRequest.findMany();
    for (const req of requests) {
        await prisma.expertiseRequest.update({
            where: { id: req.id },
            data: {
                plate: req.plate || `34-${req.id % 900 + 100}-ABC`,
                chassisNumber: req.chassisNumber || `WBA1234567890${req.id % 9 + 100}`
            }
        });
    }
    console.log(`Updated ${requests.length} requests with specific plates and chassis numbers.`);

    // 2. Update all reports with the parts list
    const updatedReports = await prisma.report.updateMany({
      data: {
        vehicleParts: JSON.stringify(parts)
      }
    });
    console.log(`Updated ${updatedReports.count} reports with FULL parts list.`);

  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

updateData();
