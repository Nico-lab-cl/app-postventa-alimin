
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const lots = await prisma.lot.findMany({
    where: {
      stage: 1,
      status: 'sold',
      reservations: {
        some: {
          pie_status: 'PAID',
          buyer_id: { not: null }
        }
      }
    },
    include: {
      reservations: true
    }
  });
  console.log(`Current Count: ${lots.length}`);
  lots.forEach(l => {
    console.log(`Lote: ${l.number}, Name: ${l.reservations[0].name}`);
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
