'use client';

import { useState, useEffect } from 'react';
import Nav from '@/components/ui/Nav';
import Card from '@/components/ui/Card';
import { getPreferences, savePreferences } from '@/lib/db/indexedDB';
import { initDeepSeek } from '@/lib/ai/deepseekClient';
import { initGroq } from '@/lib/ai/groqClient';
import { initGemini } from '@/lib/ai/geminiClient';
import type { UserPreferences } from '@/types';

export default function SettingsPage() {
    const [preferences, setPreferences] = useState<UserPreferences>({
        apiKeys: {},
        coolingOffRules: [],
        notificationsEnabled: true,
        currency: 'USD',
        locale: 'en-US',
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadPreferences();
    }, []);

    async function loadPreferences() {
        const prefs = await getPreferences();
        if (prefs) {
            setPreferences(prefs);

            // Initialize AI clients if keys exist
            if (prefs.apiKeys.deepseek) {
                initDeepSeek(prefs.apiKeys.deepseek);
            }
            if (prefs.apiKeys.groq) {
                initGroq(prefs.apiKeys.groq);
            }
            if (prefs.apiKeys.gemini) {
                initGemini(prefs.apiKeys.gemini);
            }
        }
    }

    async function handleSave() {
        setSaving(true);
        setMessage('');

        try {
            // Initialize AI clients
            if (preferences.apiKeys.deepseek) {
                initDeepSeek(preferences.apiKeys.deepseek);
            }
            if (preferences.apiKeys.groq) {
                initGroq(preferences.apiKeys.groq);
            }
            if (preferences.apiKeys.gemini) {
                initGemini(preferences.apiKeys.gemini);
            }

            await savePreferences(preferences);
            setMessage('✅ Settings saved successfully!');
        } catch (error: any) {
            setMessage(`❌ Error: ${error.message}`);
        } finally {
            setSaving(false);
        }
    }

    function updateApiKey(key: keyof UserPreferences['apiKeys'], value: string) {
        setPreferences(prev => ({
            ...prev,
            apiKeys: {
                ...prev.apiKeys,
                [key]: value,
            },
        }));
    }

    return (
        <main style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
            <div className="container" style={{ maxWidth: '600px' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Settings</h1>
                <p className="text-secondary" style={{ marginBottom: '2rem' }}>
                    Configure your AI models and preferences
                </p>

                {/* API Keys */}
                <Card style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>🔑 API Keys</h3>

                    <div className="flex flex-col gap-md">
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                DeepSeek API Key
                            </label>
                            <input
                                type="password"
                                placeholder="sk-..."
                                value={preferences.apiKeys.deepseek || ''}
                                onChange={(e) => updateApiKey('deepseek', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                }}
                            />
                            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>
                                Used for: Budget generation, forecasting, complex analysis
                            </p>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Groq API Key
                            </label>
                            <input
                                type="password"
                                placeholder="gsk_..."
                                value={preferences.apiKeys.groq || ''}
                                onChange={(e) => updateApiKey('groq', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                }}
                            />
                            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>
                                Used for: Real-time conversations, narratives, alerts
                            </p>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>
                                Gemini API Key
                            </label>
                            <input
                                type="password"
                                placeholder="AIza..."
                                value={preferences.apiKeys.gemini || ''}
                                onChange={(e) => updateApiKey('gemini', e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    color: 'var(--text-primary)',
                                    fontSize: '1rem',
                                }}
                            />
                            <p className="text-muted" style={{ fontSize: '0.75rem', marginTop: '0.25rem', marginBottom: 0 }}>
                                Used for: PDF OCR, image recognition, price grounding
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Get API Keys Info */}
                <Card style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>📝 How to Get API Keys</h3>
                    <ul style={{ paddingLeft: '1.5rem', marginBottom: 0 }}>
                        <li className="text-secondary" style={{ marginBottom: '0.5rem' }}>
                            <strong>DeepSeek:</strong> <a href="https://platform.deepseek.com" target="_blank" rel="noopener" style={{ color: 'var(--primary-light)' }}>platform.deepseek.com</a>
                        </li>
                        <li className="text-secondary" style={{ marginBottom: '0.5rem' }}>
                            <strong>Groq:</strong> <a href="https://console.groq.com" target="_blank" rel="noopener" style={{ color: 'var(--primary-light)' }}>console.groq.com</a>
                        </li>
                        <li className="text-secondary">
                            <strong>Gemini:</strong> <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener" style={{ color: 'var(--primary-light)' }}>makersuite.google.com</a>
                        </li>
                    </ul>
                </Card>

                {/* Save Button */}
                <button
                    className="btn btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                    style={{ width: '100%', marginBottom: '1rem' }}
                >
                    {saving ? '⏳ Saving...' : '💾 Save Settings'}
                </button>

                {message && (
                    <div
                        className="glass"
                        style={{
                            padding: '1rem',
                            borderRadius: 'var(--radius-md)',
                            textAlign: 'center',
                            border: message.startsWith('✅') ? '1px solid var(--success)' : '1px solid var(--danger)',
                        }}
                    >
                        <p style={{ marginBottom: 0 }}>{message}</p>
                    </div>
                )}

                {/* Privacy Notice */}
                <Card style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>🔒 Privacy</h3>
                    <p className="text-secondary" style={{ fontSize: '0.875rem', marginBottom: 0 }}>
                        All your data is stored locally in your browser using IndexedDB. API keys are never sent to any server except the respective AI providers when making requests. Your financial data remains private and under your control.
                    </p>
                </Card>
            </div>

            <Nav />
        </main>
    );
}
