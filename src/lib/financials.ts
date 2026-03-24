
export const PENALTY_RATE_200M2 = 0.00027785496;  // For lots < 300m2
export const PENALTY_RATE_300M2 = 0.000227324392; // For lots >= 300m2
export const GRACE_PERIOD_DAYS = 5;

export function getInstallmentDueDate(
    acquisitionDate: Date | string,
    installmentNumber: number,
    isLegacy: boolean = false,
    customDueDay?: number | null,
    isPromo: boolean = false
): Date {
    const base = new Date(acquisitionDate);
    const dueDay = customDueDay || 5;
    const due = new Date(base.getFullYear(), base.getMonth(), dueDay, 12, 0, 0, 0);

    if (isLegacy) {
        due.setMonth(due.getMonth() + installmentNumber);
    } else {
        if (customDueDay) {
            due.setMonth(due.getMonth() + (installmentNumber - 1));
        } else {
            if (base.getDate() <= 5) {
                due.setMonth(due.getMonth() + (installmentNumber - 1));
            } else {
                due.setMonth(due.getMonth() + installmentNumber);
            }
        }
    }
    return due;
}

export function calculateDailyInterest(
    totalLotPrice: number,
    lotAreaM2: number
): number {
    const rate = lotAreaM2 >= 300 ? PENALTY_RATE_300M2 : PENALTY_RATE_200M2;
    return Math.round(totalLotPrice * rate);
}

export function calculateTotalInterest(
    totalLotPrice: number,
    lotAreaM2: number,
    dueDate: Date,
    isLegacy: boolean,
    paymentDate: Date = new Date(),
    moraFrozen: boolean = false,
    legacyDebtStartDate?: Date | string | null
): number {
    if (moraFrozen) return 0;

    const pDate = new Date(paymentDate);
    pDate.setHours(0, 0, 0, 0);

    let gDate: Date;

    if (isLegacy && legacyDebtStartDate) {
        gDate = new Date(legacyDebtStartDate);
    } else {
        const gracePeriodEnd = new Date(dueDate);
        gracePeriodEnd.setDate(dueDate.getDate() + 5);
        gracePeriodEnd.setHours(23, 59, 59, 999);
        gDate = gracePeriodEnd;

        if (pDate <= gracePeriodEnd) {
            return 0;
        }
    }
    gDate.setHours(0, 0, 0, 0);

    const diffTime = pDate.getTime() - gDate.getTime();
    const daysLate = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysLate <= 0) return 0;

    const dailyInterest = calculateDailyInterest(totalLotPrice, lotAreaM2);
    return dailyInterest * daysLate;
}
