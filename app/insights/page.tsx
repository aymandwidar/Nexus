'use client';

import { useState, useEffect } from 'react';
import Nav from '@/components/ui/Nav';
import Card from '@/components/ui/Card';
import { getTransactions, getBudgets } from '@/lib/db/indexedDB';
import { calculateBurnRate, calculateSavingsVelocity, detectPhantomSpend } from '@/lib/analytics/burnRate';
import { generateHyperPersonalizedBudget } from '@/lib/ai/budgetGenerator';
import { generateCashFlowForecast } from '@/lib/ai/forecasting';
import type { Transaction, Budget, PhantomSpend } from '@/types';

export default function InsightsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [budgets, setBudgets] = useState<Budget[]>([]);
    const [phantomSpends, setPhantomSpends] = useState<PhantomSpend[]>([]);
    const [generating, setGenerating] = useState(false);
    const [forecast, setForecast] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [txns, bdgts] = await Promise.all([
                getTransactions(),
                getBudgets(),
            ]);

            setTransactions(txns);
            setBudgets(bdgts);

            if (txns.length > 0) {
                const phantom = detectPhantomSpend(txns);
                setPhantomSpends(phantom);
            }
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }

    async function generateBudget() {
        if (transactions.length === 0) {
            alert('Please upload transactions first');
            return;
        }

        setGenerating(true);
        try {
            const newBudgets = await generateHyperPersonalizedBudget(transactions);
            setBudgets(newBudgets);
            alert(`✅ Generated ${newBudgets.length} personalized budgets!`);
        } catch (error: any) {
            alert(`Failed to generate budget: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    }

    async function generateForecast() {
        if (transactions.length === 0) {
            alert('Please upload transactions first');
            return;
        }

        setGenerating(true);
        try {
            const result = await generateCashFlowForecast(transactions, 1000, 3);
            setForecast(result);
        } catch (error: any) {
            alert(`Failed to generate forecast: ${error.message}`);
        } finally {
            setGenerating(false);
        }
    }

    const burnRate = transactions.length > 0 ? calculateBurnRate(transactions) : null;

    if (loading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="text-center">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💡</div>
                    <h2>Loading insights...</h2>
                </div>
            </div>
        );
    }

    return (
        <main style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
            <div className="container" style={{ maxWidth: '800px' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>AI Insights</h1>
                <p className="text-secondary" style={{ marginBottom: '2rem' }}>
                    Powered by DeepSeek, Groq, and Gemini
                </p>

                {/* Burn Rate */}
                {burnRate && (
                    <Card glow style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>💰 Burn Rate Analysis</h3>
                        <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                            <div>
                                <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                                    {burnRate.percentage.toFixed(1)}%
                                </div>
                                <div className="text-muted">
                                    {burnRate.status === 'healthy' ? '✅ Healthy' : burnRate.status === 'warning' ? '⚠️ Warning' : '🚨 Critical'}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-muted" style={{ fontSize: '0.875rem' }}>Monthly Expenses</div>
                                <div style={{ fontWeight: 600 }}>${burnRate.monthlyExpenses.toFixed(2)}</div>
                            </div>
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                            Your spending is {burnRate.percentage.toFixed(0)}% of your income.
                            {burnRate.percentage < 60 && ' Great job keeping expenses low!'}
                            {burnRate.percentage >= 60 && burnRate.percentage < 80 && ' Consider reducing discretionary spending.'}
                            {burnRate.percentage >= 80 && ' ⚠️ High burn rate - immediate action recommended.'}
                        </div>
                    </Card>
                )}

                {/* Phantom Spend */}
                {phantomSpends.length > 0 && (
                    <Card style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>👻 Phantom Spend Detected</h3>
                        {phantomSpends.slice(0, 3).map((ps, idx) => (
                            <div key={idx} style={{
                                marginBottom: idx < 2 ? '1rem' : 0,
                                paddingBottom: idx < 2 ? '1rem' : 0,
                                borderBottom: idx < 2 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                            }}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div style={{ fontWeight: 600 }}>{ps.examples[0].payee}</div>
                                        <div className="text-muted" style={{ fontSize: '0.875rem' }}>
                                            {ps.frequency} transactions/month • ${ps.averageAmount.toFixed(2)} avg
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div style={{ fontWeight: 700, color: 'var(--danger)' }}>
                                            ${ps.annualizedCost.toFixed(0)}/year
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </Card>
                )}

                {/* AI Actions */}
                <div className="flex flex-col gap-md" style={{ marginBottom: '1.5rem' }}>
                    <button
                        className="btn btn-primary"
                        onClick={generateBudget}
                        disabled={generating || transactions.length === 0}
                    >
                        {generating ? '⏳ Generating...' : '🤖 Generate AI Budget'}
                    </button>

                    <button
                        className="btn btn-secondary"
                        onClick={generateForecast}
                        disabled={generating || transactions.length === 0}
                    >
                        {generating ? '⏳ Forecasting...' : '📈 3-Month Forecast'}
                    </button>
                </div>

                {/* Forecast Results */}
                {forecast && (
                    <Card glow style={{ marginBottom: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>📊 Cash Flow Forecast</h3>
                        {forecast.forecasts.map((f: any, idx: number) => (
                            <div key={idx} style={{
                                marginBottom: idx < forecast.forecasts.length - 1 ? '0.75rem' : 0,
                                paddingBottom: idx < forecast.forecasts.length - 1 ? '0.75rem' : 0,
                                borderBottom: idx < forecast.forecasts.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none',
                            }}>
                                <div className="flex justify-between items-center">
                                    <div>
                                        <div style={{ fontWeight: 600 }}>
                                            {new Date(f.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                        </div>
                                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                                            {(f.confidence * 100).toFixed(0)}% confidence
                                        </div>
                                    </div>
                                    <div style={{
                                        fontWeight: 700,
                                        color: f.projectedBalance >= 0 ? 'var(--success)' : 'var(--danger)',
                                    }}>
                                        ${f.projectedBalance.toFixed(2)}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {forecast.alerts.length > 0 && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
                                <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>⚠️ Alerts</div>
                                {forecast.alerts.map((alert: string, idx: number) => (
                                    <div key={idx} className="text-muted" style={{ fontSize: '0.875rem' }}>
                                        {alert}
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}

                {transactions.length === 0 && (
                    <Card>
                        <div className="text-center" style={{ padding: '2rem' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                            <h3>No data yet</h3>
                            <p className="text-muted">Upload transactions to see AI-powered insights</p>
                        </div>
                    </Card>
                )}
            </div>

            <Nav />
        </main>
    );
}
