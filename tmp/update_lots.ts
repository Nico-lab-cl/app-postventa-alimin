
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Update Lote 15
  await prisma.reservation.updateMany({
    where: { lot: { number: '15' } },
    data: { pie_status: 'PAID' }
  });
  console.log('Lote 15 updated to PAID');

  // Update Lote 28
  await prisma.reservation.updateMany({
    where: { lot: { number: '28' } },
    data: { pie_status: 'PAID' }
  });
  console.log('Lote 28 updated to PAID');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
