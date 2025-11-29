import { generateStructured } from '../ai/aiOrchestrator';
import type { Transaction, Forecast } from '@/types';

interface ForecastAnalysis {
    forecasts: Array<{
        date: string;
        projectedBalance: number;
        confidence: number;
        factors: string[];
    }>;
    alerts: Array<{
        date: string;
        type: string;
        message: string;
    }>;
}

export async function generateCashFlowForecast(
    transactions: Transaction[],
    currentBalance: number,
    months: 3 | 6 | 12 = 3
): Promise<{ forecasts: Forecast[]; alerts: string[] }> {
    // Calculate historical patterns
    const monthlyIncome = calculateAverageIncome(transactions);
    const monthlyExpenses = calculateAverageExpenses(transactions);
    const recurringTransactions = identifyRecurring(transactions);

    // Prepare data for AI forecasting
    const prompt = `Generate a ${months}-month cash flow forecast based on the following data:

Current Balance: $${currentBalance.toFixed(2)}
Average Monthly Income: $${monthlyIncome.toFixed(2)}
Average Monthly Expenses: $${monthlyExpenses.toFixed(2)}
Recurring Transactions: ${JSON.stringify(recurringTransactions)}

Historical Transactions (last 12 months): ${JSON.stringify(
        transactions.slice(-50).map(t => ({
            date: t.date.toISOString().split('T')[0],
            amount: t.amount,
            type: t.type,
            category: t.category,
        }))
    )}

Generate a ${months}-month forecast with:
1. Projected balance for each month
2. Confidence level (0-1) based on pattern consistency
3. Key factors affecting the forecast
4. Alerts for any projected overdrafts or concerning trends

Return JSON:
{
  "forecasts": [
    {
      "date": "YYYY-MM-DD",
      "projectedBalance": number,
      "confidence": number,
      "factors": ["factor1", "factor2"]
    }
  ],
  "alerts": [
    {
      "date": "YYYY-MM-DD",
      "type": "overdraft|warning|info",
      "message": "string"
    }
  ]
}`;

    const systemPrompt = `You are a financial forecasting expert using time-series analysis.
Consider income patterns, expense trends, seasonality, and recurring transactions.
Be conservative in projections and highlight risks proactively.`;

    try {
        const analysis = await generateStructured<ForecastAnalysis>(prompt, systemPrompt);

        const forecasts: Forecast[] = analysis.forecasts.map(f => ({
            date: new Date(f.date),
            projectedBalance: f.projectedBalance,
            confidence: f.confidence,
            factors: f.factors,
        }));

        const alerts = analysis.alerts.map(a =>
            `${new Date(a.date).toLocaleDateString()}: ${a.message}`
        );

        return { forecasts, alerts };
    } catch (error) {
        console.error('Forecast generation failed:', error);
        return generateFallbackForecast(currentBalance, monthlyIncome, monthlyExpenses, months);
    }
}

function calculateAverageIncome(transactions: Transaction[]): number {
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    if (incomeTransactions.length === 0) return 0;

    const total = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const months = getMonthSpan(incomeTransactions);

    return months > 0 ? total / months : total;
}

function calculateAverageExpenses(transactions: Transaction[]): number {
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    if (expenseTransactions.length === 0) return 0;

    const total = expenseTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const months = getMonthSpan(expenseTransactions);

    return months > 0 ? total / months : total;
}

function getMonthSpan(transactions: Transaction[]): number {
    if (transactions.length === 0) return 0;

    const dates = transactions.map(t => t.date.getTime());
    const earliest = Math.min(...dates);
    const latest = Math.max(...dates);

    const diffMonths = (latest - earliest) / (1000 * 60 * 60 * 24 * 30);
    return Math.max(1, Math.round(diffMonths));
}

function identifyRecurring(transactions: Transaction[]): any[] {
    // Simple heuristic: find transactions with same payee and similar amounts
    const payeeGroups: Record<string, Transaction[]> = {};

    transactions.forEach(t => {
        if (!payeeGroups[t.payee]) {
            payeeGroups[t.payee] = [];
        }
        payeeGroups[t.payee].push(t);
    });

    const recurring: any[] = [];

    Object.entries(payeeGroups).forEach(([payee, txns]) => {
        if (txns.length >= 3) {
            const avgAmount = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0) / txns.length;
            recurring.push({
                payee,
                averageAmount: avgAmount,
                frequency: txns.length,
            });
        }
    });

    return recurring;
}

function generateFallbackForecast(
    currentBalance: number,
    monthlyIncome: number,
    monthlyExpenses: number,
    months: number
): { forecasts: Forecast[]; alerts: string[] } {
    const forecasts: Forecast[] = [];
    const alerts: string[] = [];
    let balance = currentBalance;

    for (let i = 1; i <= months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);

        balance = balance + monthlyIncome - monthlyExpenses;

        forecasts.push({
            date,
            projectedBalance: balance,
            confidence: 0.6,
            factors: ['Historical average income', 'Historical average expenses'],
        });

        if (balance < 0) {
            alerts.push(`${date.toLocaleDateString()}: Projected overdraft of $${Math.abs(balance).toFixed(2)}`);
        }
    }

    return { forecasts, alerts };
}
