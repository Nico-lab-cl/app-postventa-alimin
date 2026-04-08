
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const lots = await prisma.lot.findMany({
    where: {
      stage: 1,
      status: 'sold',
      reservations: {
        some: {
          buyer_id: { not: null }
        }
      }
    },
    include: {
      reservations: {
        where: {
          buyer_id: { not: null }
        },
        include: {
          buyer: true
        }
      }
    },
    orderBy: {
      number: 'asc'
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
