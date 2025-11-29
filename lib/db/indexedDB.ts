import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Transaction, Budget, Goal, Subscription, UserPreferences, Alert, Challenge } from '@/types';

interface NexusDB extends DBSchema {
    transactions: {
        key: string;
        value: Transaction;
        indexes: { 'by-date': Date; 'by-category': string; 'by-payee': string };
    };
    budgets: {
        key: string;
        value: Budget;
    };
    goals: {
        key: string;
        value: Goal;
    };
    subscriptions: {
        key: string;
        value: Subscription;
    };
    alerts: {
        key: string;
        value: Alert;
        indexes: { 'by-date': Date };
    };
    challenges: {
        key: string;
        value: Challenge;
    };
    preferences: {
        key: string;
        value: UserPreferences;
    };
}

let dbInstance: IDBPDatabase<NexusDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<NexusDB>> {
    if (dbInstance) return dbInstance;

    dbInstance = await openDB<NexusDB>('nexus-db', 1, {
        upgrade(db) {
            // Transactions store
            const transactionStore = db.createObjectStore('transactions', { keyPath: 'id' });
            transactionStore.createIndex('by-date', 'date');
            transactionStore.createIndex('by-category', 'category');
            transactionStore.createIndex('by-payee', 'payee');

            // Budgets store
            db.createObjectStore('budgets', { keyPath: 'id' });

            // Goals store
            db.createObjectStore('goals', { keyPath: 'id' });

            // Subscriptions store
            db.createObjectStore('subscriptions', { keyPath: 'id' });

            // Alerts store
            const alertStore = db.createObjectStore('alerts', { keyPath: 'id' });
            alertStore.createIndex('by-date', 'createdAt');

            // Challenges store
            db.createObjectStore('challenges', { keyPath: 'id' });

            // Preferences store
            db.createObjectStore('preferences', { keyPath: 'id' });
        },
    });

    return dbInstance;
}

// === TRANSACTION OPERATIONS ===
export async function addTransaction(transaction: Transaction): Promise<void> {
    const db = await getDB();
    await db.add('transactions', transaction);
}

export async function getTransactions(limit?: number): Promise<Transaction[]> {
    const db = await getDB();
    const tx = db.transaction('transactions', 'readonly');
    const index = tx.store.index('by-date');
    const transactions = await index.getAll();

    // Sort by date descending
    transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

    return limit ? transactions.slice(0, limit) : transactions;
}

export async function getTransactionsByDateRange(start: Date, end: Date): Promise<Transaction[]> {
    const db = await getDB();
    const tx = db.transaction('transactions', 'readonly');
    const index = tx.store.index('by-date');
    const range = IDBKeyRange.bound(start, end);
    return await index.getAll(range);
}

export async function getTransactionsByCategory(category: string): Promise<Transaction[]> {
    const db = await getDB();
    const tx = db.transaction('transactions', 'readonly');
    const index = tx.store.index('by-category');
    return await index.getAll(category);
}

// === BUDGET OPERATIONS ===
export async function saveBudget(budget: Budget): Promise<void> {
    const db = await getDB();
    await db.put('budgets', budget);
}

export async function getBudgets(): Promise<Budget[]> {
    const db = await getDB();
    return await db.getAll('budgets');
}

// === GOAL OPERATIONS ===
export async function saveGoal(goal: Goal): Promise<void> {
    const db = await getDB();
    await db.put('goals', goal);
}

export async function getGoals(): Promise<Goal[]> {
    const db = await getDB();
    return await db.getAll('goals');
}

// === SUBSCRIPTION OPERATIONS ===
export async function saveSubscription(subscription: Subscription): Promise<void> {
    const db = await getDB();
    await db.put('subscriptions', subscription);
}

export async function getSubscriptions(): Promise<Subscription[]> {
    const db = await getDB();
    return await db.getAll('subscriptions');
}

// === ALERT OPERATIONS ===
export async function addAlert(alert: Alert): Promise<void> {
    const db = await getDB();
    await db.add('alerts', alert);
}

export async function getAlerts(limit: number = 10): Promise<Alert[]> {
    const db = await getDB();
    const tx = db.transaction('alerts', 'readonly');
    const index = tx.store.index('by-date');
    const alerts = await index.getAll();

    // Sort by date descending
    alerts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return alerts.slice(0, limit);
}

export async function deleteAlert(id: string): Promise<void> {
    const db = await getDB();
    await db.delete('alerts', id);
}

// === CHALLENGE OPERATIONS ===
export async function saveChallenge(challenge: Challenge): Promise<void> {
    const db = await getDB();
    await db.put('challenges', challenge);
}

export async function getChallenges(): Promise<Challenge[]> {
    const db = await getDB();
    return await db.getAll('challenges');
}

// === PREFERENCES OPERATIONS ===
export async function savePreferences(preferences: UserPreferences): Promise<void> {
    const db = await getDB();
    await db.put('preferences', { ...preferences, id: 'user-prefs' } as any);
}

export async function getPreferences(): Promise<UserPreferences | undefined> {
    const db = await getDB();
    const prefs = await db.get('preferences', 'user-prefs');
    return prefs;
}

// === UTILITY FUNCTIONS ===
export async function clearAllData(): Promise<void> {
    const db = await getDB();
    const stores: (keyof NexusDB)[] = ['transactions', 'budgets', 'goals', 'subscriptions', 'alerts', 'challenges'];

    for (const store of stores) {
        await db.clear(store);
    }
}
