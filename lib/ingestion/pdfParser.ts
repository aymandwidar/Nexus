import { extractTextFromPDF } from '../ai/geminiClient';
import type { Transaction } from '@/types';

export async function parsePDFStatement(file: File): Promise<Transaction[]> {
    // Convert file to base64
    const base64 = await fileToBase64(file);

    // Use Gemini to extract transaction data
    const prompt = `Extract all transactions from this bank statement PDF. 
  
For each transaction, provide the following in JSON format:
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "amount": number (negative for expenses, positive for income),
      "description": "string",
      "payee": "string"
    }
  ]
}

Be precise with dates and amounts. If a transaction is a debit/withdrawal, make the amount negative.`;

    const result = await extractTextFromPDF(base64, prompt);

    // Parse the JSON response
    try {
        const parsed = JSON.parse(result);
        const transactions: Transaction[] = parsed.transactions.map((t: any, index: number) => ({
            id: `PDF-${Date.now()}-${index}`,
            date: new Date(t.date),
            amount: t.amount,
            description: t.description,
            category: 'Uncategorized',
            payee: t.payee || extractPayee(t.description),
            type: t.amount < 0 ? 'expense' as const : 'income' as const,
            source: 'PDF',
        }));

        return transactions;
    } catch (error) {
        console.error('Failed to parse PDF extraction result:', error);

        // Fallback: try to extract manually from text
        return extractTransactionsFromText(result);
    }
}

function extractPayee(description: string): string {
    // Remove common prefixes
    let payee = description
        .replace(/^(DEBIT|CREDIT|POS|ATM|CHECK|TRANSFER|PAYMENT)\s+/i, '')
        .replace(/\s+#\d+.*$/, '')
        .trim();

    const parts = payee.split(/\s+-\s+|\s+\*\s+/);
    return parts[0].trim() || 'Unknown';
}

function extractTransactionsFromText(text: string): Transaction[] {
    // Fallback parser for when JSON parsing fails
    const transactions: Transaction[] = [];
    const lines = text.split('\n');

    // Simple pattern matching for common bank statement formats
    const datePattern = /(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2})/;
    const amountPattern = /\$?\s*([0-9,]+\.\d{2})/;

    lines.forEach((line, index) => {
        const dateMatch = line.match(datePattern);
        const amountMatches = line.match(new RegExp(amountPattern, 'g'));

        if (dateMatch && amountMatches) {
            const date = new Date(dateMatch[1]);
            const amountStr = amountMatches[amountMatches.length - 1];
            const amount = parseFloat(amountStr.replace(/[$,]/g, ''));

            // Extract description (text between date and amount)
            const description = line
                .replace(dateMatch[0], '')
                .replace(amountStr, '')
                .trim();

            if (!isNaN(date.getTime()) && !isNaN(amount) && description) {
                transactions.push({
                    id: `PDF-fallback-${Date.now()}-${index}`,
                    date,
                    amount: -amount, // Assume expenses by default
                    description,
                    category: 'Uncategorized',
                    payee: extractPayee(description),
                    type: 'expense',
                    source: 'PDF',
                });
            }
        }
    });

    return transactions;
}

async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            resolve(reader.result as string);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
