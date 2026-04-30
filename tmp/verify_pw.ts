import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const targetEmail = 'postventa@lomasdelmar.cl';
    const res = await pool.query('SELECT * FROM "User" WHERE LOWER(email) = $1', [targetEmail.toLowerCase()]);
    
    if (res.rows.length > 0) {
      const user = res.rows[0];
      console.log(`User found: ${user.name} (${user.email})`);
      console.log(`Hash: ${user.password}`);
      
      const passwordsToTest = ['nicolas123', 'postventa123', 'cindy.alimin2026', 'Alimin2024*'];
      for (const pw of passwordsToTest) {
        const match = bcrypt.compareSync(pw, user.password);
        console.log(`Testing password "${pw}": ${match ? 'MATCH ✅' : 'NO MATCH ❌'}`);
      }
    } else {
      console.log(`User ${targetEmail} NOT found in database.`);
    }

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

main();
