import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Date formatting utilities
export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Currency formatting
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

// Calculate days between dates
export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = Math.abs(end.getTime() - start.getTime())
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Validate email
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Generate unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Calculate payroll
export function calculatePayroll(
  hours: number,
  hourlyRate: number,
  leadsBonus: number = 0,
  spifs: number = 0
) {
  const basePay = hours * hourlyRate
  const totalGross = basePay + leadsBonus + spifs
  
  return {
    basePay,
    leadsBonus,
    spifs,
    totalGross,
    netPay: totalGross // No deductions for now
  }
}

// Check if date is within pay period
export function isWithinPayPeriod(
  date: string,
  periodStart: string,
  periodEnd: string
): boolean {
  const checkDate = new Date(date)
  const start = new Date(periodStart)
  const end = new Date(periodEnd)
  
  return checkDate >= start && checkDate <= end
}