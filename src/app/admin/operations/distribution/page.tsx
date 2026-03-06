'use client';

import { useState, useEffect } from "react";
import { Loader2, Music, CheckCircle, Clock, XCircle, Search, Link as LinkIcon } from "lucide-react";

export default function DistributionQueuePage() {
    const [songs, setSongs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchSongs = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/songs/queue?status=${filter}`);
            const data = await res.json();
            setSongs(data.songs || []);
        } catch (error) {
            console.error("Failed to fetch distribution queue", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSongs();
    }, [filter]);

    const handleAction = async (id: string, action: string, payload: any) => {
        setUpdating(id);
        try {
            await fetch(`/api/admin/songs/${id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, payload })
            });
            await fetchSongs();
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(null);
        }
    };

    const statusFilters = ['ALL', 'PENDING_REVIEW', 'APPROVED', 'LIVE', 'REJECTED'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Music className="text-primary" /> Distribution Queue
                    </h2>
                    <p className="text-muted-foreground text-sm">Review incoming releases and manage live tracks.</p>
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
                ) : songs.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">No distribution requests found for this filter.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 border-b border-border/50">
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Artist</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Release Info</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {songs.map(song => (
                                    <tr key={song.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-sm">{song.artist?.artistName || "Unknown Artist"}</div>
                                            <div className="text-xs text-muted-foreground truncate w-32">{song.artist?.email}</div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-sm text-foreground/90">{song.title}</div>
                                            <div className="text-xs text-muted-foreground mt-0.5">Submitted: {new Date(song.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${song.status === 'LIVE' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    song.status === 'PENDING_REVIEW' ? 'bg-amber-500/10 text-amber-500' :
                                                        song.status === 'REJECTED' ? 'bg-red-500/10 text-red-500' :
                                                            'bg-primary/10 text-primary'
                                                }`}>
                                                {song.status === 'LIVE' && <CheckCircle size={12} />}
                                                {song.status === 'PENDING_REVIEW' && <Clock size={12} />}
                                                {song.status === 'REJECTED' && <XCircle size={12} />}
                                                {song.status.replace(/_/g, ' ')}
                                            </span>
                                            {song.shareLink && (
                                                <a href={song.shareLink} target="_blank" rel="noreferrer" className="block mt-1 text-[10px] text-blue-500 hover:underline flex items-center gap-1">
                                                    <LinkIcon size={10} /> View URLs
                                                </a>
                                            )}
                                        </td>
                                        <td className="p-4 text-right space-x-2">
                                            {updating === song.id ? <Loader2 className="animate-spin inline text-primary" size={16} /> : (
                                                <>
                                                    {(song.status === 'PENDING_REVIEW' || song.status === 'DRAFT') && (
                                                        <>
                                                            <button onClick={() => handleAction(song.id, 'UPDATE_STATUS', { status: 'APPROVED' })} className="text-xs font-bold text-emerald-500 hover:bg-emerald-500/10 px-2 py-1 rounded transition-colors">Approve</button>
                                                            <button onClick={() => handleAction(song.id, 'UPDATE_STATUS', { status: 'REJECTED' })} className="text-xs font-bold text-red-500 hover:bg-red-500/10 px-2 py-1 rounded transition-colors">Reject</button>
                                                        </>
                                                    )}
                                                    {song.status === 'APPROVED' && (
                                                        <button onClick={() => {
                                                            const link = prompt("Enter Smart Link URL (e.g. Ditto / DistroKid link):");
                                                            if (link) {
                                                                handleAction(song.id, 'ADD_LINKS', { link });
                                                                handleAction(song.id, 'UPDATE_STATUS', { status: 'LIVE' });
                                                            }
                                                        }} className="text-xs font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:opacity-90 active:scale-95 transition-all">Add Links & Go Live</button>
                                                    )}
                                                </>
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
