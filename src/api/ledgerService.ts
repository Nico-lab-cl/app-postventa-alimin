import apiClient from './client';

export interface LedgerEntry {
  customerId: string;
  customerName: string;
  lotId: string;
  stageName: string;
  totalPaid: number;
  pendingBalance: number;
  nextDueDate: string;
  lateDays: number;
  penaltyAmount: number;
  status: 'PAID' | 'PENDING' | 'OVERDUE';
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
