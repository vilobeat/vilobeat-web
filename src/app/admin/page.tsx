'use client';

import { useEffect, useState } from 'react';
import { Activity, Music, TrendingUp, User, Loader2, ArrowUpRight, DollarSign, Headphones, Mic, FileText, CheckCircle2 } from "lucide-react";

interface DashboardData {
    metrics: {
        totalUsers: number;
        activeSubscriptions: number;
        pendingDistribution: number;
        pendingMastering: number;
        pendingLyricsMusic: number;
        pendingWithdrawals: number;
        totalPlatformRevenue: number;
        totalArtistRevenueOwed: number;
    };
    feed: {
        id: string;
        type: string;
        title: string;
        desc: string;
        date: string;
    }[];
}

const TYPE_ICONS: Record<string, any> = {
    USER_SIGNUP: User,
    SONG_SUBMITTED: Music,
    TASK_COMPLETED: CheckCircle2,
    WITHDRAWAL_REQUEST: DollarSign,
};

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    async function fetchDashboard() {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/dashboard');
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error('Failed to fetch dashboard:', e);
        }
        setLoading(false);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={40} />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <header className="mb-8">
                <h1 className="text-4xl font-heading mb-2">Welcome Back, <span className="text-primary">Admin</span></h1>
                <p className="text-muted-foreground opacity-70">Here's what's happening on ViloBeat today.</p>
            </header>

            {/* Stats Cards Row 1: Users & General Tasks */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Users" value={data?.metrics?.totalUsers?.toLocaleString() || '0'} icon={User} trend={`${data?.metrics?.activeSubscriptions || 0} active subs`} />
                <StatCard title="Pending Distribution" value={`${data?.metrics?.pendingDistribution || 0}`} icon={Activity} active />
                <StatCard title="Pending Mastering" value={`${data?.metrics?.pendingMastering || 0}`} icon={Headphones} active />
                <StatCard title="Pending Lyrics → Music" value={`${data?.metrics?.pendingLyricsMusic || 0}`} icon={Mic} active />
            </div>

            {/* Stats Cards Row 2: Financials & Operations */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                <StatCard title="Pending Withdrawals" value={`${data?.metrics?.pendingWithdrawals || 0}`} icon={FileText} trend="requires review" />
                <StatCard title="Active Subscriptions" value={`${data?.metrics?.activeSubscriptions || 0}`} icon={CheckCircle2} />
                <StatCard title="Total Platform Revenue" value={`$${(data?.metrics?.totalPlatformRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}/mo`} icon={TrendingUp} trend="MRR Estimate" />
                <StatCard title="Total Artist Revenue Owed" value={`$${(data?.metrics?.totalArtistRevenueOwed || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={DollarSign} trend="wallet balances" />
            </div>

            <div className="mt-12 bg-card rounded-3xl p-8 border border-border/40">
                <h2 className="text-xl font-heading mb-6 flex items-center justify-between">
                    Live Activity Feed
                    <button onClick={fetchDashboard} className="text-sm text-primary font-bold hover:opacity-80 active:scale-95 transition-all">
                        Refresh
                    </button>
                </h2>

                <div className="space-y-4">
                    {data?.feed && data.feed.length > 0 ? (
                        data.feed.map((item) => {
                            const FeedIcon = TYPE_ICONS[item.type] || Activity;

                            return (
                                <div key={item.id} className="flex items-center justify-between p-4 bg-background/50 hover:bg-background rounded-2xl transition-all border border-transparent hover:border-border">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                            <FeedIcon size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold">{item.title}</p>
                                            <p className="text-xs text-muted-foreground opacity-80 mt-0.5">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-xs text-muted-foreground opacity-50 flex items-center gap-1">
                                            <Activity size={12} /> {new Date(item.date).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center py-10 text-muted-foreground opacity-50">
                            <p>No recent activity across the platform</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, trend, active = false }: { title: string, value: string, icon: any, trend?: string, active?: boolean }) {
    return (
        <div className={`p-6 rounded-3xl border ${active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-card text-card-foreground border-border/40'} transition-transform hover:-translate-y-1`}>
            <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-2xl ${active ? 'bg-primary/20 text-primary' : 'bg-primary/10 text-primary'}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${active ? 'bg-primary/20 text-primary' : 'bg-green-500/10 text-green-500'}`}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <h3 className={`text-sm font-semibold mb-1 ${active ? 'text-primary/80' : 'text-muted-foreground opacity-70'}`}>{title}</h3>
                <p className="text-3xl font-extrabold font-heading">{value}</p>
            </div>
        </div>
    )
}
