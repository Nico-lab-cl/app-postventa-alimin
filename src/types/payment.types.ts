// ==============================================
// 1. Tipos de Enums y Estados
// ==============================================

export type LotStatus = 'available' | 'reserved' | 'sold' | 'blocked';
export type PaymentScope = 'PIE' | 'INSTALLMENT' | 'OTHERS';
export type ReceiptStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type MoraStatus = 'OK' | 'UPCOMING' | 'GRACE' | 'LATE';

// ==============================================
// 2. Información del Lote y Financiera (Lógica base)
// ==============================================

export interface MobileLotFinancials {
    lotId: number;
    lotNumber: string;
    stage: number;
    areaM2: number;
    
    // Configuración de Precios del Lote
    priceTotalClp: number;
    reservationAmountClp: number;
    targetPieAmountClp: number;
    
    // Configuración de Cuotas
    totalCuotas: number;
    valorCuotaNormal: number;
    valorUltimaCuota: number;
    
    // Excepciones y Legacy (Si el cliente tiene condiciones de offline)
    isLegacy: boolean;
    legacyInstallmentRanges: LegacyRange[]; // e.g. [{ from: 1, to: 10, amount: 200000 }]
    legacyDebtStartDate: string | null;  // ISO Date
    legacyInstallmentStartDate: string | null; // ISO Date
}

export interface LegacyRange {
    from: number;
    to: number;
    amount: number;
}

// ==============================================
// 3. Estado de la Cuenta del Cliente asociado al Lote
// ==============================================

export interface MobileReservationAccount {
    reservationId: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    
    // Progreso
    pieStatus: 'PENDING' | 'PAID';
    installmentsPaid: number;
    
    // Saldos y Totales (Calculados por el backend, no por el frontend)
    totalPaidClp: number;
    pendingBalanceClp: number;
    
    // Mora y Vencimientos (Calculados dinámicamente)
    nextDueDate: string | null; // ISO Date
    moraStatus: MoraStatus;
    lateDays: number;
    penaltyAmountClp: number;
    moraFrozen: boolean; // Si es true, la app NO debe mostrar alertas rojas.
    isPromo: boolean;
    
    // Pagos Pendientes de Aprobación
    hasPendingPieReceipt: boolean;
    hasPendingInstallmentReceipt: boolean;
}

// ==============================================
// 4. Recibos / Comprobantes de Pago
// ==============================================

export interface MobileReceipt {
    receiptId: string;
    scope: PaymentScope;
    amountClp: number;
    status: ReceiptStatus;
    rejectionReason?: string;
    installmentsCount: number;
    createdAt: string; // ISO Date
    receiptUrl: string; // URL de la imagen en S3 o ruta local
}

export interface LotDetailResponse {
    success: boolean;
    financials: MobileLotFinancials;
    account: MobileReservationAccount | null;
    recentReceipts: MobileReceipt[];
}
