'use client';

import { useState, useEffect } from "react";
import { Loader2, Music, Search, DollarSign, Link as LinkIcon, Edit, Activity, CheckCircle, Clock } from "lucide-react";

export default function CentralSongRegistry() {
    const [songs, setSongs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchSongs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/songs`);
            const data = await res.json();
            setSongs(data.songs || []);
        } catch (error) {
            console.error("Failed to fetch songs", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSongs();
    }, []);

    const handleUpdateRevenue = async (id: string) => {
        const amount = prompt("Enter revenue amount to add to this track (in USD):");
        if (!amount || isNaN(Number(amount))) return;

        setUpdating(id);
        try {
            await fetch(`/api/admin/songs/${id}/revenue`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ amount: Number(amount) })
            });
            await fetchSongs();
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(null);
        }
    };

    const handleUpdateLinks = async (id: string, currentLink: string | null) => {
        const link = prompt("Edit DSP Smart Link:", currentLink || "");
        if (link === null) return;

        setUpdating(id);
        try {
            await fetch(`/api/admin/songs/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: 'ADD_LINKS', payload: { link } })
            });
            await fetchSongs();
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(null);
        }
    };

    const filtered = songs.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.artist?.artistName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 font-grotesk animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Music className="text-primary" /> Central Song Registry
                    </h1>
                    <p className="text-muted-foreground mt-1">Global database of all distributed tracks, analytics, and revenue.</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                    <input
                        type="text"
                        placeholder="Search tracks or artists..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-border bg-card rounded-xl shadow-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    />
                </div>
            </div>

            <div className="bg-card border border-border shadow-soft rounded-2xl overflow-hidden">
                {loading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">No songs found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 border-b border-border/50">
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Track & Artist</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Streams/Links</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Revenue</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Admin Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filtered.map(song => (
                                    <tr key={song.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="p-4 w-64">
                                            <div className="font-bold text-sm text-foreground/90">{song.title}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">{song.artist?.artistName || "Unknown Artist"}</div>
                                            <div className="text-[10px] text-muted-foreground mt-1 font-mono">Released: {new Date(song.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] uppercase font-bold tracking-wider ${song.status === 'LIVE' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    song.status === 'PENDING_REVIEW' ? 'bg-amber-500/10 text-amber-500' :
                                                        'bg-primary/10 text-primary'
                                                }`}>
                                                {song.status === 'LIVE' && <CheckCircle size={10} />}
                                                {song.status === 'PENDING_REVIEW' && <Clock size={10} />}
                                                {song.status.replace(/_/g, ' ')}
                                            </span>
                                            <div className="mt-2 text-[10px] text-muted-foreground space-y-0.5">
                                                <div>Audio: <b>{song.audioSource}</b></div>
                                                <div>Splits: <b>{song.royaltySplits?.length || 0} configs</b></div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <Activity size={14} className="text-muted-foreground" />
                                                <span className="text-sm font-bold">0</span> <span className="text-xs text-muted-foreground">Estimated</span>
                                            </div>

                                            {song.shareLink ? (
                                                <a href={song.shareLink} target="_blank" rel="noreferrer" className="flex w-fit items-center gap-1 px-2 py-1 bg-blue-500/10 text-blue-500 rounded text-[10px] font-bold hover:underline transition-all">
                                                    <LinkIcon size={10} /> Smart Link Active
                                                </a>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground px-2 py-1 bg-muted rounded">No links attached</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-lg text-emerald-500">${(song.totalRevenue || 0).toFixed(2)}</div>
                                            <div className="text-[10px] text-muted-foreground">Lifetime Earnings</div>
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            {updating === song.id ? <Loader2 className="animate-spin inline text-primary" size={16} /> : (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleUpdateLinks(song.id, song.shareLink)} className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted active:scale-95 transition-all shadow-sm" title="Edit DSP Links">
                                                        <LinkIcon size={14} />
                                                    </button>
                                                    <button onClick={() => handleUpdateRevenue(song.id)} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white rounded-lg active:scale-95 transition-all shadow-sm text-xs font-bold" title="Add Revenue to Wallet">
                                                        <DollarSign size={14} /> Add Revenue
                                                    </button>
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
