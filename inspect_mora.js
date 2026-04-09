require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Minimal recreation of logic
function getInstallmentDueDate(acquisitionDate, installmentNumber, isLegacy = false) {
    const base = new Date(acquisitionDate);
    const year = base.getFullYear();
    const month = base.getMonth();
    const due = new Date(year, month, 5, 12, 0, 0, 0);
    if (isLegacy) {
        due.setMonth(due.getMonth() + installmentNumber);
    } else {
        if (base.getDate() <= 5) {
            due.setMonth(due.getMonth() + (installmentNumber - 1));
        } else {
            due.setMonth(due.getMonth() + installmentNumber);
        }
    }
    return due;
}

const PENALTY_CUTOFF_WEB = new Date('2026-03-11T00:00:00Z');
const FIXED_DAILY_PENALTY = 10000;

function calculateTotalInterest(dueDate, isLegacy, paymentDate = new Date(), moraFrozen = false) {
    if (moraFrozen) return 0;
    const pDate = new Date(paymentDate);
    pDate.setHours(0, 0, 0, 0);
    const gracePeriodEnd = new Date(dueDate);
    gracePeriodEnd.setDate(dueDate.getDate() + 5);
    gracePeriodEnd.setHours(23, 59, 59, 999);
    if (pDate <= gracePeriodEnd) return 0;
    if (!isLegacy && pDate < PENALTY_CUTOFF_WEB) return 0;
    const penaltyStartDate = new Date(dueDate);
    penaltyStartDate.setDate(dueDate.getDate() + 6);
    penaltyStartDate.setHours(0, 0, 0, 0);
    const actualStartDate = (!isLegacy && PENALTY_CUTOFF_WEB > penaltyStartDate) ? PENALTY_CUTOFF_WEB : penaltyStartDate;
    const diffTime = pDate.getTime() - actualStartDate.getTime();
    const daysLate = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    if (daysLate <= 0) return 0;
    return FIXED_DAILY_PENALTY * daysLate;
}

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
