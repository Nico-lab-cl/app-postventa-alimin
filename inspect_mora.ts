import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { getInstallmentDueDate, calculateTotalInterest } from './src/lib/financials';
import 'dotenv/config';

async function main() {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const reservations = await prisma.reservation.findMany({
            where: { status: 'paid', pie_status: 'paid' },
            include: { lot: true, receipts: true }
        });

        console.log(`Analyzing ${reservations.length} Active Reservations...\n`);

        for (const res of reservations) {
            const paidCuotas = res.installments_paid || 0;
            const totalCuotas = res.lot.cuotas || 0;
            
            if (paidCuotas < totalCuotas) {
                const baseDate = res.legacy_installment_start_date || res.created_at;
                const nextDueDate = getInstallmentDueDate(baseDate, paidCuotas + 1, res.is_legacy);
                
                const penalty = calculateTotalInterest(
                    nextDueDate,
                    res.is_legacy,
                    new Date(),
                    res.mora_frozen
                );

                const hasPending = res.receipts.some(r => r.status === 'PENDING');

                if (penalty > 0) {
                    console.log(`[LATE] Client: ${res.name} ${res.last_name || ''}`);
                    console.log(`      Lot: ${res.lot.number} | Paid Cuotas: ${paidCuotas}/${totalCuotas}`);
                    console.log(`      Next Due: ${nextDueDate.toISOString().split('T')[0]}`);
                    console.log(`      Penalty: $${penalty}`);
                    console.log(`      Has Pending Receipt: ${hasPending ? 'YES' : 'NO'}`);
                    console.log(`      Frozen: ${res.mora_frozen ? 'YES' : 'NO'}\n`);
                }
            }
        }
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

main().catch(console.error);
