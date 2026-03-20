import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10);

  // 1. Standart Kullanıcı
  const user = await prisma.user.upsert({
    where: { email: 'user@test.com' },
    update: {},
    create: {
      email: 'user@test.com',
      name: 'Özgür Kullanıcı',
      password: hashedPassword,
      role: Role.USER,
      phone: '5551112233',
      tcNo: '11111111111',
    },
  });

  // 2. Uzman (Onaylı ve Aboneliği Aktif)
  const expert = await prisma.user.upsert({
    where: { email: 'expert@test.com' },
    update: {},
    create: {
      email: 'expert@test.com',
      name: 'Ahmet Eksper',
      password: hashedPassword,
      role: Role.EXPERT,
      phone: '5552223344',
      tcNo: '22222222222',
      isApproved: true,
      subscriptionActive: true,
      subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 gün
    },
  });

  // 3. Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'Sistem Yöneticisi',
      password: hashedPassword,
      role: Role.ADMIN,
      phone: '5553334455',
      tcNo: '33333333333',
      isApproved: true,
    },
  });

  // 4. Örnek Ekspertiz Talebi
  const request = await prisma.expertiseRequest.create({
    data: {
      title: '2020 Model Araç Kontrolü',
      description: 'Aracın boya ve kaporta kontrolü yapılması gerekiyor.',
      vehicleInfo: '34 XYZ 123 - Renault Megane',
      location: 'İstanbul/Kadıköy',
      userId: user.id,
    },
  });

  console.log({ user, expert, admin, request });
  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
