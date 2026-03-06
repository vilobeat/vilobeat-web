'use client';

import { useState, useEffect } from 'react';
import { Megaphone, Send, Users, History, Mail, Bell, Smartphone, Eye } from 'lucide-react';

export default function BroadcastStudioPage() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [targetAudience, setTargetAudience] = useState('ALL');
    const [actionUrl, setActionUrl] = useState('');
    const [channels, setChannels] = useState({
        inApp: true,
        email: false,
        push: false
    });

    const [status, setStatus] = useState<'IDLE' | 'SENDING' | 'SUCCESS' | 'ERROR'>('IDLE');
    const [stats, setStats] = useState({ notified: 0 });
    const [errorMsg, setErrorMsg] = useState('');

    const [scheduledFor, setScheduledFor] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    const AUDIENCES = [
        { id: 'ALL', label: 'All Users', desc: 'Everyone registered on ViloBeat' },
        { id: 'ARTISTS_ONLY', label: 'Artists Only', desc: 'Active artists excluding staff' },
        { id: 'PRO_ONLY', label: 'Pro Tier', desc: 'Users on the Pro subscription' },
        { id: 'ELITE_ONLY', label: 'Elite Tier', desc: 'Users on the Elite subscription' },
        { id: 'EXPERT_ONLY', label: 'Expert Tier', desc: 'Users on the Expert subscription' }
    ];

    useEffect(() => {
        fetchHistory();
    }, []);

    async function fetchHistory() {
        try {
            const res = await fetch('/api/admin/broadcast/history');
            const data = await res.json();
            if (data.broadcasts) setHistory(data.broadcasts);
        } catch (e) {
            console.error(e);
        }
        setLoadingHistory(false);
    }

    async function handleBroadcast(e: React.FormEvent) {
        e.preventDefault();

        if (!title || !message) {
            setErrorMsg('Title and Message are required.');
            setStatus('ERROR');
            setTimeout(() => setStatus('IDLE'), 3000);
            return;
        }

        if (!channels.inApp && !channels.email && !channels.push) {
            setErrorMsg('Select at least one delivery channel.');
            setStatus('ERROR');
            setTimeout(() => setStatus('IDLE'), 3000);
            return;
        }

        setStatus('SENDING');
        try {
            const res = await fetch('/api/admin/broadcast', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    message,
                    targetAudience,
                    actionUrl: actionUrl || null,
                    scheduledFor: scheduledFor || null,
                    channels,
                    type: 'SYSTEM'
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to send broadcast');

            setStats({ notified: data.usersNotified });
            setStatus('SUCCESS');
            fetchHistory();

            setTimeout(() => {
                setStatus('IDLE');
                setTitle('');
                setMessage('');
                setActionUrl('');
                setScheduledFor('');
            }, 4000);

        } catch (e: any) {
            console.error(e);
            setErrorMsg(e.message);
            setStatus('ERROR');
            setTimeout(() => setStatus('IDLE'), 3000);
        }
    }

    return (
        <div className="space-y-8 font-grotesk animate-in fade-in zoom-in duration-500">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
                        Broadcast Studio
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        Send flat, clean, multi-channel announcements.
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Compose Pane (Left) */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-card border border-border p-6 sm:p-8 rounded-none">
                        <form onSubmit={handleBroadcast} className="space-y-6">

                            <div className="space-y-5">
                                <div className="group">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Headline</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        className="w-full px-4 py-3 text-base bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
                                        placeholder="Summer Master-Class Series is LIVE!"
                                        required
                                    />
                                </div>

                                <div className="group">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Story</label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        rows={5}
                                        className="w-full px-4 py-3 text-sm bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors resize-none"
                                        placeholder="Type your message here..."
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="group">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Action Link</label>
                                        <input
                                            type="url"
                                            value={actionUrl}
                                            onChange={(e) => setActionUrl(e.target.value)}
                                            className="w-full px-4 py-3 text-sm bg-background border border-border text-foreground focus:outline-none focus:border-primary transition-colors"
                                            placeholder="https://vilobeat.com/promo"
                                        />
                                    </div>
                                    <div className="group">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">Schedule For</label>
                                        <input
                                            type="datetime-local"
                                            value={scheduledFor}
                                            onChange={(e) => setScheduledFor(e.target.value)}
                                            className="w-full px-4 py-3 text-sm bg-background border border-border text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            <hr className="border-border/50" />

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 block flex items-center gap-2">
                                        <Users size={14} /> Target Audience
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {AUDIENCES.map((aud) => (
                                            <div
                                                key={aud.id}
                                                onClick={() => setTargetAudience(aud.id)}
                                                className={`cursor-pointer p-3 border transition-colors flex items-center justify-between ${targetAudience === aud.id ? 'bg-primary text-white border-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}
                                            >
                                                <div className="text-sm font-bold">{aud.label}</div>
                                                <div className="text-xs opacity-80">{aud.desc}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 block flex items-center gap-2">
                                        <Send size={14} /> Routes
                                    </label>
                                    <div className="space-y-2">
                                        <label className={`flex items-center justify-between p-3 border cursor-pointer transition-colors ${channels.inApp ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}>
                                            <div className="flex items-center gap-3">
                                                <Bell size={16} />
                                                <span className="text-sm font-bold">In-App</span>
                                            </div>
                                            <input type="checkbox" checked={channels.inApp} onChange={e => setChannels({ ...channels, inApp: e.target.checked })} className="w-4 h-4 rounded-none appearance-none checked:bg-primary transition-colors" />
                                        </label>
                                        <label className={`flex items-center justify-between p-3 border cursor-pointer transition-colors ${channels.email ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}>
                                            <div className="flex items-center gap-3">
                                                <Mail size={16} />
                                                <span className="text-sm font-bold">Email Blast</span>
                                            </div>
                                            <input type="checkbox" checked={channels.email} onChange={e => setChannels({ ...channels, email: e.target.checked })} className="w-4 h-4 rounded-none appearance-none checked:bg-primary transition-colors" />
                                        </label>
                                        <label className={`flex items-center justify-between p-3 border cursor-pointer transition-colors ${channels.push ? 'bg-primary/10 border-primary text-primary' : 'bg-background border-border text-muted-foreground hover:bg-muted'}`}>
                                            <div className="flex items-center gap-3">
                                                <Smartphone size={16} />
                                                <span className="text-sm font-bold">Push / SMS</span>
                                            </div>
                                            <input type="checkbox" checked={channels.push} onChange={e => setChannels({ ...channels, push: e.target.checked })} className="w-4 h-4 rounded-none appearance-none checked:bg-primary transition-colors" />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex items-center justify-between border-t border-border/50 pt-6">
                                <div className="flex-1">
                                    {status === 'ERROR' && <p className="text-rose-500 text-sm font-bold">{errorMsg}</p>}
                                    {status === 'SUCCESS' && <p className="text-emerald-500 text-sm font-bold">Fired to {stats.notified} users.</p>}
                                </div>
                                <button
                                    type="submit"
                                    disabled={status === 'SENDING' || (!title || !message)}
                                    className="bg-primary text-white px-8 py-3 font-bold text-sm flex items-center gap-2 transition-all hover:bg-primary/80 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                >
                                    {status === 'SENDING' ? (
                                        <>
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <Send size={16} /> Launch Campaign
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Live Preview (Right) */}
                <div className="lg:col-span-5 space-y-6">
                    <div className="sticky top-6">
                        <div className="bg-card border border-border p-4">
                            <div className="bg-muted/10 p-6 h-[400px] flex flex-col justify-center relative overflow-hidden">

                                <div className="relative z-10 w-full max-w-sm mx-auto">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">Live Preview</div>
                                    </div>

                                    <div className="bg-background border border-border p-5">
                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 bg-primary/10 flex items-center justify-center flex-shrink-0">
                                                <Megaphone size={18} className="text-primary" />
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <h3 className="font-bold text-foreground text-sm truncate">{title || 'Your Title Here'}</h3>
                                                <p className="text-xs text-muted-foreground mt-1 line-clamp-3 leading-relaxed">
                                                    {message || 'Type a message to see how it looks...'}
                                                </p>
                                                {actionUrl && (
                                                    <div className="mt-3 inline-block bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 border border-primary/20">
                                                        View Link
                                                    </div>
                                                )}
                                                <div className="mt-4 text-[10px] text-muted-foreground font-mono opacity-50 uppercase font-bold">
                                                    Just Now
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 bg-card border border-border p-6">
                            <h3 className="font-bold mb-4 flex items-center gap-2 text-sm uppercase tracking-wider text-muted-foreground"><History size={16} /> Recent History</h3>
                            <div className="space-y-3">
                                {loadingHistory ? (
                                    <div className="py-4 flex justify-center text-muted-foreground text-sm">Loading...</div>
                                ) : history.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center">No recent broadcasts</p>
                                ) : history.slice(0, 3).map((b, i) => (
                                    <div key={b.id || i} className="flex items-center gap-3 p-3 bg-muted/20 border border-border/50">
                                        <div className="w-8 h-8 bg-background border border-border flex items-center justify-center text-muted-foreground flex-shrink-0">
                                            {b.channels?.email ? <Mail size={12} /> : <Bell size={12} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs font-bold truncate">{b.title}</div>
                                            <div className="text-[10px] text-muted-foreground truncate">{new Date(b.sentAt).toLocaleDateString()} • {b.audience}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
