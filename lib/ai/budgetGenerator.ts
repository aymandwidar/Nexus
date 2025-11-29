import { generateStructured } from '../ai/aiOrchestrator';
import type { Transaction, Budget } from '@/types';

interface BudgetAnalysis {
    budgets: Array<{
        category: string;
        amount: number;
        historicalAverage: number;
        seasonalityFactor: number;
        reasoning: string;
    }>;
}

export async function generateHyperPersonalizedBudget(
    transactions: Transaction[],
    period: 'monthly' | 'weekly' | 'yearly' = 'monthly'
): Promise<Budget[]> {
    // Group transactions by category
    const categorySpending = groupByCategory(transactions);

    // Calculate rolling averages
    const now = new Date();
    const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 12, 1);

    const recent3Months = transactions.filter(t => t.date >= threeMonthsAgo && t.type === 'expense');
    const recent6Months = transactions.filter(t => t.date >= sixMonthsAgo && t.type === 'expense');
    const recent12Months = transactions.filter(t => t.date >= twelveMonthsAgo && t.type === 'expense');

    // Prepare data for AI analysis
    const prompt = `Analyze the following spending data and generate a hyper-personalized budget:

Category Spending (Last 3 months): ${JSON.stringify(groupByCategory(recent3Months))}
Category Spending (Last 6 months): ${JSON.stringify(groupByCategory(recent6Months))}
Category Spending (Last 12 months): ${JSON.stringify(groupByCategory(recent12Months))}

Current month: ${now.toLocaleDateString('en-US', { month: 'long' })}

Generate realistic budget recommendations for each category based on:
1. Rolling 3/6/12-month averages
2. Seasonality (e.g., higher spending in December for holidays, summer for travel)
3. Demonstrated capacity (not arbitrary limits)

Return JSON with this structure:
{
  "budgets": [
    {
      "category": "string",
      "amount": number,
      "historicalAverage": number,
      "seasonalityFactor": number (1.0 = normal, >1.0 = higher than usual),
      "reasoning": "brief explanation"
    }
  ]
}`;

    const systemPrompt = `You are a financial analyst specializing in personalized budgeting. 
Your goal is to create realistic, achievable budgets based on actual spending patterns, not arbitrary restrictions.
Consider seasonality and user capacity. Be encouraging but realistic.`;

    try {
        const analysis = await generateStructured<BudgetAnalysis>(prompt, systemPrompt);

        return analysis.budgets.map((b, index) => ({
            id: `budget-${Date.now()}-${index}`,
            category: b.category,
            amount: b.amount,
            period,
            rollover: true,
            isPersonalized: true,
            historicalAverage: b.historicalAverage,
            seasonalityFactor: b.seasonalityFactor,
        }));
    } catch (error) {
        console.error('Budget generation failed:', error);
        // Fallback: simple average-based budgets
        return generateFallbackBudgets(categorySpending, period);
    }
}

function groupByCategory(transactions: Transaction[]): Record<string, number> {
    const grouped: Record<string, number> = {};

    transactions.forEach(t => {
        if (t.type === 'expense') {
            grouped[t.category] = (grouped[t.category] || 0) + Math.abs(t.amount);
        }
    });

    return grouped;
}

function generateFallbackBudgets(
    categorySpending: Record<string, number>,
    period: 'monthly' | 'weekly' | 'yearly'
): Budget[] {
    return Object.entries(categorySpending).map(([category, total], index) => ({
        id: `budget-fallback-${Date.now()}-${index}`,
        category,
        amount: Math.round(total * 1.1), // 10% buffer
        period,
        rollover: true,
        isPersonalized: false,
    }));
}
