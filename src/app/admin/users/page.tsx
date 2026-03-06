'use client';

import { useState, useEffect } from "react";
import Link from 'next/link';
import { Search, Loader2, User as UserIcon, ShieldAlert, BadgeCheck } from "lucide-react";

interface UserData {
    id: string;
    email: string;
    artistName?: string;
    role: string;
    subscriptionTier: string;
    createdAt: string;
    dspUnlocked: boolean;
    dspUnlockPercentage: number;
    quotaUsedPercentage: number;
    walletBalance: number;
    status: string;
    quota: any;
    _count: { songs: number; requestedTasks: number };
}

export default function UsersPage() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // Filters
    const [filterTier, setFilterTier] = useState<string>("ALL");
    const [filterPending, setFilterPending] = useState(false);
    const [filterWallet, setFilterWallet] = useState(false);
    const [filterQuota, setFilterQuota] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                if (filterTier !== "ALL") params.append("tier", filterTier);
                if (filterPending) params.append("hasPending", "true");
                if (filterWallet) params.append("highWallet", "true");
                if (filterQuota) params.append("highQuota", "true");

                const res = await fetch(`/api/admin/users?${params.toString()}`);
                const data = await res.json();
                setUsers(data.users || []);
            } catch (error) {
                console.error("Failed to fetch users", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [filterTier, filterPending, filterWallet, filterQuota]);

    const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-heading">Users Management</h1>
                    <p className="text-muted-foreground mt-1">Manage global users, quotas, and permissions.</p>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2">
                    <div className="relative shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                        <input
                            type="text"
                            placeholder="Search email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 rounded-xl bg-card border border-border focus:outline-none focus:ring-2 focus:ring-primary/50 w-48 text-sm"
                        />
                    </div>

                    <select
                        value={filterTier}
                        onChange={e => setFilterTier(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-card border border-border focus:outline-none text-sm shrink-0"
                    >
                        <option value="ALL">All Tiers</option>
                        <option value="BASIC">Basic</option>
                        <option value="PRO">Pro</option>
                        <option value="ELITE">Elite</option>
                        <option value="EXPERT">Expert</option>
                    </select>

                    <button
                        onClick={() => setFilterQuota(!filterQuota)}
                        className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors shrink-0 ${filterQuota ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-card border-border hover:bg-muted'}`}
                    >
                        High Quota Usage
                    </button>

                    <button
                        onClick={() => setFilterPending(!filterPending)}
                        className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors shrink-0 ${filterPending ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-card border-border hover:bg-muted'}`}
                    >
                        Pending Requests
                    </button>

                    <button
                        onClick={() => setFilterWallet(!filterWallet)}
                        className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors shrink-0 ${filterWallet ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-card border-border hover:bg-muted'}`}
                    >
                        High Wallet Balance
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary" /></div>
            ) : (
                <div className="bg-card rounded-2xl border border-border/40 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="p-4 font-semibold text-sm text-muted-foreground">User</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground">Tier</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground">Quota Usage</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground">DSP Unlock %</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground">Wallet</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground">Status</th>
                                <th className="p-4 font-semibold text-sm text-muted-foreground">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <UserIcon size={16} />
                                            </div>
                                            <div className="min-w-[120px]">
                                                <Link href={`/admin/users/${user.id}`} className="font-bold hover:text-primary transition-colors block truncate">
                                                    {user.artistName || "No Name"}
                                                </Link>
                                                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
                                                {user.role !== 'ARTIST' && (
                                                    <span className="mt-1 text-[9px] font-bold uppercase tracking-wider bg-accent/10 text-accent px-1.5 py-0.5 rounded-sm inline-block">
                                                        {user.role}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-bold px-2.5 py-1 bg-black/5 dark:bg-white/5 rounded-md border border-border/50 shadow-sm">
                                            {user.subscriptionTier}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 w-24">
                                            <div className="h-2 flex-1 bg-muted rounded-full overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: `${user.quotaUsedPercentage}%` }} />
                                            </div>
                                            <span className="text-xs font-medium text-muted-foreground">{user.quotaUsedPercentage}%</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2 text-sm font-medium">
                                            {user.dspUnlocked ? (
                                                <span className="text-emerald-500 font-bold flex items-center gap-1"><BadgeCheck size={14} /> 100%</span>
                                            ) : (
                                                <span className={`${user.dspUnlockPercentage > 50 ? 'text-amber-500' : 'text-muted-foreground'}`}>{user.dspUnlockPercentage}%</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 font-bold text-sm tracking-tight">${user.walletBalance.toFixed(2)}</td>
                                    <td className="p-4">
                                        <span className={`text-xs font-bold px-2 py-1 rounded-md border ${user.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                user.status === 'Suspended' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                            }`}>
                                            {user.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs font-medium text-muted-foreground">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-muted-foreground">
                                        No users found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
