'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Nav from '@/components/ui/Nav';
import Card from '@/components/ui/Card';
import { parseCSV, parseQIF } from '@/lib/ingestion/csvParser';
import { parsePDFStatement } from '@/lib/ingestion/pdfParser';
import { cleanPayeeNames, deduplicateTransactions } from '@/lib/cleaning/payeeStandardizer';
import { addTransaction } from '@/lib/db/indexedDB';
import type { Transaction } from '@/types';

export default function UploadPage() {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState('');

    async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) return;

        setUploading(true);
        setError('');
        setProgress('Reading file...');

        try {
            let transactions: Transaction[] = [];

            if (file.name.endsWith('.csv')) {
                setProgress('Parsing CSV...');
                transactions = await parseCSV(file);
            } else if (file.name.endsWith('.qif')) {
                setProgress('Parsing QIF...');
                transactions = await parseQIF(file);
            } else if (file.name.endsWith('.pdf')) {
                setProgress('Extracting data from PDF (this may take a moment)...');
                transactions = await parsePDFStatement(file);
            } else {
                throw new Error('Unsupported file type. Please upload CSV, QIF, or PDF.');
            }

            // Clean and deduplicate
            setProgress('Cleaning data...');
            transactions = cleanPayeeNames(transactions);
            transactions = deduplicateTransactions(transactions);

            setProgress(`Saving ${transactions.length} transactions...`);

            // Save to IndexedDB
            for (const txn of transactions) {
                await addTransaction(txn);
            }

            setProgress(`✅ Successfully imported ${transactions.length} transactions!`);

            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
                router.push('/');
            }, 2000);

        } catch (err: any) {
            console.error('Upload error:', err);
            setError(err.message || 'Failed to process file');
        } finally {
            setUploading(false);
        }
    }

    return (
        <main style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
            <div className="container" style={{ maxWidth: '600px' }}>
                <h1 style={{ marginBottom: '0.5rem' }}>Upload Transactions</h1>
                <p className="text-secondary" style={{ marginBottom: '2rem' }}>
                    Import your financial data from CSV, QIF, or PDF bank statements
                </p>

                <Card>
                    <div className="flex flex-col gap-lg">
                        <div>
                            <h3 style={{ marginBottom: '1rem' }}>Supported Formats</h3>
                            <ul style={{ paddingLeft: '1.5rem', marginBottom: 0 }}>
                                <li className="text-secondary">📄 CSV - Comma-separated values</li>
                                <li className="text-secondary">📋 QIF - Quicken Interchange Format</li>
                                <li className="text-secondary">📑 PDF - Bank statements (OCR powered by AI)</li>
                            </ul>
                        </div>

                        <div>
                            <label
                                htmlFor="file-upload"
                                className="btn btn-primary"
                                style={{
                                    width: '100%',
                                    cursor: uploading ? 'not-allowed' : 'pointer',
                                    opacity: uploading ? 0.6 : 1,
                                }}
                            >
                                {uploading ? '⏳ Processing...' : '📤 Choose File'}
                            </label>
                            <input
                                id="file-upload"
                                type="file"
                                accept=".csv,.qif,.pdf"
                                onChange={handleFileUpload}
                                disabled={uploading}
                                style={{ display: 'none' }}
                            />
                        </div>

                        {progress && (
                            <div
                                className="glass"
                                style={{
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    textAlign: 'center',
                                }}
                            >
                                <p style={{ marginBottom: 0 }}>{progress}</p>
                            </div>
                        )}

                        {error && (
                            <div
                                className="glass"
                                style={{
                                    padding: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--danger)',
                                    textAlign: 'center',
                                }}
                            >
                                <p style={{ marginBottom: 0, color: 'var(--danger)' }}>❌ {error}</p>
                            </div>
                        )}
                    </div>
                </Card>

                <Card style={{ marginTop: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1rem' }}>💡 Tips</h3>
                    <ul style={{ paddingLeft: '1.5rem', marginBottom: 0 }}>
                        <li className="text-secondary" style={{ marginBottom: '0.5rem' }}>
                            CSV files should include columns for date, amount, and description
                        </li>
                        <li className="text-secondary" style={{ marginBottom: '0.5rem' }}>
                            PDF statements are processed using AI OCR for maximum accuracy
                        </li>
                        <li className="text-secondary">
                            Duplicate transactions are automatically detected and merged
                        </li>
                    </ul>
                </Card>
            </div>

            <Nav />
        </main>
    );
}
