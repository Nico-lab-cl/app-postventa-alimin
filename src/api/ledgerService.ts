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
  total_cuotas: number;
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
  hasPendingReceipt?: boolean;
  receipts?: any[];

  // Profile Data
  marital_status?: string;
  profession?: string;
  nationality?: string;
  address_street?: string;
  address_number?: string;
  address_commune?: string;
  address_region?: string;
  advisor?: string;
  observation?: string;
  extra_paid_amount?: number;
  pending_amount?: number;
  manual_documents?: { name: string; url: string; category: string; uploadedAt: string }[];
}

export interface DashboardSummary {
  totalCollection: number;
  activeContracts: number;
  totalMora: number;
  pendingReceipts: number;
}

export interface AssignmentData {
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
  priceTotal: number;
  reservationAmount: number;
  pieAmount: number;
  piePaid: boolean;
  installmentCount: number;
  normalInstallmentValue: number;
  lastInstallmentValue: number;
  firstInstallmentDate: string;
  isPromotion: boolean;
  freezeMora: boolean;
  operationalCosts: boolean;
  exceptionalRanges: { start: number; end: number; value: number }[];
}

export interface LegacyAssignmentData {
  name: string;
  last_name: string;
  rut: string;
  email: string;
  phone: string;
  marital_status: string;
  profession: string;
  nationality: string;
  address_street: string;
  address_number: string;
  address_commune: string;
  address_region: string;
  advisor: string;
  observation: string;
  price_total_clp: number;
  reservation_amount_clp: number;
  pie: number;
  extra_paid_amount: number;
  pending_amount: number;
  cuotas: number;
  valor_cuota: number;
  last_installment_amount: number;
  legacy_installment_ranges: any[]; 
  isPiePaid: boolean;
  is_promo: boolean;
  mora_frozen: boolean;
  has_operational_expenses: boolean;
  reserva_firmada: boolean;
  compraventa_firmada: boolean;
  legacy_current_installment: number;
  legacy_installment_start_date: string;
  next_payment_date: string;
  legacy_debt_start_date: string;
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

  assignLegacyOwner: async (lotId: string, data: LegacyAssignmentData): Promise<void> => {
    await apiClient.post(`mobile/postventa/lot/${lotId}/legacy-assign`, data);
  },

  uploadDocument: async (lotId: string, doc: { name: string; category: string; fileBase64: string }): Promise<void> => {
    await apiClient.post(`mobile/postventa/lot/${lotId}/documents`, doc);
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
