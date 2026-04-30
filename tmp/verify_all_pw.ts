import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const emails = ['admin@lomasdelmar.cl', 'postventa@lomasdelmar.cl', 'postventa@libertadyalegria.cl'];
    
    for (const email of emails) {
      const res = await pool.query('SELECT * FROM "User" WHERE LOWER(email) = $1', [email.toLowerCase()]);
      if (res.rows.length > 0) {
        const user = res.rows[0];
        console.log(`\nUser found: ${user.name} (${user.email})`);
        const passwordsToTest = ['nicolas123', 'postventa123', 'cindy.alimin2026', 'denisse.alimin2026'];
        for (const pw of passwordsToTest) {
          const match = bcrypt.compareSync(pw, user.password);
          if (match) console.log(`  Password "${pw}": MATCH ✅`);
        }
      } else {
        console.log(`\nUser ${email} NOT found.`);
      }
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
