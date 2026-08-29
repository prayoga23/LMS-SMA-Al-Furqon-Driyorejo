import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with role users only...');

  // Clean existing data
  await prisma.teacherAttendance.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.academicInformation.deleteMany({});
  await prisma.allowance.deleteMany({});
  await prisma.grade.deleteMany({});
  await prisma.attendance.deleteMany({});
  await prisma.payment.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.parents.deleteMany({});
  await prisma.user.deleteMany({});

  const defaultPassword = await bcrypt.hash('password123', 10);

  // 1. Admin User
  await prisma.user.create({
    data: {
      name: 'Administrator Sekolah',
      email: 'admin@sekolah.sch.id',
      password: defaultPassword,
      role: 'admin',
    },
  });

  // 2. Guru User
  await prisma.user.create({
    data: {
      name: 'Drs. H. Ahmad Wijaya, M.Pd',
      email: 'guru@sekolah.sch.id',
      password: defaultPassword,
      role: 'guru',
    },
  });

  // 3. Staff User
  await prisma.user.create({
    data: {
      name: 'Siti Rahmawati, S.Kom',
      email: 'staff@sekolah.sch.id',
      password: defaultPassword,
      role: 'staff',
    },
  });

  // 4. Parent User
  await prisma.user.create({
    data: {
      name: 'Budi Santoso',
      email: 'orangtua@sekolah.sch.id',
      password: defaultPassword,
      role: 'parent',
      parent: {
        create: {
          phone: '081234567890',
        },
      },
    },
  });

  console.log('Seeding completed successfully! Role users for login created.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

