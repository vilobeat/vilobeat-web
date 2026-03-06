'use client';

import { useState, useEffect } from "react";
import { Loader2, Mic, CheckCircle, Clock, UploadCloud, UserCircle } from "lucide-react";

export default function LyricsToMusicQueuePage() {
    const [tasks, setTasks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");
    const [updating, setUpdating] = useState<string | null>(null);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/tasks/queue?type=LYRICS_TO_MUSIC&status=${filter}`);
            const data = await res.json();
            setTasks(data.tasks || []);
        } catch (error) {
            console.error("Failed to fetch lyrics queue", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, [filter]);

    const handleAction = async (id: string, action: string, payload: any) => {
        setUpdating(id);
        try {
            await fetch(`/api/admin/tasks/${id}/action`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action, payload })
            });
            await fetchTasks();
        } catch (e) {
            console.error(e);
        } finally {
            setUpdating(null);
        }
    };

    const statusFilters = ['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'];

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Mic className="text-primary" /> Lyrics → Music Queue
                    </h2>
                    <p className="text-muted-foreground text-sm">Monitor Suno/Udio AI generation requests and deliver stems</p>
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
                ) : tasks.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">No generation tasks found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 border-b border-border/50">
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Artist</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Prompt & Lyrics</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">Status</th>
                                    <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {tasks.map(task => (
                                    <tr key={task.id} className="hover:bg-muted/10 transition-colors">
                                        <td className="p-4 w-48">
                                            <div className="font-bold text-sm">{task.user?.artistName || "Unknown Artist"}</div>
                                            <div className="text-xs text-muted-foreground truncate w-32">{task.user?.email}</div>
                                            <div className="text-xs text-muted-foreground mt-2">Requested: {new Date(task.createdAt).toLocaleDateString()}</div>
                                        </td>
                                        <td className="p-4 max-w-sm">
                                            {task.meta ? (
                                                <div className="bg-muted/30 p-3 rounded-lg border border-border/50 text-sm font-mono text-foreground/80 max-h-32 overflow-y-auto whitespace-pre-wrap">
                                                    {task.meta}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">No context provided</span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ${task.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-500' :
                                                    task.status === 'IN_PROGRESS' ? 'bg-blue-500/10 text-blue-500' :
                                                        'bg-amber-500/10 text-amber-500'
                                                }`}>
                                                {task.status === 'COMPLETED' && <CheckCircle size={12} />}
                                                {task.status === 'IN_PROGRESS' && <Clock size={12} />}
                                                {task.status.replace(/_/g, ' ')}
                                            </span>
                                            {task.assignedTo && (
                                                <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground bg-muted/50 w-fit px-1.5 py-0.5 rounded">
                                                    <UserCircle size={10} /> {task.assignedTo.artistName || task.assignedTo.email}
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 text-right space-x-2 w-48">
                                            {updating === task.id ? <Loader2 className="animate-spin inline text-primary block ml-auto" size={16} /> : (
                                                <div className="flex flex-col gap-2 items-end">
                                                    {task.status === 'PENDING' && (
                                                        <button onClick={() => handleAction(task.id, 'ASSIGN_AND_START', {})} className="text-xs font-bold text-primary hover:bg-primary/10 px-2 py-1 rounded transition-colors w-full text-right outline-none">Start Generation</button>
                                                    )}
                                                    {task.status === 'IN_PROGRESS' && (
                                                        <button onClick={() => {
                                                            const urlA = prompt("Enter Version A Audio URL:");
                                                            const urlB = prompt("Enter Version B Audio URL (optional):");
                                                            if (urlA) {
                                                                handleAction(task.id, 'UPLOAD_AND_COMPLETE', { tracks: { versionA: urlA, versionB: urlB } });
                                                            }
                                                        }} className="text-xs font-bold bg-primary text-primary-foreground flex justify-center items-center gap-1 px-3 py-1.5 rounded-lg hover:opacity-90 active:scale-95 transition-all w-full shadow-sm">
                                                            <UploadCloud size={14} /> Deliver Tracks
                                                        </button>
                                                    )}
                                                    {task.status === 'COMPLETED' && (
                                                        <span className="text-xs text-muted-foreground font-bold tracking-wider mr-2">DELIVERED</span>
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
