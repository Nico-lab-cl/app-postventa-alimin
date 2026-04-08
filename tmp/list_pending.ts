
import fs from 'fs';
const data = JSON.parse(fs.readFileSync('tmp/query_results.json', 'utf8'));
const pending = data.filter((l: any) => l.reservations[0].pie_status === 'PENDING');
pending.forEach((l: any) => {
  console.log(`Lote: ${l.number}, Propietario: ${l.reservations[0].name}, RUT: ${l.reservations[0].rut}`);
});
