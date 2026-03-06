'use client';

import { useState, useEffect } from "react";
import { Loader2, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Clock, History, AlertCircle } from "lucide-react";

export default function FinanceDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    useEffect(() => {
        const fetchFinanceData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/admin/finance`);
                const json = await res.json();
                setData(json);
            } catch (error) {
                console.error("Failed to fetch finance data", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFinanceData();
    }, []);

    if (loading) return <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
    if (!data || data.error) return <div className="p-12 text-center text-red-500 break-words">{data?.error || "Failed to load finance data."}</div>;

    const stats = data.stats || {};
    const transactions = data.transactions || [];

    const filteredTransactions = transactions.filter((t: any) => filter === 'ALL' || t.category === filter);

    return (
        <div className="space-y-6 font-grotesk animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <DollarSign className="text-primary" /> Finance Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">Global platform economics, artist liabilities, and transaction ledgers.</p>
            </div>

            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
                    <div className="text-muted-foreground text-sm font-bold flex items-center gap-2 mb-2">
                        <Wallet size={16} /> Total Artist Balances
                    </div>
                    <div className="text-3xl font-black">${(stats.totalArtistBalances || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-muted-foreground mt-2 bg-muted/50 p-2 rounded-lg inline-flex items-center gap-1.5"><AlertCircle size={12} /> Platform Liability</div>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
                    <div className="text-muted-foreground text-sm font-bold flex items-center gap-2 mb-2">
                        <ArrowUpRight size={16} className="text-emerald-500" /> Platform Gross Earnings
                    </div>
                    <div className="text-3xl font-black text-emerald-500">${(stats.totalPlatformEarnings || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-muted-foreground mt-2 bg-emerald-500/10 text-emerald-600 p-2 rounded-lg inline-flex">Estimated Subscriptions/Fees</div>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
                    <div className="text-muted-foreground text-sm font-bold flex items-center gap-2 mb-2">
                        <Clock size={16} className="text-amber-500" /> Pending Withdrawals
                    </div>
                    <div className="text-3xl font-black text-amber-500">{stats.pendingWithdrawalsCount || 0}</div>
                    <div className="text-xs text-muted-foreground mt-2 bg-amber-500/10 text-amber-600 p-2 rounded-lg inline-flex">Requests awaiting approval</div>
                </div>

                <div className="bg-card border border-border p-5 rounded-2xl shadow-soft">
                    <div className="text-muted-foreground text-sm font-bold flex items-center gap-2 mb-2">
                        <ArrowDownRight size={16} className="text-blue-500" /> Disbursed Payouts
                    </div>
                    <div className="text-3xl font-black text-blue-500">${(stats.completedWithdrawalsAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-xs text-muted-foreground mt-2 bg-blue-500/10 text-blue-600 p-2 rounded-lg inline-flex">Total paid to artists</div>
                </div>
            </div>

            {/* Transaction Ledger */}
            <div className="bg-card border border-border rounded-2xl shadow-soft overflow-hidden">
                <div className="p-5 border-b border-border/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <History size={18} className="text-primary" /> Unified Transaction Ledger
                    </h3>

                    <div className="flex bg-muted p-1 rounded-xl">
                        {['ALL', 'ROYALTY', 'WITHDRAWAL'].map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === f ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:bg-black/5'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredTransactions.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">No transactions found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/20 border-b border-border/50">
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Artist</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Description</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/30">
                                {filteredTransactions.map((tx: any) => (
                                    <tr key={tx.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="p-4 whitespace-nowrap text-sm font-mono text-muted-foreground">
                                            {new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold tracking-wider ${tx.type === 'CREDIT' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                                                }`}>
                                                {tx.type === 'CREDIT' ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
                                                {tx.category}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-sm">{tx.user?.artistName}</div>
                                            <div className="text-[10px] text-muted-foreground">{tx.user?.email}</div>
                                        </td>
                                        <td className="p-4 text-sm text-foreground/80">
                                            {tx.description}
                                            {tx.status !== 'COMPLETED' && tx.status !== 'PAID' && (
                                                <span className="ml-2 bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded text-[10px] uppercase font-bold">{tx.status}</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className={`font-black text-base ${tx.type === 'CREDIT' ? 'text-emerald-500' : 'text-foreground'}`}>
                                                {tx.type === 'CREDIT' ? '+' : '-'}${tx.amount.toFixed(2)}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
