import * as argon2 from 'argon2';
import { getPrisma } from './database/prisma';
import { getEnv } from '../config/env';

export async function syncAdminUser() {
  const prisma = getPrisma();
  const env = getEnv();

  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: { name: 'Administrador', slug: 'admin' },
  });

  await prisma.role.upsert({
    where: { slug: 'user' },
    update: {},
    create: { name: 'Usuário', slug: 'user' },
  });

  const adminEmail = env.ADMIN_EMAIL;

  await prisma.user.updateMany({
    where: { roleId: adminRole.id, email: { not: adminEmail }, active: true },
    data: { active: false },
  });

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });

  const passwordHash = await argon2.hash(env.ADMIN_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: env.ARGON2_MEMORY_COST,
    timeCost: env.ARGON2_TIME_COST,
    parallelism: env.ARGON2_PARALLELISM,
  });

  if (!existingAdmin) {
    await prisma.user.create({
      data: {
        name: env.ADMIN_NAME,
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
        name: env.ADMIN_NAME,
        passwordHash,
        active: true,
      },
    });
    console.log('Admin user synced:', adminEmail);
  }
}
