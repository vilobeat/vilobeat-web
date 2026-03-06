'use client';

import { useState, useEffect } from "react";
import { Loader2, HardDrive, ShieldAlert, Activity, UserPlus, DollarSign } from "lucide-react";

export default function AuditLogPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/audit`);
            const data = await res.json();
            setLogs(data.logs || []);
        } catch (error) {
            console.error("Failed to fetch audit logs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, []);

    const getIcon = (type: string) => {
        switch (type) {
            case 'INFO': return <UserPlus size={16} className="text-blue-500" />;
            case 'FINANCE': return <DollarSign size={16} className="text-emerald-500" />;
            case 'SECURITY': return <ShieldAlert size={16} className="text-rose-500" />;
            default: return <Activity size={16} className="text-muted-foreground" />;
        }
    };

    return (
        <div className="space-y-6 font-grotesk animate-in fade-in zoom-in duration-500">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <HardDrive className="text-primary" /> System Audit Log
                </h1>
                <p className="text-muted-foreground mt-1">Chronological tracking of critical system events and admin actions.</p>
            </div>

            <div className="bg-card border border-border shadow-soft rounded-2xl p-6">
                {loading ? (
                    <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>
                ) : logs.length === 0 ? (
                    <div className="py-12 text-center text-muted-foreground">No audit logs available.</div>
                ) : (
                    <div className="space-y-4">
                        <div className="border-l-2 border-border/50 ml-4 pl-6 relative space-y-6">
                            {logs.map((log, i) => (
                                <div key={log.id + i} className="relative">
                                    <div className="absolute -left-[35px] top-1 bg-card border border-border/50 rounded-full p-1.5 shadow-sm">
                                        {getIcon(log.type)}
                                    </div>
                                    <div className="bg-muted/10 border border-border/50 rounded-xl p-4 hover:border-border transition-colors">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                            <span className="text-sm font-bold bg-muted/50 px-2 py-0.5 rounded text-foreground/80 tracking-wide">{log.action}</span>
                                            <span className="text-xs text-muted-foreground font-mono bg-card px-2 py-1 rounded shadow-sm border border-border/30">
                                                {new Date(log.timestamp).toLocaleString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground/90 leading-relaxed">{log.details}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
