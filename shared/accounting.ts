/**
 * Resolves the true SHG and Bank repayment amounts from a repayment record,
 * ensuring safe backward compatibility with older database rows.
 * 
 * Older repayments only had the 'amount' field. Drizzle sets shgAmount and bankAmount to 0 by default.
 * If shgAmount and bankAmount are both exactly 0, it means it's an old record.
 * 
 * @param repayment - A loan repayment object from the database
 * @returns { shgAmount: number, bankAmount: number } 
 */
export function resolveRepaymentAmounts(repayment: any): { shgAmount: number; bankAmount: number } {
  // If both are strictly 0 (or falsy) but amount exists, it's a legacy repayment
  if (!repayment.shgAmount && !repayment.bankAmount && repayment.amount) {
    return {
      shgAmount: repayment.amount,
      bankAmount: 0
    };
  }

  // Otherwise, use the explicit split amounts
  return {
    shgAmount: repayment.shgAmount || 0,
    bankAmount: repayment.bankAmount || 0
  };
}

/**
 * Calculates the total expected SHG principal + interest for a loan
 */
export function calculateShgTotal(loan: any): number {
  const principal = loan.amount || 0;
  const interestRate = loan.interest || 0;
  const duration = loan.duration || 0;
  return principal + Math.round(principal * (interestRate / 100) * duration);
}

/**
 * Calculates the total expected Bank principal + interest for a loan
 */
export function calculateBankTotal(loan: any): number {
  if (!loan.hasBankLoan) return 0;
  const principal = loan.bankLoanAmount || 0;
  const interestRate = loan.bankInterestRate || 0;
  const duration = loan.bankDuration || 0;
  return principal + Math.round(principal * (interestRate / 100) * duration);
}

/**
 * Calculates the Equated Monthly Installment (EMI) for the SHG portion of a loan
 */
export function calculateShgEmi(loan: any): number {
  if (!loan.duration || loan.duration <= 0) return 0;
  return Math.round(calculateShgTotal(loan) / loan.duration);
}

/**
 * Calculates the Equated Monthly Installment (EMI) for the Bank portion of a loan
 */
export function calculateBankEmi(loan: any): number {
  if (!loan.hasBankLoan || !loan.bankDuration || loan.bankDuration <= 0) return 0;
  return Math.round(calculateBankTotal(loan) / loan.bankDuration);
}
