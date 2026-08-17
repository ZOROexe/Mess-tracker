export type MessBillStatus = "unpaid" | "partially_paid" | "paid";

export interface MessPaymentInput {
  amount: number;
  paymentDate: string;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  notes?: string;
}

export interface CalculatedMessBill {
  periodStart: string;
  periodEnd: string;
  calculatedAmount: number;
  paidAmount: number;
  balance: number;
  status: MessBillStatus;
}
