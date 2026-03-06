'use client';

import { useState, useEffect } from "react";
import { Loader2, DollarSign, CheckCircle, Clock, XCircle } from "lucide-react";

export default function WithdrawalsQueuePage() {
    const [withdrawals, setWithdrawals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchWithdrawals = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/withdrawals/queue?status=${filter}`);
            const data = await res.json();
            setWithdrawals(data.withdrawals || []);
        } catch (error) {
            console.error("Failed to fetch withdrawals queue", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWithdrawals();
    }, [filter]);

    const handleAction = async (id: string, action: string, payload: any = {}) => {
        setUpdating(id);
        try {
            await fetch(`/api/admin/withdrawals/${id}/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, payload })
            });
            await fetchWithdrawals();
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(null);
        }
    };

    const statusFilters = ['ALL', 'PENDING', 'APPROVED', 'PAID', 'REJECTED'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <DollarSign className="text-primary" /> Withdrawal Queue
                    </h2>
                    <p className="text-muted-foreground text-sm">Review, approve, and execute artist royalty payouts</p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                    {statusFilters.map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all active:scale-95 ${filter === f ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'bg-card border border-border text-muted-foreground hover:bg-muted'
                                }`}
                        >
                            {f.replace(/_/g, ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-card border border-border shadow-soft rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : withdrawals.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">No withdrawal requests found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 border-b border-border/50">
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Artist</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {withdrawals.map(w => (
                                    <tr key={w.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-sm">{w.user?.artistName || "Unknown Artist"}</div>
                                            <div className="text-xs text-muted-foreground truncate w-48">{w.user?.email}</div>
                                            <div className="text-[10px] text-muted-foreground font-mono mt-1">Wallet at req: ${(w.user?.walletBalance + w.amount).toFixed(2)}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-xl text-foreground/90">${w.amount.toFixed(2)}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">Req: {new Date(w.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${w.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    w.status === 'APPROVED' ? 'bg-blue-500/10 text-blue-500' :
                                                        w.status === 'PENDING' ? 'bg-amber-500/10 text-amber-500' :
                                                            'bg-red-500/10 text-red-500'
                                                }`}>
                                                {w.status === 'PAID' && <CheckCircle size={12} />}
                                                {w.status === 'PENDING' && <Clock size={12} />}
                                                {w.status === 'REJECTED' && <XCircle size={12} />}
                                                {w.status}
                                            </span>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            {updating === w.id ? <Loader2 className="animate-spin inline text-primary" size={16} /> : (
                                                <div className="flex flex-col gap-2 items-end">
                                                    {w.status === 'PENDING' && (
                                                        <>
                                                            <button onClick={() => {
                                                                if (confirm("Approve this withdrawal and deduct from wallet?")) handleAction(w.id, 'APPROVE');
                                                            }} className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm w-full">Approve</button>
                                                            <button onClick={() => handleAction(w.id, 'REJECT')} className="text-xs font-bold text-red-500 hover:underline w-full text-right outline-none cursor-pointer">Reject</button>
                                                        </>
                                                    )}
                                                    {w.status === 'APPROVED' && (
                                                        <button onClick={() => {
                                                            const ref = prompt("Enter Bank/PayPal Payment Reference ID:");
                                                            if (ref) handleAction(w.id, 'MARK_PAID', { reference: ref });
                                                        }} className="text-xs font-bold bg-emerald-500 text-white px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-sm w-full">Mark as Paid</button>
                                                    )}
                                                    {w.status === 'PAID' && (
                                                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mr-2">FUNDS DISBURSED</span>
                                                    )}
                                                </div>
                                            )}
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
