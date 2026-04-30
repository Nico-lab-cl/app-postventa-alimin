import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  console.log('Connecting to DB:', process.env.DATABASE_URL);
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    const users = await prisma.user.findMany();
    console.log('Users found:', users.length);
    users.forEach(u => {
      console.log(`- ${u.name} (${u.email}) - Hash: ${u.password.substring(0, 10)}...`);
    });

    const targetEmail = 'postventa@lomasdelmar.cl';
    const user = await prisma.user.findUnique({ where: { email: targetEmail } });
    if (user) {
      console.log(`User ${targetEmail} exists!`);
    } else {
      console.log(`User ${targetEmail} NOT found.`);
    }
  } catch (err) {
    console.error('Error connecting to DB:', err);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
