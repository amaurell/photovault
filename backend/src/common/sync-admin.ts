import * as argon2 from 'argon2';
import { getPrisma } from './database/prisma';

export async function syncAdminUser() {
  const prisma = getPrisma();

  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: { name: 'Administrador', slug: 'admin' },
  });

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@photovault.com';

  await prisma.user.updateMany({
    where: { roleId: adminRole.id, email: { not: adminEmail }, active: true },
    data: { active: false },
  });

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  const passwordHash = await argon2.hash(process.env.ADMIN_PASSWORD || 'Admin123!', {
    type: argon2.argon2id,
    memoryCost: Number(process.env.ARGON2_MEMORY_COST) || 19456,
    timeCost: Number(process.env.ARGON2_TIME_COST) || 2,
    parallelism: Number(process.env.ARGON2_PARALLELISM) || 1,
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: process.env.ADMIN_NAME || 'Admin',
        email: adminEmail,
        passwordHash,
        roleId: adminRole.id,
      },
    });
    console.log('Admin user created:', adminEmail);
  } else {
    await prisma.user.update({
      where: { email: adminEmail },
      data: {
        name: process.env.ADMIN_NAME || 'Admin',
        passwordHash,
        active: true,
      },
    });
    console.log('Admin user synced:', adminEmail);
  }
}
