'use client';

import { useState, useEffect } from "react";
import { Loader2, ImageIcon, CheckCircle, Clock } from "lucide-react";

export default function CoverQueuePage() {
    const [covers, setCovers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    const fetchCovers = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/covers/queue`);
            const data = await res.json();

            // Client side filter
            let items = data.covers || [];
            if (filter !== 'ALL') items = items.filter((c: any) => c.status === filter);
            setCovers(items);
        } catch (error) {
            console.error("Failed to fetch covers queue", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCovers();
    }, [filter]);

    const statusFilters = ['ALL', 'PENDING', 'COMPLETED'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <ImageIcon className="text-primary" /> Cover Generation Queue
                    </h2>
                    <p className="text-muted-foreground text-sm">Review AI generated cover art requests</p>
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

            <div className="bg-card border border-border shadow-soft rounded-2xl overflow-hidden min-h-[400px]">
                {loading ? (
                    <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
                ) : covers.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">No cover requests found.</div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-6">
                        {covers.map(cover => (
                            <div key={cover.id} className="border border-border/50 rounded-2xl p-3 bg-muted/10 flex flex-col hover:border-primary/30 transition-colors">
                                <div className="aspect-square relative rounded-xl overflow-hidden bg-muted mb-3 group">
                                    {cover.imageUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={cover.imageUrl} alt="Cover" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                                            <ImageIcon size={32} className="opacity-20" />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold shadow-md ${cover.status === 'COMPLETED' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'}`}>
                                            {cover.status}
                                        </span>
                                    </div>

                                    {cover.status === 'PENDING' && (
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button className="bg-primary text-white text-xs font-bold px-3 py-1.5 rounded disabled:opacity-50">Upload Manual</button>
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs font-bold truncate">{cover.user?.artistName}</div>
                                <div className="text-[10px] text-muted-foreground line-clamp-2 mt-1" title={cover.prompt}>{cover.prompt || 'No Prompt Provided'}</div>
                                <div className="mt-auto pt-2 text-[10px] text-muted-foreground font-mono">{new Date(cover.createdAt).toLocaleDateString()}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
