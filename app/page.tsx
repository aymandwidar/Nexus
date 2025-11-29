'use client';

import { useState, useEffect } from 'react';
import Nav from '@/components/ui/Nav';
import Card from '@/components/ui/Card';
import EventLayout, { EventCardData } from '@/components/layout/EventLayout';
import { getTransactions, getBudgets, getAlerts } from '@/lib/db/indexedDB';
import { calculateBurnRate } from '@/lib/analytics/burnRate';
import type { Transaction, Budget, Alert } from '@/types';

export default function Home() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [burnRate, setBurnRate] = useState<number>(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [txns, bdgts, alrts] = await Promise.all([
                getTransactions(20),
                getBudgets(),
                getAlerts(5),
            ]);

            setTransactions(txns);
            setBudgets(bdgts);
            setAlerts(alrts);

            if (txns.length > 0) {
                const br = calculateBurnRate(txns);
                setBurnRate(br.percentage);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    // Convert transactions to event cards
    const events: EventCardData[] = [
        ...alerts.map(alert => ({
            id: alert.id,
            type: 'alert' as const,
            timestamp: alert.createdAt,
            title: alert.type.charAt(0).toUpperCase() + alert.type.slice(1),
            description: alert.message,
            icon: alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️',
            variant: alert.severity === 'critical' ? 'danger' as const : alert.severity === 'warning' ? 'warning' as const : 'default' as const,
        })),
        ...transactions.map(txn => ({
            id: txn.id,
            type: 'transaction' as const,
            timestamp: txn.date,
            title: txn.payee,
            description: txn.description,
            amount: txn.amount,
            icon: txn.type === 'income' ? '💰' : '💳',
        })),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                <div className="text-center">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💫</div>
                    <h2>Loading Nexus...</h2>
                </div>
            </div>
        );
    }

    return (
        <main style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <h1 style={{
                        background: 'var(--primary-gradient)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '0.5rem',
                    }}>
                        Nexus
                    </h1>
                    <p className="text-secondary">Smart Spending Management</p>
                </div>

                {/* Burn Rate Card */}
                {transactions.length > 0 && (
                    <Card glow style={{ marginBottom: '1.5rem' }}>
                        <div className="flex justify-between items-center">
                            <div>
                                <h3 style={{ marginBottom: '0.5rem' }}>Burn Rate</h3>
                                <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 0 }}>
                                    Monthly spending efficiency
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{
                                    fontSize: '2.5rem',
                                    fontWeight: 700,
                                    background: burnRate < 60 ? 'var(--success-gradient)' : burnRate < 80 ? 'var(--warning-gradient)' : 'var(--danger-gradient)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    backgroundClip: 'text',
                                }}>
                                    {burnRate.toFixed(1)}%
                                </div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                    {burnRate < 60 ? '✅ Healthy' : burnRate < 80 ? '⚠️ Warning' : '🚨 Critical'}
                                </div>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Quick Stats */}
                {transactions.length > 0 && (
                    <div className="flex gap-md" style={{ marginBottom: '1.5rem' }}>
                        <Card style={{ flex: 1 }}>
                            <div className="text-center">
                                <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                    Transactions
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                    {transactions.length}
                                </div>
                            </div>
                        </Card>
                        <Card style={{ flex: 1 }}>
                            <div className="text-center">
                                <div className="text-muted" style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                                    Budgets
                                </div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                                    {budgets.length}
                                </div>
                            </div>
                        </Card>
                    </div>
                )}

                {/* Event Timeline */}
                <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Recent Activity</h2>
                <EventLayout events={events} />
            </div>

            <Nav />
        </main>
    );
}
