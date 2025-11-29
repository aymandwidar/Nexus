import type { Transaction, BurnRate, SavingsVelocity, PhantomSpend } from '@/types';

export function calculateBurnRate(
    transactions: Transaction[],
    monthlyIncome?: number
): BurnRate {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const recentTransactions = transactions.filter(t => t.date >= oneMonthAgo);

    const expenses = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const income = monthlyIncome || recentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    // Identify debt payments (simplified - look for loan/credit keywords)
    const debtPayments = recentTransactions
        .filter(t =>
            t.type === 'expense' &&
            (t.description.toLowerCase().includes('loan') ||
                t.description.toLowerCase().includes('credit') ||
                t.description.toLowerCase().includes('mortgage'))
        )
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const percentage = income > 0 ? ((expenses - debtPayments) / income) * 100 : 0;

    let status: 'healthy' | 'warning' | 'critical';
    if (percentage < 60) {
        status = 'healthy';
    } else if (percentage < 80) {
        status = 'warning';
    } else {
        status = 'critical';
    }

    return {
        percentage,
        status,
        monthlyExpenses: expenses,
        monthlyIncome: income,
        debtPayments,
    };
}

export function calculateSavingsVelocity(
    currentNetWorth: number,
    previousNetWorth: number
): SavingsVelocity {
    const change = currentNetWorth - previousNetWorth;
    const percentage = previousNetWorth !== 0
        ? (change / Math.abs(previousNetWorth)) * 100
        : 0;

    let trend: 'increasing' | 'decreasing' | 'stable';
    if (percentage > 2) {
        trend = 'increasing';
    } else if (percentage < -2) {
        trend = 'decreasing';
    } else {
        trend = 'stable';
    }

    return {
        percentage,
        trend,
        netWorthChange: change,
    };
}

export function detectPhantomSpend(transactions: Transaction[]): PhantomSpend[] {
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const recentExpenses = transactions.filter(
        t => t.type === 'expense' && t.date >= oneMonthAgo
    );

    // Group by payee and filter for high-frequency, low-value
    const payeeGroups: Record<string, Transaction[]> = {};

    recentExpenses.forEach(t => {
        if (Math.abs(t.amount) < 15) { // Low-value threshold
            if (!payeeGroups[t.payee]) {
                payeeGroups[t.payee] = [];
            }
            payeeGroups[t.payee].push(t);
        }
    });

    const phantomSpends: PhantomSpend[] = [];

    Object.entries(payeeGroups).forEach(([payee, txns]) => {
        if (txns.length >= 10) { // High-frequency threshold
            const totalMonthly = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0);
            const averageAmount = totalMonthly / txns.length;
            const annualizedCost = totalMonthly * 12;

            phantomSpends.push({
                category: txns[0].category,
                frequency: txns.length,
                averageAmount,
                totalMonthly,
                annualizedCost,
                examples: txns.slice(0, 5),
            });
        }
    });

    // Sort by annualized cost descending
    return phantomSpends.sort((a, b) => b.annualizedCost - a.annualizedCost);
}
