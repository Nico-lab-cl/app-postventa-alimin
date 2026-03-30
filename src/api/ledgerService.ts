import apiClient from './client';

export interface LedgerEntry {
  customerId: string;
  customerName: string;
  rut: string;
  phone: string;
  email: string;
  lotId: string;
  stageName: string;
  area_m2: number;
  price_total_clp: number;
  valor_cuota: number;
  pie: number;
  pie_status: 'PAID' | 'PENDING';
  installments_paid: number;
  totalPaid: number;
  totalInvested: number;
  pendingBalance: number;
  nextDueDate: string;
  lateDays: number;
  penaltyAmount: number;
  status: 'LATE' | 'GRACE' | 'UPCOMING' | 'OK';
  badges: string[]; // RES, COM, PRM, GST
}

export interface DashboardSummary {
  totalCollection: number;
  activeContracts: number;
  totalMora: number;
  pendingReceipts: number;
}

export const ledgerService = {
  getLedger: async (stage: string = 'ALL'): Promise<LedgerEntry[]> => {
    const response = await apiClient.get(`mobile/postventa/ledger?stage=${stage}`);
    return response.data;
  },

  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const response = await apiClient.get('mobile/postventa/summary');
    return response.data;
  },

  getReceipts: async (): Promise<any[]> => {
    const response = await apiClient.get('mobile/postventa/receipts');
    return response.data;
  },

  verifyReceipt: async (id: string, action: 'approve' | 'reject'): Promise<void> => {
    await apiClient.patch(`mobile/receipt/${id}`, { action });
  }
};
