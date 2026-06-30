export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description: string;
  date: string; // ISO format
}

export interface SavingsBank {
  id: string;
  name: string;
  color: string; // Tailwind bg color class
  textLight: boolean; // text readability on dark color
  balance: number;
  annualYield: number; // e.g. 13%
  accruedInterest: number; // accumulated interest in cents/pesos
  logoName: string; // custom representation
}

export interface ScheduledPayment {
  id: string;
  title: string;
  amount: number;
  dueDate: string; // YYYY-MM-DD
  category: string;
  isPaid: boolean;
  recurring: 'weekly' | 'monthly' | 'once';
  endDate?: string; // YYYY-MM-DD
  durationType?: 'months' | 'days' | 'infinite';
  durationValue?: number;
}

export interface ChartDataPoint {
  date: string;
  totalBalance: number;
  savings: number;
  available: number;
}
