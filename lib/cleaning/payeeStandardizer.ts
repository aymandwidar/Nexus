import type { Transaction } from '@/types';

export function cleanPayeeNames(transactions: Transaction[]): Transaction[] {
    const payeeGroups: Record<string, Transaction[]> = {};

    // Group similar payees
    transactions.forEach(t => {
        const normalized = normalizePayeeName(t.payee);
        if (!payeeGroups[normalized]) {
            payeeGroups[normalized] = [];
        }
        payeeGroups[normalized].push(t);
    });

    // Update all transactions with canonical payee name
    const cleanedTransactions: Transaction[] = [];

    Object.entries(payeeGroups).forEach(([canonicalName, txns]) => {
        txns.forEach(t => {
            cleanedTransactions.push({
                ...t,
                payee: canonicalName,
            });
        });
    });

    return cleanedTransactions;
}

function normalizePayeeName(payee: string): string {
    // Remove common suffixes and prefixes
    let normalized = payee
        .toUpperCase()
        .replace(/\s+#\d+.*$/, '') // Remove location numbers
        .replace(/\s+\d{3,}.*$/, '') // Remove long numbers
        .replace(/^(POS|ATM|DEBIT|CREDIT|PAYMENT|TRANSFER)\s+/i, '')
        .trim();

    // Remove common business suffixes
    normalized = normalized
        .replace(/\s+(INC|LLC|LTD|CORP|CO|CORPORATION)\.?$/i, '')
        .replace(/\s+STORE$/i, '')
        .trim();

    // Handle common chains
    const chains: Record<string, string> = {
        'STARBUCKS': 'Starbucks',
        'WALMART': 'Walmart',
        'TARGET': 'Target',
        'AMAZON': 'Amazon',
        'MCDONALDS': 'McDonald\'s',
        'SHELL': 'Shell',
        'CHEVRON': 'Chevron',
        'COSTCO': 'Costco',
        'WHOLE FOODS': 'Whole Foods',
        'TRADER JOE': 'Trader Joe\'s',
    };

    for (const [key, value] of Object.entries(chains)) {
        if (normalized.includes(key)) {
            return value;
        }
    }

    // Capitalize properly
    return normalized
        .split(' ')
        .map(word => word.charAt(0) + word.slice(1).toLowerCase())
        .join(' ');
}

export function deduplicateTransactions(transactions: Transaction[]): Transaction[] {
    const seen = new Set<string>();
    const deduplicated: Transaction[] = [];

    transactions.forEach(t => {
        // Create a unique key based on date, amount, and payee
        const key = `${t.date.toISOString().split('T')[0]}-${t.amount}-${t.payee}`;

        if (!seen.has(key)) {
            seen.add(key);
            deduplicated.push(t);
        }
    });

    return deduplicated;
}
