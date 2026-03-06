'use client';

import { useEffect, useState } from 'react';
import { Send, RefreshCw, CheckCircle2, XCircle, Clock, Loader2, Music } from 'lucide-react';

interface Task {
    id: string;
    type: string;
    status: string;
    createdAt: string;
    song?: {
        title: string;
        genre: string | null;
        subgenre?: string | null;
        labelName?: string | null;
        composer?: string | null;
        producer?: string | null;
        explicit?: boolean;
        coverUrl?: string | null;
        audioUrl?: string | null;
    };
    meta?: any;
    requestedBy?: { email: string };
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: any }> = {
    PENDING: { color: 'text-amber-400', bg: 'bg-amber-400/10', icon: Clock },
    IN_PROGRESS: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: Loader2 },
    COMPLETED: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: CheckCircle2 },
    REJECTED: { color: 'text-red-400', bg: 'bg-red-400/10', icon: XCircle },
};

export default function TaskQueuePage({
    taskType,
    title,
    description,
}: {
    taskType: string;
    title: string;
    description: string;
}) {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [updating, setUpdating] = useState<string | null>(null);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<{ [key: string]: boolean }>({});

    async function uploadToR2(file: File) {
        const res = await fetch('/api/upload-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ filename: file.name, contentType: file.type })
        });
        const { uploadUrl, fileUrl } = await res.json();
        await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } });
        return fileUrl;
    }

    async function completeMasteringTask(id: string, file: File | null) {
        if (!file) return window.alert("Please select a mastered audio file");
        setUploadProgress({ ...uploadProgress, [id]: true });
        try {
            const masteredAudioUrl = await uploadToR2(file);
            await fetch('/api/admin/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    status: 'COMPLETED',
                    meta: { masteredAudioUrl }
                }),
            });
            await fetchTasks();
        } catch (e) {
            console.error('Failed to complete mastering:', e);
            window.alert("Upload failed.");
        }
        setUploadProgress({ ...uploadProgress, [id]: false });
        setUpdating(null);
    }

    async function completeLyricsMusicTask(id: string, fileA: File | null, fileB: File | null) {
        if (!fileA || !fileB) return window.alert("Please select both audio options");
        setUploadProgress({ ...uploadProgress, [id]: true });
        try {
            const [urlA, urlB] = await Promise.all([uploadToR2(fileA), uploadToR2(fileB)]);
            await fetch('/api/admin/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    status: 'COMPLETED',
                    meta: { optionAUrl: urlA, optionBUrl: urlB }
                }),
            });
            await fetchTasks();
        } catch (e) {
            console.error('Failed to complete lyrics music:', e);
            window.alert("Upload failed.");
        }
        setUploadProgress({ ...uploadProgress, [id]: false });
        setUpdating(null);
    }

    useEffect(() => {
        fetchTasks();
    }, []);

    async function fetchTasks() {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/tasks?type=${taskType}`);
            const data = await res.json();
            setTasks(data.tasks || []);
        } catch (e) {
            console.error('Failed to fetch tasks:', e);
        }
        setLoading(false);
    }

    async function updateTask(id: string, status: string) {
        setUpdating(id);
        try {
            await fetch('/api/admin/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status }),
            });
            await fetchTasks();
        } catch (e) {
            console.error('Failed to update task:', e);
        }
        setUpdating(null);
    }

    async function completeDistributionTask(id: string, isrc: string, releaseDate: string) {
        try {
            await fetch('/api/admin/tasks', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    status: 'COMPLETED',
                    songData: { isrc, releaseDate }
                }),
            });
            await fetchTasks();
        } catch (e) {
            console.error('Failed to update distribution task:', e);
        }
        setUpdating(null);
    }

    const filteredTasks = filter === 'ALL' ? tasks : tasks.filter((t) => t.status === filter);
    const counts = {
        ALL: tasks.length,
        PENDING: tasks.filter((t) => t.status === 'PENDING').length,
        IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
        COMPLETED: tasks.filter((t) => t.status === 'COMPLETED').length,
    };

    return (
        <div className="space-y-8 animate-in fade-in zoom-in duration-500">
            <header>
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
                        <Send size={22} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-heading">{title}</h1>
                        <p className="text-sm text-muted-foreground opacity-60">{description}</p>
                    </div>
                </div>
            </header>

            {/* Filter Tabs */}
            <div className="flex gap-2 flex-wrap">
                {(['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${filter === status
                            ? 'bg-primary text-white shadow-soft'
                            : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30'
                            }`}
                    >
                        {status.replace('_', ' ')}
                        <span className="ml-2 opacity-60">({counts[status] ?? 0})</span>
                    </button>
                ))}
                <button
                    onClick={fetchTasks}
                    className="ml-auto px-4 py-2 bg-card border border-border rounded-xl text-sm font-medium hover:text-primary transition-colors flex items-center gap-2"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            {/* Task List */}
            <div className="bg-card rounded-3xl border border-border shadow-soft overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : filteredTasks.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground opacity-50">
                        <Send size={48} className="mx-auto mb-4 opacity-30" />
                        <p className="font-medium">No tasks found</p>
                        <p className="text-sm mt-1">Tasks will appear here when artists submit requests</p>
                    </div>
                ) : (
                    <div className="divide-y divide-border">
                        {/* Table Header */}
                        <div className="grid grid-cols-[1fr_1fr_140px_140px_60px] gap-4 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-60 bg-background/30">
                            <span>Artist</span>
                            <span>Song</span>
                            <span>Status</span>
                            <span>Submitted</span>
                            <span className="text-right">More</span>
                        </div>

                        {filteredTasks.map((task) => {
                            const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.PENDING;
                            const StatusIcon = cfg.icon;
                            return (
                                <div key={task.id} className="contents border-b border-border/50">
                                    <div
                                        onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}
                                        className={`grid grid-cols-[1fr_1fr_140px_140px_60px] gap-4 px-6 py-4 items-center hover:bg-background/30 transition-colors cursor-pointer ${expandedTaskId === task.id ? 'bg-background/20' : ''}`}
                                    >
                                        {/* Artist */}
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                                                {task.requestedBy?.email?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-semibold truncate">{task.requestedBy?.email || 'Unknown'}</p>
                                                <p className="text-xs text-muted-foreground opacity-50 font-mono">{task.id.slice(0, 8)}</p>
                                            </div>
                                        </div>

                                        {/* Song */}
                                        <div className="truncate">
                                            <p className="text-sm font-medium truncate">{task.song?.title || '—'}</p>
                                            <p className="text-xs text-muted-foreground opacity-50">{task.song?.genre || 'N/A'}</p>
                                        </div>

                                        {/* Status */}
                                        <div className={`flex items-center gap-1.5 text-xs font-bold ${cfg.color}`}>
                                            <StatusIcon size={14} />
                                            {task.status.replace('_', ' ')}
                                        </div>

                                        {/* Date */}
                                        <span className="text-xs text-muted-foreground opacity-60">
                                            {new Date(task.createdAt).toLocaleDateString()}
                                        </span>

                                        {/* Actions */}
                                        <div className="flex items-center justify-end">
                                            <button className="p-2 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform ${expandedTaskId === task.id ? 'rotate-180' : ''}`}><polyline points="6 9 12 15 18 9"></polyline></svg>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Expanded Details Panel */}
                                    {expandedTaskId === task.id && (
                                        <div className="col-span-1 border-t border-border/50 bg-background/30 p-6 flex flex-col gap-6 animate-in slide-in-from-top-2 duration-200">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                                {/* Left: Metadata */}
                                                <div>
                                                    <h4 className="text-sm font-bold mb-4 text-foreground/90">Detailed Metadata</h4>
                                                    <dl className="space-y-3 text-sm">
                                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground">Title</dt><dd className="font-medium col-span-2">{task.song?.title || 'N/A'}</dd></div>
                                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground">Genre</dt><dd className="font-medium col-span-2">{task.song?.genre || 'N/A'} {task.song?.subgenre ? `/ ${task.song.subgenre}` : ''}</dd></div>
                                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground">Label</dt><dd className="font-medium col-span-2">{task.song?.labelName || 'Independent'}</dd></div>
                                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground">Credits</dt><dd className="font-medium col-span-2 text-xs">Prod: {task.song?.producer || 'N/A'}<br />Comp: {task.song?.composer || 'N/A'}</dd></div>
                                                        <div className="grid grid-cols-3"><dt className="text-muted-foreground">Explicit</dt><dd className="font-medium col-span-2">{task.song?.explicit ? 'Yes' : 'No'}</dd></div>
                                                    </dl>
                                                </div>

                                                {/* Right: Media & Actions */}
                                                <div>
                                                    <h4 className="text-sm font-bold mb-4 text-foreground/90">Media & Assets</h4>
                                                    <div className="flex gap-4 mb-6">
                                                        {task.song?.coverUrl ? (
                                                            <img src={task.song.coverUrl} className="w-24 h-24 rounded-lg bg-black/10 object-cover border border-border" />
                                                        ) : (
                                                            <div className="w-24 h-24 rounded-lg bg-primary/10 flex items-center justify-center border border-border/50"><Music size={24} className="text-primary/50" /></div>
                                                        )}
                                                        <div className="flex-1 space-y-2">
                                                            <button className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-white/5 flex items-center justify-center gap-2 transition-colors">
                                                                <Music size={16} /> Play Audio
                                                            </button>
                                                            <button className="w-full px-3 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-white/5 flex items-center justify-center gap-2 transition-colors">
                                                                <Send size={16} /> Download ZIP
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Quick Actions */}
                                                    <div className="p-4 bg-background/50 rounded-xl border border-border/50">
                                                        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Admin Actions</h4>
                                                        <div className="flex items-center gap-2">
                                                            {task.status === 'PENDING' && (
                                                                <>
                                                                    <button onClick={() => updateTask(task.id, 'IN_PROGRESS')} disabled={updating === task.id} className="flex-1 px-3 py-2 bg-blue-500/10 text-blue-400 text-sm font-bold rounded-lg hover:bg-blue-500/20 transition-colors disabled:opacity-40">Start Processing</button>
                                                                    <button onClick={() => updateTask(task.id, 'REJECTED')} disabled={updating === task.id} className="px-3 py-2 bg-red-500/10 text-red-400 text-sm font-bold rounded-lg hover:bg-red-500/20 transition-colors disabled:opacity-40">Reject</button>
                                                                </>
                                                            )}
                                                            {task.status === 'IN_PROGRESS' && (
                                                                <button onClick={() => {
                                                                    if (taskType === 'DISTRIBUTION' || taskType === 'MASTERING' || taskType === 'LYRICS_TO_MUSIC') {
                                                                        setUpdating(task.id === updating ? null : task.id);
                                                                    } else {
                                                                        updateTask(task.id, 'COMPLETED');
                                                                    }
                                                                }} className="flex-1 px-3 py-2 bg-emerald-500/10 text-emerald-400 text-sm font-bold rounded-lg hover:bg-emerald-500/20 transition-colors cursor-pointer">Mark Ready / Complete</button>
                                                            )}
                                                            {(task.status === 'COMPLETED' || task.status === 'REJECTED') && (
                                                                <span className="text-sm text-muted-foreground font-semibold py-1">Action Complete</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expansion panel for DISTRIBUTION completion */}
                                            {
                                                updating === task.id && task.status === 'IN_PROGRESS' && taskType === 'DISTRIBUTION' && (
                                                    <div className="mt-4 border-t border-border/50 pt-4 bg-background/50 rounded-xl p-4">
                                                        <h4 className="text-sm font-bold mb-3 text-emerald-400">Finalize Distribution</h4>
                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                            <div>
                                                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Assigned ISRC</label>
                                                                <input type="text" id={`isrc-${task.id}`} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors" placeholder="e.g. US1234567890" />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Actual Release Date</label>
                                                                <input type="date" id={`date-${task.id}`} className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:border-primary focus:outline-none transition-colors" defaultValue={task.createdAt.split('T')[0]} />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => setUpdating(null)}
                                                                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/5 rounded-lg transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const isrc = (document.getElementById(`isrc-${task.id}`) as HTMLInputElement)?.value;
                                                                    const date = (document.getElementById(`date-${task.id}`) as HTMLInputElement)?.value;
                                                                    completeDistributionTask(task.id, isrc, date);
                                                                }}
                                                                className="px-4 py-2 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg shadow-soft transition-colors"
                                                            >
                                                                Upload API & Close Event
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Expansion panel for MASTERING completion */}
                                            {
                                                updating === task.id && task.status === 'IN_PROGRESS' && taskType === 'MASTERING' && (
                                                    <div className="mt-4 border-t border-border/50 pt-4 bg-background/50 rounded-xl p-4">
                                                        <h4 className="text-sm font-bold mb-3 text-emerald-400">Upload Mastered Audio</h4>
                                                        <div className="mb-4">
                                                            <input type="file" accept="audio/*" id={`master-${task.id}`} className="w-full text-sm text-foreground file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90" />
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => setUpdating(null)}
                                                                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/5 rounded-lg transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const input = document.getElementById(`master-${task.id}`) as HTMLInputElement;
                                                                    completeMasteringTask(task.id, input?.files?.[0] || null);
                                                                }}
                                                                disabled={uploadProgress[task.id]}
                                                                className="px-4 py-2 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg shadow-soft transition-colors disabled:opacity-50"
                                                            >
                                                                {uploadProgress[task.id] ? 'Uploading...' : 'Complete Task & Send to User'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Expansion panel for LYRICS_TO_MUSIC completion */}
                                            {
                                                updating === task.id && task.status === 'IN_PROGRESS' && taskType === 'LYRICS_TO_MUSIC' && (
                                                    <div className="mt-4 border-t border-border/50 pt-4 bg-background/50 rounded-xl p-4">
                                                        <h4 className="text-sm font-bold mb-3 text-emerald-400">Upload 2 Musical Options</h4>
                                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                                            <div>
                                                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Option A</label>
                                                                <input type="file" accept="audio/*" id={`optA-${task.id}`} className="w-full text-xs text-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                                                            </div>
                                                            <div>
                                                                <label className="text-xs font-semibold text-muted-foreground mb-1 block">Option B</label>
                                                                <input type="file" accept="audio/*" id={`optB-${task.id}`} className="w-full text-xs text-foreground file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-primary/20 file:text-primary hover:file:bg-primary/30" />
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => setUpdating(null)}
                                                                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:bg-white/5 rounded-lg transition-colors"
                                                            >
                                                                Cancel
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    const inputA = document.getElementById(`optA-${task.id}`) as HTMLInputElement;
                                                                    const inputB = document.getElementById(`optB-${task.id}`) as HTMLInputElement;
                                                                    completeLyricsMusicTask(task.id, inputA?.files?.[0] || null, inputB?.files?.[0] || null);
                                                                }}
                                                                disabled={uploadProgress[task.id]}
                                                                className="px-4 py-2 text-xs font-bold bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg shadow-soft transition-colors disabled:opacity-50"
                                                            >
                                                                {uploadProgress[task.id] ? 'Uploading Both...' : 'Complete Task & Send to User'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
