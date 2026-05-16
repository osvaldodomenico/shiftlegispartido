const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  // 1. Tenant (único por name)
  const tenant = await prisma.tenants.upsert({
    where: { id: 1n },
    update: {},
    create: { name: 'Meu Partido' },
  });
  console.log(`✔ Tenant ${tenant.id === 1n ? 'já existe' : 'criado'}: ${tenant.name} (id=${tenant.id})`);

  // 2. Usuário admin (único por email)
  const userBefore = await prisma.users.findUnique({ where: { email: 'admin@teste.com' }, select: { id: true } });
  const user = await prisma.users.upsert({
    where: { email: 'admin@teste.com' },
    update: { password_hash: '$2b$10$yvS2dbHT/ErSbkZbNC9Ag.DotdQaKpe.zBYIml1N5Uz/5NfjPt9ZS' },
    create: {
      tenant_id: tenant.id,
      name: 'Admin',
      email: 'admin@teste.com',
      password_hash: '$2b$10$yvS2dbHT/ErSbkZbNC9Ag.DotdQaKpe.zBYIml1N5Uz/5NfjPt9ZS',
      status: 'active',
    },
  });
  console.log(`✔ Usuário ${userBefore ? 'já existe' : 'criado'}: ${user.email} (id=${user.id})`);

  // 3. Role admin (único por tenant_id + name)
  const roleBefore = await prisma.roles.findFirst({
    where: { tenant_id: tenant.id, name: 'admin' },
    select: { id: true },
  });
  const role = roleBefore ?? await prisma.roles.create({
    data: { tenant_id: tenant.id, name: 'admin' },
  });
  console.log(`✔ Role ${roleBefore ? 'já existe' : 'criada'}: ${role.id} (tenant=${tenant.id})`);

  // 4. Vínculo user_roles (PK composta — criar só se não existir)
  const existingLink = await prisma.user_roles.findFirst({
    where: { user_id: user.id, role_id: role.id },
  });
  if (!existingLink) {
    await prisma.user_roles.create({ data: { user_id: user.id, role_id: role.id } });
    console.log(`✔ Vínculo user_roles criado: user=${user.id} → role=${role.id}`);
  } else {
    console.log(`✔ Vínculo user_roles já existe: user=${user.id} → role=${role.id}`);
  }

  console.log('\n✅ Seed concluído com sucesso.');
}

main()
  .catch((err) => {
    console.error('❌ Erro no seed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
