export const FIXED_DAILY_PENALTY = 10000;
export const GRACE_PERIOD_DAYS = 5;
export const PENALTY_CUTOFF_WEB = new Date('2026-03-11T00:00:00Z');

/**
 * Lógica de Vencimiento:
 * 1. Todos vencen el día 5.
 * 2. Nuevos (Web): Si compraron entre 1-5, vencen mes actual. Si > 5, mes siguiente.
 * 3. Legacy: Vence mes posterior a adquisición.
 */
export function getInstallmentDueDate(
    acquisitionDate: Date | string,
    installmentNumber: number,
    isLegacy: boolean = false
): Date {
    const base = new Date(acquisitionDate);
    const year = base.getFullYear();
    const month = base.getMonth();
    
    // El vencimiento es siempre el día 5
    const due = new Date(year, month, 5, 12, 0, 0, 0);

    if (isLegacy) {
        // Legacy: Mes + 1
        due.setMonth(due.getMonth() + installmentNumber);
    } else {
        // Web: Ventana de compra
        if (base.getDate() <= 5) {
            // Compró entre 1-5: La cuota 1 vence este mes
            due.setMonth(due.getMonth() + (installmentNumber - 1));
        } else {
            // Compró después del 5: La cuota 1 vence el mes siguiente
            due.setMonth(due.getMonth() + installmentNumber);
        }
    }
    return due;
}

export function calculateTotalInterest(
    dueDate: Date,
    isLegacy: boolean,
    paymentDate: Date = new Date(),
    moraFrozen: boolean = false
): number {
    if (moraFrozen) return 0;

    const pDate = new Date(paymentDate);
    pDate.setHours(0, 0, 0, 0);

    // El periodo de gracia son 5 días después del vencimiento
    const gracePeriodEnd = new Date(dueDate);
    gracePeriodEnd.setDate(dueDate.getDate() + 5);
    gracePeriodEnd.setHours(23, 59, 59, 999);

    if (pDate <= gracePeriodEnd) {
        return 0;
    }

    // Regla de Corte Web: Si no es legacy, las multas solo corren desde el 11 de marzo 2026
    if (!isLegacy && pDate < PENALTY_CUTOFF_WEB) {
        return 0;
    }

    // El día 1 de multa es el día 6 después del vencimiento
    const penaltyStartDate = new Date(dueDate);
    penaltyStartDate.setDate(dueDate.getDate() + 6);
    penaltyStartDate.setHours(0, 0, 0, 0);

    // Si somos web y la fecha de corte es posterior al inicio teórico de multa, 
    // la multa empieza en el cutoff.
    const actualStartDate = (!isLegacy && PENALTY_CUTOFF_WEB > penaltyStartDate) 
        ? PENALTY_CUTOFF_WEB 
        : penaltyStartDate;

    const diffTime = pDate.getTime() - actualStartDate.getTime();
    const daysLate = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (daysLate <= 0) return 0;

    return FIXED_DAILY_PENALTY * daysLate;
}

export function calcularTotalAPagar(
    cantidadCuotas: number, 
    installmentsPaid: number,
    totalCuotas: number,
    valorUltimaCuota: number,
    valorCuotaNormal: number,
    penaltyAmountClp: number,
    legacyInstallmentRanges?: { from: number; to: number; amount: number }[]
): number {
    let totalPago = 0;
    
    for (let i = 0; i < cantidadCuotas; i++) {
        const numeroCobroActual = installmentsPaid + 1 + i;
        
        // 1. Is it the very last installment?
        if (numeroCobroActual === totalCuotas) {
            totalPago += valorUltimaCuota;
            continue;
        }
        
        // 2. Did the client have an exceptional rate for this installment?
        let excepcionAplicada = false;
        if (legacyInstallmentRanges && legacyInstallmentRanges.length > 0) {
            for (const range of legacyInstallmentRanges) {
                if (numeroCobroActual >= range.from && numeroCobroActual <= range.to) {
                    totalPago += range.amount;
                    excepcionAplicada = true;
                    break;
                }
            }
        }
        
        // 3. Standard contract value
        if (!excepcionAplicada) {
            totalPago += valorCuotaNormal;
        }
    }
    
    // Add any existing penalty (calculated in the backend for the first due installment)
    totalPago += penaltyAmountClp;
    
    return totalPago;
}
