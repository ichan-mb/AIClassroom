import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'admin@openmaic.io';
  const password = process.argv[3] || 'admin123';

  console.log(`🚀 Seeding initial admin user...`);
  console.log(`📧 Email: ${email}`);
  console.log(`🔑 Password: ${password}`);

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'ADMIN',
        password: hashedPassword,
      },
      create: {
        email,
        name: 'System Admin',
        role: 'ADMIN',
        password: hashedPassword,
      },
    });

    console.log(`✅ Admin user ${admin.email} created/updated successfully!`);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
