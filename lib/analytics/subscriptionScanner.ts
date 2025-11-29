import type { Transaction, Subscription } from '@/types';

export function scanSubscriptions(transactions: Transaction[]): Subscription[] {
    const subscriptions: Subscription[] = [];
    const payeeGroups: Record<string, Transaction[]> = {};

    // Group transactions by payee
    transactions.forEach(t => {
        if (t.isRecurring || isLikelySubscription(t)) {
            if (!payeeGroups[t.payee]) {
                payeeGroups[t.payee] = [];
            }
            payeeGroups[t.payee].push(t);
        }
    });

    // Analyze each group
    Object.entries(payeeGroups).forEach(([payee, txns]) => {
        if (txns.length >= 2) {
            // Calculate frequency
            const dates = txns.map(t => t.date.getTime()).sort();
            const intervals = [];
            for (let i = 1; i < dates.length; i++) {
                intervals.push(dates[i] - dates[i - 1]);
            }
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            const daysInterval = avgInterval / (1000 * 60 * 60 * 24);

            let frequency: 'monthly' | 'yearly' | 'weekly';
            if (daysInterval < 10) {
                frequency = 'weekly';
            } else if (daysInterval < 40) {
                frequency = 'monthly';
            } else {
                frequency = 'yearly';
            }

            // Calculate average amount
            const avgAmount = txns.reduce((sum, t) => sum + Math.abs(t.amount), 0) / txns.length;

            // Determine if zombie (not used recently)
            const lastTransaction = new Date(Math.max(...dates));
            const threeMonthsAgo = new Date();
            threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
            const isZombie = lastTransaction < threeMonthsAgo;

            subscriptions.push({
                id: `sub-${Date.now()}-${payee}`,
                name: payee,
                amount: avgAmount,
                frequency,
                lastUsed: lastTransaction,
                isZombie,
                cancelUrl: getCancelUrl(payee),
            });
        }
    });

    return subscriptions.sort((a, b) => b.amount - a.amount);
}

function isLikelySubscription(transaction: Transaction): boolean {
    const subscriptionKeywords = [
        'netflix', 'spotify', 'hulu', 'disney', 'prime', 'apple',
        'subscription', 'monthly', 'membership', 'premium',
        'adobe', 'microsoft', 'google', 'dropbox', 'icloud',
        'gym', 'fitness', 'insurance', 'phone', 'internet',
    ];

    const desc = transaction.description.toLowerCase();
    return subscriptionKeywords.some(keyword => desc.includes(keyword));
}

function getCancelUrl(payee: string): string | undefined {
    const cancelUrls: Record<string, string> = {
        'netflix': 'https://www.netflix.com/cancelplan',
        'spotify': 'https://www.spotify.com/account/subscription/',
        'hulu': 'https://secure.hulu.com/account',
        'disney': 'https://www.disneyplus.com/account',
        'amazon': 'https://www.amazon.com/gp/primecentral',
        'apple': 'https://support.apple.com/en-us/HT202039',
    };

    const payeeLower = payee.toLowerCase();
    for (const [key, url] of Object.entries(cancelUrls)) {
        if (payeeLower.includes(key)) {
            return url;
        }
    }

    return undefined;
}
