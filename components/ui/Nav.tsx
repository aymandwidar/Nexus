'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

export default function Nav() {
    const pathname = usePathname();

    const navItems = [
        { href: '/', label: 'Dashboard', icon: '📊' },
        { href: '/upload', label: 'Upload', icon: '📤' },
        { href: '/insights', label: 'Insights', icon: '💡' },
        { href: '/settings', label: 'Settings', icon: '⚙️' },
    ];

    return (
        <nav className="glass-dark" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '1rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            zIndex: 1000,
        }}>
            <div className="flex justify-between items-center max-w-md mx-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;

                    return (
                        <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                            <motion.div
                                className="flex flex-col items-center gap-sm"
                                style={{
                                    padding: '0.5rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    minWidth: 'var(--touch-target-min)',
                                    minHeight: 'var(--touch-target-min)',
                                    cursor: 'pointer',
                                    color: isActive ? 'var(--primary-light)' : 'var(--text-secondary)',
                                    transition: 'all var(--transition-base)',
                                }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span style={{ fontSize: '1.5rem' }}>{item.icon}</span>
                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>{item.label}</span>
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: '50%',
                                            transform: 'translateX(-50%)',
                                            width: '4px',
                                            height: '4px',
                                            borderRadius: '50%',
                                            background: 'var(--primary)',
                                        }}
                                    />
                                )}
                            </motion.div>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
