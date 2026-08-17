export interface MessSpend {
  messId: string;
  messName: string;
  amount: number;
}

export interface MonthlyAnalytics {
  summary: {
    messTotal: number;
    outsideTotal: number;
    grandTotal: number;
  };
  dailySpend: Array<{ date: string; total: number }>;
  spendingByMess: MessSpend[];
  billing: {
    totalBilled: number;
    totalPaid: number;
    outstanding: number;
  };
}
