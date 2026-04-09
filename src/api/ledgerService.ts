import apiClient from './client';
import { LotDetailResponse } from '../types/payment.types';

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
  reservation_amount: number;
  pie: number;
  pie_status: 'PAID' | 'PENDING';
  installments_paid: number;
  totalPaid: number;
  totalInvested: number;
  pendingBalance: number;
  nextDueDate: string;
  lateDays: number;
  penaltyAmount: number;
  status: 'LATE' | 'GRACE' | 'UPCOMING' | 'OK' | 'AVAILABLE';
  lotStatus: 'sold' | 'reserved' | 'available';
  badges: string[]; // RES, COM, PRM, GST
  isMoraFrozen?: boolean;
  is_legacy?: boolean;
  receipts?: any[];
}

export interface DashboardSummary {
  totalCollection: number;
  activeContracts: number;
  totalMora: number;
  pendingReceipts: number;
}

export interface AssignmentData {
  // Personal Data
  name: string;
  surname: string;
  rut: string;
  email: string;
  phone: string;
  maritalStatus: string;
  profession: string;
  nationality: string;
  address: {
    street: string;
    number: string;
    region: string;
    commune: string;
  };
  // Financials
  priceTotal: number;
  reservationAmount: number;
  pieAmount: number;
  piePaid: boolean;
  // Installments
  installmentCount: number;
  normalInstallmentValue: number;
  lastInstallmentValue: number;
  firstInstallmentDate: string;
  // Extra Logic
  isPromotion: boolean;
  freezeMora: boolean;
  operationalCosts: boolean;
  exceptionalRanges: { start: number; end: number; value: number }[];
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

  searchUsers: async (query: string): Promise<any[]> => {
    const response = await apiClient.get(`mobile/users/search?q=${query}`);
    return response.data;
  },

  assignOwner: async (lotId: string, data: AssignmentData): Promise<void> => {
    await apiClient.post(`mobile/postventa/lot/${lotId}/assign`, data);
  },

  resetLot: async (lotId: string): Promise<void> => {
    await apiClient.delete(`mobile/postventa/lot/${lotId}`);
  },

  getUserDocuments: async (userId: string): Promise<any[]> => {
    const response = await apiClient.get(`mobile/user/docs?userId=${userId}`);
    return response.data;
  },

  verifyReceipt: async (id: string, action: 'approve' | 'reject', reason?: string): Promise<void> => {
    await apiClient.patch(`mobile/receipt/${id}`, { action, reason });
  },

  getLotDetails: async (id: string): Promise<LotDetailResponse> => {
    const response = await apiClient.get(`mobile/postventa/lot-details/${id}`);
    return response.data;
  },

  uploadPaymentReceipt: async (data: {
    reservationId: string;
    lotId: string | number;
    amount: number;
    scope: string;
    installmentsCount: number;
    receiptBase64: string;
  }): Promise<{ success: boolean; receiptId: string }> => {
    const response = await apiClient.post('mobile/postventa/payments/upload', data);
    return response.data;
  },

  getUsers: async (): Promise<any[]> => {
    const response = await apiClient.get('mobile/postventa/users');
    return response.data;
  },

  resetUserPassword: async (userId: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.post(`mobile/postventa/users/${userId}/reset-password`);
    return response.data;
  }
};
