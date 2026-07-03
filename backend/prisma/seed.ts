import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';
import { loadEnv, getEnv } from '../src/config/env';

loadEnv();
const env = getEnv();

const prisma = new PrismaClient();

async function main() {
  const adminRole = await prisma.role.upsert({
    where: { slug: 'admin' },
    update: {},
    create: {
      name: 'Administrador',
      slug: 'admin',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { slug: 'user' },
    update: {},
    create: {
      name: 'Usuário',
      slug: 'user',
    },
  });

  const permissions = [
    { name: 'Criar Álbuns', slug: 'album:create' },
    { name: 'Editar Álbuns', slug: 'album:update' },
    { name: 'Excluir Álbuns', slug: 'album:delete' },
    { name: 'Listar Álbuns', slug: 'album:list' },
    { name: 'Upload Fotos', slug: 'photo:upload' },
    { name: 'Editar Fotos', slug: 'photo:update' },
    { name: 'Excluir Fotos', slug: 'photo:delete' },
    { name: 'Listar Fotos', slug: 'photo:list' },
    { name: 'Gerenciar Usuários', slug: 'user:manage' },
    { name: 'Visualizar Auditoria', slug: 'audit:view' },
    { name: 'Gerenciar Tags', slug: 'tag:manage' },
  ];

  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { slug: perm.slug },
      update: {},
      create: perm,
    });
  }

  const allPermissions = await prisma.permission.findMany();

  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: adminRole.id,
          permissionId: perm.id,
        },
      },
      update: {},
      create: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

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
    console.log('Admin user updated:', adminEmail);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
