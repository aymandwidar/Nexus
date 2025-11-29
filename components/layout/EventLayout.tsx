'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Card from '../ui/Card';

export interface EventCardData {
    id: string;
    type: 'transaction' | 'prediction' | 'goal' | 'alert';
    timestamp: Date;
    title: string;
    description: string;
    amount?: number;
    icon?: string;
    variant?: 'default' | 'success' | 'warning' | 'danger';
}

interface EventLayoutProps {
    events: EventCardData[];
}

export default function EventLayout({ events }: EventLayoutProps) {
    const formatDate = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return date.toLocaleDateString();
    };

    const formatAmount = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(Math.abs(amount));
    };

    return (
        <div className="flex flex-col gap-md" style={{ paddingBottom: '100px' }}>
            {events.map((event, index) => (
                <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                >
                    <Card
                        glow={event.type === 'prediction' || event.type === 'goal'}
                        variant={event.variant}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-md">
                                {event.icon && (
                                    <div style={{
                                        fontSize: '2rem',
                                        width: '48px',
                                        height: '48px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: 'var(--radius-md)',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                    }}>
                                        {event.icon}
                                    </div>
                                )}
                                <div>
                                    <h4 style={{ marginBottom: '0.25rem', fontSize: '1rem' }}>
                                        {event.title}
                                    </h4>
                                    <p className="text-muted" style={{ fontSize: '0.875rem', marginBottom: 0 }}>
                                        {event.description}
                                    </p>
                                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                                        {formatDate(event.timestamp)}
                                    </span>
                                </div>
                            </div>

                            {event.amount !== undefined && (
                                <div style={{
                                    fontSize: '1.25rem',
                                    fontWeight: 700,
                                    color: event.amount < 0 ? 'var(--danger)' : 'var(--success)',
                                }}>
                                    {event.amount < 0 ? '-' : '+'}{formatAmount(event.amount)}
                                </div>
                            )}
                        </div>
                    </Card>
                </motion.div>
            ))}

            {events.length === 0 && (
                <Card>
                    <div className="text-center" style={{ padding: '2rem' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
                        <h3>No events yet</h3>
                        <p className="text-muted">Upload your transactions to get started</p>
                    </div>
                </Card>
            )}
        </div>
    );
}
