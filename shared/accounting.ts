/**
 * Resolves the true SHG and Bank repayment amounts from a repayment record,
 * ensuring safe backward compatibility with older database rows.
 */
export function resolveRepaymentAmounts(repayment: any): { shgAmount: number; bankAmount: number } {
  if (!repayment.shgAmount && !repayment.bankAmount && repayment.amount) {
    return { shgAmount: repayment.amount, bankAmount: 0 };
  }
  return {
    shgAmount: repayment.shgAmount || 0,
    bankAmount: repayment.bankAmount || 0
  };
}

/**
 * [LEGACY] Calculates the total expected SHG principal + interest for a flat-interest loan
 */
export function calculateShgTotal(loan: any): number {
  const principal = loan.amount || 0;
  const interestRate = loan.interest || 0;
  const duration = loan.duration || 0;
  return principal + Math.round(principal * (interestRate / 100) * duration);
}

/**
 * [LEGACY] Calculates the total expected Bank principal + interest for a flat-interest loan
 */
export function calculateBankTotal(loan: any): number {
  if (!loan.hasBankLoan) return 0;
  const principal = loan.bankLoanAmount || 0;
  const interestRate = loan.bankInterestRate || 0;
  const duration = loan.bankDuration || 0;
  return principal + Math.round(principal * (interestRate / 100) * duration);
}

/**
 * [LEGACY] Calculates the Equated Monthly Installment (EMI) for the SHG portion
 */
export function calculateShgEmi(loan: any): number {
  if (!loan.duration || loan.duration <= 0) return 0;
  return Math.round(calculateShgTotal(loan) / loan.duration);
}

/**
 * [LEGACY] Calculates the Equated Monthly Installment (EMI) for the Bank portion
 */
export function calculateBankEmi(loan: any): number {
  if (!loan.hasBankLoan || !loan.bankDuration || loan.bankDuration <= 0) return 0;
  return Math.round(calculateBankTotal(loan) / loan.bankDuration);
}

// ─────────────────────────────────────────────────────────────────────────────
// NEW REDUCING BALANCE ACCOUNTING ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export interface LedgerEntryCalculation {
  openingPrincipal: number;
  interestRateApplied: number;
  interestCharged: number;
  interestPaid: number;
  principalPaid: number;
  paymentReceived: number;
  closingPrincipal: number;
  outstandingInterest: number;
  // UI Helpers (not stored in ledger directly, but useful for preview)
  suggestedPrincipal: number;
  suggestedInstallment: number;
  totalInterestDue: number;
}

/**
 * Calculates the next ledger entry for a reducing balance loan given a payment amount.
 * 
 * Rules:
 * 1. Current Interest = Outstanding Principal × Monthly Rate
 * 2. Payment pays off Interest first, then Principal
 * 3. Suggested Principal = Outstanding ÷ Remaining Months
 * 4. Suggested Installment = Suggested Principal + Current Interest
 * 
 * @param loanSnapshot - The current state of the loan (remainingBalance, outstandingInterest)
 * @param paymentAmount - The actual amount the user is paying this month (can be 0)
 * @param monthlyRate - Monthly interest rate percentage (e.g. 2 for 2%)
 * @param remainingMonths - Number of months remaining in the duration
 * @param unpaidInterestPolicy - 'due' (default) or 'capitalize'
 */
export function calculateNextLedgerEntry(
  loanSnapshot: { remainingBalance: number; outstandingInterest: number },
  paymentAmount: number,
  monthlyRate: number,
  fixedPrincipalInstallment: number,
  unpaidInterestPolicy: 'due' | 'capitalize' = 'due'
): LedgerEntryCalculation {
  const openingPrincipal = loanSnapshot.remainingBalance;
  const previousOutstandingInterest = loanSnapshot.outstandingInterest;
  
  // 1. Current Interest = Outstanding Principal × Monthly Interest Rate
  const interestCharged = Math.round(openingPrincipal * (monthlyRate / 100));
  
  // Total interest due this month is the newly charged interest + any unpaid interest from before
  const totalInterestDue = interestCharged + previousOutstandingInterest;

  // 2. Payment Allocation: Interest before Principal
  let interestPaid = 0;
  let principalPaid = 0;

  if (paymentAmount >= totalInterestDue) {
    interestPaid = totalInterestDue;
    principalPaid = paymentAmount - totalInterestDue;
  } else {
    interestPaid = paymentAmount;
    principalPaid = 0;
  }

  // Prevent paying more principal than is owed (overpayment just counts as zeroing out principal)
  if (principalPaid > openingPrincipal) {
    principalPaid = openingPrincipal;
  }

  // 3. Calculate remaining balances
  let closingPrincipal = openingPrincipal - principalPaid;
  let newOutstandingInterest = totalInterestDue - interestPaid;

  // Apply capitalization policy if unpaid interest exists
  if (newOutstandingInterest > 0 && unpaidInterestPolicy === 'capitalize') {
    closingPrincipal += newOutstandingInterest;
    newOutstandingInterest = 0;
  }

  // 4. Calculate Suggested Installments for the UI (using current month's opening principal)
  // Suggested Principal = Outstanding ÷ Remaining Months
  const suggestedPrincipal = Math.min(fixedPrincipalInstallment, openingPrincipal);
  const suggestedInstallment = suggestedPrincipal + interestCharged + previousOutstandingInterest;

  return {
    openingPrincipal,
    interestRateApplied: monthlyRate,
    interestCharged,
    interestPaid,
    principalPaid,
    paymentReceived: paymentAmount,
    closingPrincipal,
    outstandingInterest: newOutstandingInterest,
    
    suggestedPrincipal,
    suggestedInstallment,
    totalInterestDue
  };
}


export interface LoanRecommendation {
  outstandingPrincipal: number;
  currentMonthInterest: number;
  fixedPrincipalInstallment: number;
  outstandingInterest: number;
  recommendedPrincipal: number;
  recommendedMonthlyPayment: number;
  remainingMonths: number;
}

export function getCurrentLoanRecommendation(loan: any): LoanRecommendation {
  const outstandingPrincipal = loan.remainingBalance || 0;
  const outstandingInterest = loan.outstandingInterest || 0;
  const fixedPrincipalInstallment = loan.fixedPrincipalInstallment || Math.floor((loan.amount || 0) / (loan.duration || 1));
  
  const currentMonthInterest = Math.round(outstandingPrincipal * ((loan.interest || 0) / 100));
  const recommendedPrincipal = Math.min(fixedPrincipalInstallment, outstandingPrincipal);
  const recommendedMonthlyPayment = recommendedPrincipal + currentMonthInterest + outstandingInterest;
  const remainingMonths = fixedPrincipalInstallment > 0 ? Math.ceil(outstandingPrincipal / fixedPrincipalInstallment) : 0;

  return {
    outstandingPrincipal,
    currentMonthInterest,
    fixedPrincipalInstallment,
    outstandingInterest,
    recommendedPrincipal,
    recommendedMonthlyPayment,
    remainingMonths
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DATA GOVERNANCE & FINANCIAL AGGREGATION
// ─────────────────────────────────────────────────────────────────────────────

export interface OpeningSnapshot {
  asOnDate: string | null;
  totalSavings: number;
  cashInHand: number;
  bankBalance: number;
  outstandingInternalPrincipal: number;
  outstandingBankPrincipal: number;
  interestOutstanding: number;
}

export interface GroupFinancialSummary {
  totalSavings: number;
  totalPenalties: number;
  currentBalance: number; // calculated cash + bank
  
  // Internal Loans
  totalPrincipalDisbursed: number;
  principalCollected: number;
  interestCollected: number;
  outstandingPrincipal: number;
  outstandingInterest: number;
  activeLoansCount: number;
  completedLoansCount: number;
}

/**
 * Single source of truth for group financial aggregation.
 * Merges Opening Snapshot (from Migration) with Live Transactions perfectly.
 */
export function calculateGroupFinancialSummary(
  openingSnapshot: OpeningSnapshot | null | undefined,
  payments: any[],
  loans: any[],
  repayments: any[]
): GroupFinancialSummary {
  const snapshot = openingSnapshot || {
    asOnDate: null,
    totalSavings: 0,
    cashInHand: 0,
    bankBalance: 0,
    outstandingInternalPrincipal: 0,
    outstandingBankPrincipal: 0,
    interestOutstanding: 0,
  };

  // 1. Savings & Penalties
  const liveTotalSavings = payments.filter(p => p.status === "confirmed" && p.amount > 0).reduce((sum, p) => sum + p.amount, 0);
  const liveTotalPenalties = payments.filter(p => p.status === "confirmed" && p.lateFee > 0).reduce((sum, p) => sum + p.lateFee, 0);
  
  const totalSavings = snapshot.totalSavings + liveTotalSavings;
  const totalPenalties = liveTotalPenalties; // Penalties weren't in snapshot explicitly, treated as live

  // 2. Loans
  const activeLoansCount = loans.filter(l => ["approved", "completed"].includes(l.status) && l.remainingBalance > 0).length;
  const completedLoansCount = loans.filter(l => l.status === "completed" || (l.status === "approved" && l.remainingBalance <= 0)).length;

  const approvedLoans = loans.filter(l => ["approved", "completed"].includes(l.status));
  const livePrincipalDisbursed = approvedLoans.reduce((sum, l) => sum + (l.amount || 0), 0);
  
  const livePrincipalCollected = approvedLoans.reduce((sum, l) => sum + (l.totalPrincipalPaid || 0), 0);
  const liveInterestCollected = approvedLoans.reduce((sum, l) => sum + (l.totalInterestPaid || 0), 0);
  const liveOutstandingPrincipal = approvedLoans.reduce((sum, l) => sum + (l.remainingBalance || 0), 0);
  const liveOutstandingInterest = approvedLoans.reduce((sum, l) => sum + (l.outstandingInterest || 0), 0);

  // For cash balance, we simply add all savings, penalties, and all principal + interest collected
  const legacyTotalRepayments = repayments.reduce((sum, r) => sum + resolveRepaymentAmounts(r).shgAmount, 0);
  const totalRepaymentsForCash = Math.max(legacyTotalRepayments, livePrincipalCollected + liveInterestCollected);
  
  const liveCashFlow = liveTotalSavings + liveTotalPenalties + totalRepaymentsForCash - livePrincipalDisbursed;
  const openingCashFlow = snapshot.cashInHand + snapshot.bankBalance;
  
  const currentBalance = openingCashFlow + liveCashFlow;

  // The true outstanding principal is whatever the loans table says right now! 
  // (Because during migration, snapshot loans are entered as real loans).
  // Same for interest.
  return {
    totalSavings,
    totalPenalties,
    currentBalance,
    
    totalPrincipalDisbursed: livePrincipalDisbursed, // Snapshot loans are entered as REAL loans, so their amount is included here.
    principalCollected: livePrincipalCollected,
    interestCollected: liveInterestCollected,
    outstandingPrincipal: liveOutstandingPrincipal,
    outstandingInterest: liveOutstandingInterest,
    
    activeLoansCount,
    completedLoansCount
  };
}
