const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function main() {
  console.log('--- Testando Conexão com o Banco de Dados (ShiftPartido) ---');
  console.log('URL:', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')); // Esconde a senha no log

  const prisma = new PrismaClient();

  try {
    await prisma.$connect();
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // Tenta uma consulta simples
    const tables = await prisma.$queryRaw`SHOW TABLES`;
    console.log('📊 Tabelas encontradas:', tables.length);
    
  } catch (e) {
    console.error('❌ Erro ao conectar ao banco de dados:');
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
