import Papa from 'papaparse';
import type { Transaction } from '@/types';

export interface CSVRow {
    [key: string]: string;
}

export async function parseCSV(file: File): Promise<Transaction[]> {
    return new Promise((resolve, reject) => {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                try {
                    const transactions = results.data.map((row: any, index: number) => {
                        return normalizeTransaction(row, index, 'CSV');
                    });
                    resolve(transactions.filter(t => t !== null) as Transaction[]);
                } catch (error) {
                    reject(error);
                }
            },
            error: (error) => {
                reject(error);
            },
        });
    });
}

function normalizeTransaction(row: any, index: number, source: string): Transaction | null {
    // Try to find date field (common variations)
    const dateFields = ['date', 'Date', 'Transaction Date', 'Posted Date', 'trans_date'];
    const dateField = dateFields.find(field => row[field]);
    const dateStr = dateField ? row[dateField] : null;

    // Try to find amount field
    const amountFields = ['amount', 'Amount', 'Debit', 'Credit', 'Transaction Amount'];
    const amountField = amountFields.find(field => row[field]);
    const amountStr = amountField ? row[amountField] : null;

    // Try to find description field
    const descFields = ['description', 'Description', 'Memo', 'Details', 'Payee'];
    const descField = descFields.find(field => row[field]);
    const description = descField ? row[descField] : 'Unknown';

    if (!dateStr || !amountStr) {
        console.warn('Skipping row due to missing date or amount:', row);
        return null;
    }

    // Parse date
    let date: Date;
    try {
        date = new Date(dateStr);
        if (isNaN(date.getTime())) {
            throw new Error('Invalid date');
        }
    } catch {
        console.warn('Invalid date format:', dateStr);
        return null;
    }

    // Parse amount
    const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
    if (isNaN(amount)) {
        console.warn('Invalid amount:', amountStr);
        return null;
    }

    // Extract payee from description (simple heuristic)
    const payee = extractPayee(description);

    return {
        id: `${source}-${Date.now()}-${index}`,
        date,
        amount,
        description,
        category: 'Uncategorized', // Will be categorized by AI later
        payee,
        type: amount < 0 ? 'expense' : 'income',
        source,
    };
}

function extractPayee(description: string): string {
    // Remove common prefixes and clean up
    let payee = description
        .replace(/^(DEBIT|CREDIT|POS|ATM|CHECK|TRANSFER|PAYMENT)\s+/i, '')
        .replace(/\s+#\d+.*$/, '') // Remove transaction numbers
        .replace(/\s+\d{2}\/\d{2}.*$/, '') // Remove dates
        .trim();

    // Take first part before common separators
    const parts = payee.split(/\s+-\s+|\s+\*\s+/);
    payee = parts[0].trim();

    return payee || 'Unknown';
}

export async function parseQIF(file: File): Promise<Transaction[]> {
    const text = await file.text();
    const transactions: Transaction[] = [];

    const entries = text.split('^\n').filter(e => e.trim());

    entries.forEach((entry, index) => {
        const lines = entry.split('\n');
        let date: Date | null = null;
        let amount = 0;
        let payee = 'Unknown';
        let memo = '';

        lines.forEach(line => {
            const code = line.charAt(0);
            const value = line.substring(1).trim();

            switch (code) {
                case 'D': // Date
                    date = new Date(value);
                    break;
                case 'T': // Amount
                    amount = parseFloat(value.replace(/[^0-9.-]/g, ''));
                    break;
                case 'P': // Payee
                    payee = value;
                    break;
                case 'M': // Memo
                    memo = value;
                    break;
            }
        });

        if (date && !isNaN(amount)) {
            transactions.push({
                id: `QIF-${Date.now()}-${index}`,
                date,
                amount,
                description: memo || payee,
                category: 'Uncategorized',
                payee: extractPayee(payee),
                type: amount < 0 ? 'expense' : 'income',
                source: 'QIF',
            });
        }
    });

    return transactions;
}
