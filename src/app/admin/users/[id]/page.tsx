'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, User as UserIcon, Wallet, Music, ShieldCheck, Mail, Calendar, Activity, Lock, Headphones, Mic, ImageIcon, FileText, CheckCircle2 } from "lucide-react";

export default function UserDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [suspending, setSuspending] = useState(false);

    // Updated 6 Tabs
    const [activeTab, setActiveTab] = useState<'all' | 'distribution' | 'mastering' | 'lyrics' | 'cover' | 'withdrawals'>('all');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch(`/api/admin/users/${params.id}`);
                const data = await res.json();
                setUser(data.user);
            } catch (error) {
                console.error("Failed to fetch user", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUser();
    }, [params.id]);

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>;
    if (!user) return <div className="p-12 text-center text-red-500">User not found</div>;

    const tabs = [
        { id: 'all', label: 'All Requests', icon: Activity },
        { id: 'distribution', label: 'Distribution', icon: Music },
        { id: 'mastering', label: 'Mastering', icon: Headphones },
        { id: 'lyrics', label: 'Lyrics → Music', icon: Mic },
        { id: 'cover', label: 'Cover Generation', icon: ImageIcon },
        { id: 'withdrawals', label: 'Withdrawals', icon: Wallet },
    ] as const;

    // Synthesize "All Requests" feed manually
    const allRequestsFeed = [
        ...(user.songs || []).map((s: any) => ({ ...s, feedType: 'DISTRIBUTION', date: s.createdAt })),
        ...(user.requestedTasks || []).map((t: any) => ({ ...t, feedType: t.type, date: t.createdAt })),
        ...(user.withdrawalRequests || []).map((w: any) => ({ ...w, feedType: 'WITHDRAWAL', date: w.createdAt })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-8 font-grotesk animate-in fade-in zoom-in duration-500">
            <button onClick={() => router.back()} className="flex w-fit items-center gap-2 text-muted-foreground hover:text-foreground text-sm font-medium transition-all hover:bg-muted active:bg-muted/80 px-3 py-2 rounded-xl active:scale-95">
                <ArrowLeft size={16} /> Back to Users
            </button>

            {/* HEADER HEADER */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                        <UserIcon size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            {user.artistName || "No Artist Name"}
                            {user.role !== 'ARTIST' && (
                                <span className="text-xs font-bold uppercase tracking-wider bg-accent/10 text-accent px-2.5 py-1 rounded-full">{user.role}</span>
                            )}
                        </h1>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Mail size={14} /> {user.email}</span>
                            <span className="flex items-center gap-1.5"><Calendar size={14} /> Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            setSuspending(true);
                            setTimeout(() => { alert("User Suspended"); setSuspending(false); }, 1500);
                        }}
                        disabled={suspending}
                        className="px-4 py-2 border border-border bg-card rounded-xl font-medium hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 active:bg-red-500/20 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
                    >
                        {suspending ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                        {suspending ? 'Suspending...' : 'Suspend Account'}
                    </button>
                </div>
            </div>

            {/* SECTION A: OVERVIEW */}
            <div className="space-y-4">
                <h2 className="text-xl font-bold">Section A — Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">

                    {/* User Info & Status */}
                    <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm col-span-2">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Subscription Tier</h3>
                                <p className="text-2xl font-bold">{user.subscriptionTier}</p>
                            </div>
                            <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${user.overview?.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                }`}>
                                {user.overview?.status || 'Active'}
                            </span>
                        </div>
                        <div className="pt-4 border-t border-border">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">DSP Unlock Progress</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div className={`h-full ${user.overview?.dspUnlockPercentage === 100 ? 'bg-emerald-500' : 'bg-primary'}`} style={{ width: `${user.overview?.dspUnlockPercentage || 0}%` }} />
                                </div>
                                <span className={`text-sm font-bold ${user.overview?.dspUnlockPercentage === 100 ? 'text-emerald-500' : 'text-foreground'}`}>
                                    {user.overview?.dspUnlockPercentage || 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm col-span-2">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground mb-1">Quota Usage</h3>
                                <p className="text-2xl font-bold">{user.overview?.quotaDetails?.used || 0} <span className="text-lg text-muted-foreground font-medium">/ {user.overview?.quotaDetails?.total || 10}</span></p>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-border">
                            <h3 className="text-sm font-semibold text-muted-foreground mb-2">Monthly Limits</h3>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-2.5 bg-muted rounded-full overflow-hidden">
                                    <div className="h-full bg-accent" style={{ width: `${user.overview?.quotaUsedPercentage || 0}%` }} />
                                </div>
                                <span className="text-sm font-bold text-foreground">
                                    {user.overview?.quotaUsedPercentage || 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm col-span-2 xl:col-span-1 flex flex-col justify-center text-center">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Wallet Balance</h3>
                        <p className="text-3xl font-bold tracking-tight">${user.walletBalance?.toFixed(2) || '0.00'}</p>
                    </div>

                    <div className="p-5 rounded-2xl bg-card border border-border/50 shadow-sm col-span-2 xl:col-span-1 flex flex-col justify-center text-center">
                        <h3 className="text-sm font-semibold text-muted-foreground mb-2">Total Revenue</h3>
                        <p className="text-3xl font-bold tracking-tight text-emerald-500">${user.overview?.totalRevenueGenerated?.toFixed(2) || '0.00'}</p>
                        <p className="text-xs text-muted-foreground mt-2">{user.overview?.totalSongsDistributed || 0} songs distributed</p>
                    </div>
                </div>
            </div>

            {/* SECTION B: TABS */}
            <div className="space-y-4 pt-4 border-t border-border">
                <h2 className="text-xl font-bold">Section B — User Requests & Activity</h2>
                <div className="flex space-x-1 bg-muted/50 p-1 rounded-xl overflow-x-auto w-full max-w-4xl">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all active:scale-95 shrink-0 ${activeTab === tab.id
                                ? 'bg-primary/15 text-primary font-bold shadow-sm shadow-primary/10'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted active:bg-muted/80'
                                }`}
                        >
                            <tab.icon size={16} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="bg-card border border-border/50 shadow-soft rounded-2xl p-6 min-h-[400px]">
                    {activeTab === 'all' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Chronological Feed</h3>
                            {allRequestsFeed.length === 0 ? <p className="text-muted-foreground">No activity recorded for this user.</p> : (
                                <table className="w-full text-left">
                                    <thead className="bg-muted/30">
                                        <tr>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Type</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Title / Details</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Status</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Date</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {allRequestsFeed.map((item: any, i) => (
                                            <tr key={i} className="hover:bg-muted/10">
                                                <td className="p-3 text-sm font-bold opacity-80">{item.feedType.replace(/_/g, ' ')}</td>
                                                <td className="p-3 text-sm">{item.title || item.type || `Withdrawal $${item.amount}`}</td>
                                                <td className="p-3 text-sm">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.status === 'COMPLETED' || item.status === 'LIVE' || item.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted'}`}>
                                                        {item.status || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString()}</td>
                                                <td className="p-3 text-right">
                                                    <button className="text-primary hover:underline text-sm font-medium">View</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {activeTab === 'distribution' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Distribution Submissions</h3>
                            {user.songs?.length === 0 ? <p className="text-muted-foreground">No distribution requests.</p> : (
                                <table className="w-full text-left">
                                    <thead className="bg-muted/30">
                                        <tr>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Song Title</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Audio / Cover Source</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Splits</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Status & DSPs</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground text-right">Admin Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {user.songs.map((song: any) => (
                                            <tr key={song.id} className="hover:bg-muted/10">
                                                <td className="p-3 font-medium">{song.title}</td>
                                                <td className="p-3 text-xs text-muted-foreground">
                                                    <div>Audio: <span className="font-bold text-foreground">{song.audioSource}</span></div>
                                                    <div>Cover: <span className="font-bold text-foreground">USER UPLOAD</span></div>
                                                </td>
                                                <td className="p-3 text-xs text-muted-foreground">
                                                    {song.royaltySplits?.length > 0 ? `${song.royaltySplits.length} splits attached` : '100% Artist'}
                                                </td>
                                                <td className="p-3">
                                                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/10 text-amber-500 mr-2">{song.status}</span>
                                                    {song.shareLink && <span className="text-xs text-blue-500 underline">Links Added</span>}
                                                </td>
                                                <td className="p-3 text-right space-x-2">
                                                    {song.status === 'DRAFT' || song.status === 'PENDING_REVIEW' ? (
                                                        <>
                                                            <button className="text-emerald-500 text-xs font-bold hover:underline">Approve</button>
                                                            <button className="text-red-500 text-xs font-bold hover:underline">Reject</button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button className="text-primary text-xs font-bold hover:underline">Add DSP Links</button>
                                                            <button className="text-primary text-xs font-bold hover:underline">Mark Live</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {activeTab === 'mastering' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Mastering Tasks</h3>
                            <p className="text-sm text-muted-foreground">List of `MASTERING` tasks requested by the artist.</p>
                            {user.requestedTasks?.filter((t: any) => t.type === 'MASTERING').length === 0 ? <p className="text-muted-foreground">No mastering requests.</p> : (
                                <table className="w-full text-left mt-4 border">
                                    <thead className="bg-muted/30">
                                        <tr>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Task ID</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Status</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Assigned Admin</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground text-right">Admin Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {user.requestedTasks?.filter((t: any) => t.type === 'MASTERING').map((t: any) => (
                                            <tr key={t.id} className="hover:bg-muted/10">
                                                <td className="p-3 font-mono text-xs">{t.id}</td>
                                                <td className="p-3 text-xs font-bold">{t.status}</td>
                                                <td className="p-3 text-xs text-muted-foreground">{t.assignedTo?.email || 'Unassigned'}</td>
                                                <td className="p-3 text-right">
                                                    <button className="bg-primary text-primary-foreground px-3 py-1 rounded text-xs font-medium hover:opacity-90 active:scale-95 transition-all">Upload Master</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {activeTab === 'lyrics' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Lyrics → Music Tasks</h3>
                            <p className="text-sm text-muted-foreground">AI Generation tasks.</p>
                            {user.requestedTasks?.filter((t: any) => t.type === 'LYRICS_TO_MUSIC').length === 0 ? <p className="text-muted-foreground">No lyrics to music generation requests.</p> : (
                                <table className="w-full text-left mt-4 border">
                                    <thead className="bg-muted/30">
                                        <tr>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Task ID</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Prompt/Meta</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Status</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground text-right">Admin Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {user.requestedTasks?.filter((t: any) => t.type === 'LYRICS_TO_MUSIC').map((t: any) => (
                                            <tr key={t.id} className="hover:bg-muted/10">
                                                <td className="p-3 font-mono text-xs">{t.id}</td>
                                                <td className="p-3 text-xs text-muted-foreground truncate max-w-[200px]">{t.meta || 'No prompt info'}</td>
                                                <td className="p-3 text-xs font-bold">{t.status}</td>
                                                <td className="p-3 text-right space-x-2">
                                                    <button className="bg-primary/10 text-primary px-3 py-1 rounded text-xs font-medium hover:bg-primary/20 active:scale-95 transition-all">Upload Tracks</button>
                                                    <button className="text-emerald-500 text-xs font-bold hover:underline">Push to Distro</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                    {activeTab === 'cover' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Cover Generation</h3>
                            {user.coverArts?.length === 0 ? <p className="text-muted-foreground">No cover art requests.</p> : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {user.coverArts?.map((cover: any) => (
                                        <div key={cover.id} className="border rounded-xl p-2 bg-muted/20">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={cover.imageUrl} alt="Generated Cover" className="w-full aspect-square object-cover rounded-lg bg-muted" />
                                            <p className="mt-2 text-xs text-muted-foreground truncate" title={cover.prompt}>{cover.prompt || 'Manual Upload'}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'withdrawals' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Withdrawal Requests</h3>
                            {user.withdrawalRequests?.length === 0 ? <p className="text-muted-foreground">No withdrawal requests.</p> : (
                                <table className="w-full text-left">
                                    <thead className="bg-muted/30">
                                        <tr>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Amount</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Date</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground">Status</th>
                                            <th className="p-3 text-sm font-semibold text-muted-foreground text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {user.withdrawalRequests?.map((w: any) => (
                                            <tr key={w.id} className="hover:bg-muted/10">
                                                <td className="p-3 font-bold">${w.amount.toFixed(2)}</td>
                                                <td className="p-3 text-xs text-muted-foreground">{new Date(w.createdAt).toLocaleDateString()}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${w.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                                                        {w.status}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right space-x-2">
                                                    {w.status === 'PENDING' && (
                                                        <>
                                                            <button className="text-emerald-500 text-xs font-bold hover:underline">Approve</button>
                                                            <button className="text-primary text-xs font-bold hover:underline">Mark Paid</button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}
