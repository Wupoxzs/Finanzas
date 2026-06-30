import { Transaction, SavingsBank, ScheduledPayment } from '../types';

export const INITIAL_MAIN_BALANCE = 0.00; // Dinero actual disponible inicializado a 0

export const INITIAL_SAVINGS_BANKS: SavingsBank[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_SCHEDULED_PAYMENTS: ScheduledPayment[] = [];

export const CATEGORIES = {
  income: ['Sueldo', 'Freelance', 'Rendimientos', 'Ventas', 'Otros Ingresos'],
  expense: ['Comida', 'Suscripciones', 'Transporte', 'Servicios', 'Entretenimiento', 'Salud', 'Educación', 'Ropa', 'Otros Gastos']
};

