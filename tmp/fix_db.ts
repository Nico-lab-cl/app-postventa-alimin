import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log('Adding column pushToken to User table...');
    await pool.query('ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "pushToken" TEXT');
    console.log('Column added successfully.');

    console.log('Checking users in the table...');
    const users = await pool.query('SELECT * FROM "User"');
    console.log('Found', users.rows.length, 'users.');
    users.rows.forEach(u => {
      console.log(`- ${u.name} (${u.email}) [Role: ${u.role}]`);
    });

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
