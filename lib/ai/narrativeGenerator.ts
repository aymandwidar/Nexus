import { generateWithGroq } from '../ai/groqClient';

export async function generateNarrative(
    data: {
        burnRate: number;
        totalExpenses: number;
        totalIncome: number;
        topCategories: Array<{ category: string; amount: number }>;
        anomalies?: string[];
    },
    period: 'daily' | 'weekly' | 'monthly' = 'weekly'
): Promise<string> {
    const prompt = `Generate a compelling financial narrative for the user's ${period} summary:

Burn Rate: ${data.burnRate.toFixed(1)}%
Total Expenses: $${data.totalExpenses.toFixed(2)}
Total Income: $${data.totalIncome.toFixed(2)}
Top Spending Categories: ${JSON.stringify(data.topCategories)}
${data.anomalies ? `Anomalies: ${data.anomalies.join(', ')}` : ''}

Create a brief, encouraging narrative (2-3 paragraphs) that:
1. Summarizes their financial performance
2. Highlights any concerning trends or wins
3. Provides actionable advice
4. Uses a friendly, supportive tone

Focus on insights, not just numbers.`;

    const systemPrompt = `You are a friendly financial coach who helps people understand their spending in plain language. 
Be encouraging but honest. Celebrate wins and gently point out areas for improvement.
Keep it conversational and actionable.`;

    return await generateWithGroq(prompt, systemPrompt);
}

export async function generateQuickWin(
    phantomSpends: Array<{ category: string; annualizedCost: number }>,
    burnRate: number
): Promise<string> {
    if (phantomSpends.length === 0) {
        return "Great job! No phantom spending detected. Keep up the good work! 🎉";
    }

    const topPhantom = phantomSpends[0];

    const prompt = `The user has a burn rate of ${burnRate.toFixed(1)}% and phantom spending in ${topPhantom.category} costing $${topPhantom.annualizedCost.toFixed(0)}/year.

Generate a quick, actionable tip (1-2 sentences) to help them save money immediately.`;

    const systemPrompt = `You are a financial coach focused on quick wins. Be specific and actionable.`;

    return await generateWithGroq(prompt, systemPrompt);
}
