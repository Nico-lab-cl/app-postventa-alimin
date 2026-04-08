
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lots = await prisma.lot.findMany({
    where: {
      stage: 1,
      status: 'sold',
      reservations: {
        none: {
          buyer_id: { not: null }
        }
      }
    },
    include: {
      reservations: true
    }
  });

  console.log(JSON.stringify(lots, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
