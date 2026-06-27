import { Transaction, SavingsBank, ScheduledPayment } from '../types';

export const INITIAL_MAIN_BALANCE = 0.00; // Dinero actual disponible inicializado a 0

export const INITIAL_SAVINGS_BANKS: SavingsBank[] = [
  {
    id: 'nu',
    name: 'Nu México',
    color: 'bg-[#612F74]', // Nu purple
    textLight: true,
    balance: 0.00,
    annualYield: 13.0,
    accruedInterest: 0.00,
    logoName: 'NU'
  },
  {
    id: 'mercadopago',
    name: 'Mercado Pago',
    color: 'bg-[#009EE3]', // MP blue
    textLight: true,
    balance: 0.00,
    annualYield: 13.0,
    accruedInterest: 0.00,
    logoName: 'MP'
  },
  {
    id: 'klar',
    name: 'Klar Ahorro',
    color: 'bg-[#003824]', // Klar dark green
    textLight: true,
    balance: 0.00,
    annualYield: 13.0,
    accruedInterest: 0.00,
    logoName: 'KL'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_SCHEDULED_PAYMENTS: ScheduledPayment[] = [];

export const CATEGORIES = {
  income: ['Sueldo', 'Freelance', 'Rendimientos', 'Ventas', 'Otros Ingresos'],
  expense: ['Comida', 'Suscripciones', 'Transporte', 'Servicios', 'Entretenimiento', 'Salud', 'Educación', 'Ropa', 'Otros Gastos']
};

