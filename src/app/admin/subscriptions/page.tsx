'use client';

import { Key, Save, AlertCircle } from "lucide-react";

export default function SubscriptionsDashboard() {
    const tiers = [
        {
            name: "Basic",
            distribution: "3 Tracks / month",
            mastering: "3 Tracks / month",
            lyrics: "Basic",
            cover: "Basic",
            dspUnlock: "Requires 12 months or fee",
            color: "bg-green-500/10 text-green-500 border-green-500/20"
        },
        {
            name: "Pro",
            distribution: "5 Tracks / month",
            mastering: "3 Tracks / month",
            lyrics: "Enhanced",
            cover: "Pro Gen",
            dspUnlock: "Instant",
            color: "bg-blue-500/10 text-blue-500 border-blue-500/20"
        },
        {
            name: "Elite",
            distribution: "15 Tracks / month",
            mastering: "10 Tracks / month",
            lyrics: "Advanced",
            cover: "Premium Gen",
            dspUnlock: "Instant",
            color: "bg-purple-500/10 text-purple-500 border-purple-500/20"
        },
        {
            name: "Expert",
            distribution: "Unlimited",
            mastering: "Unlimited",
            lyrics: "Unlimited",
            cover: "Unlimited",
            dspUnlock: "Instant + Priority Support",
            color: "bg-amber-500/10 text-amber-500 border-amber-500/20"
        }
    ];

    const handleSave = () => {
        alert("Subscription limits updated successfully! (Mocked for MVP - currently tied to static logic)");
    };

    return (
        <div className="space-y-6 font-grotesk animate-in fade-in zoom-in duration-500">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Key className="text-primary" /> Subscriptions & Quotas
                    </h1>
                    <p className="text-muted-foreground mt-1">Manage static tier limits and DSP unlock requirements.</p>
                </div>

                <button onClick={handleSave} className="bg-primary text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-sm">
                    <Save size={18} /> Save Global Limits
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {tiers.map((tier) => (
                    <div key={tier.name} className={`border rounded-2xl overflow-hidden shadow-soft bg-card ${tier.color.split(' ')[2] || 'border-border'}`}>
                        <div className={`p-4 ${tier.color} border-b border-inherit bg-opacity-50`}>
                            <h3 className="text-xl font-black uppercase tracking-wider">{tier.name}</h3>
                        </div>
                        <div className="p-5 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Distribution</label>
                                <input type="text" defaultValue={tier.distribution} className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Mastering</label>
                                <input type="text" defaultValue={tier.mastering} className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Lyrics → Music</label>
                                <input type="text" defaultValue={tier.lyrics} className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block mb-1">Cover Generation</label>
                                <input type="text" defaultValue={tier.cover} className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/50" />
                            </div>
                            <div className="pt-2 border-t border-border/50">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">DSP Unlock Rule</label>
                                <textarea defaultValue={tier.dspUnlock} rows={2} className="w-full bg-muted/50 border border-border/50 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex items-start gap-4">
                <AlertCircle className="text-primary mt-1" />
                <div>
                    <h4 className="font-bold text-primary">System Config Note</h4>
                    <p className="text-sm text-primary/80 leading-relaxed mt-1">
                        Editing these fields currently updates the UI labels. To enforce these limits dynamically across the backend logic, a deeper integration with Stripe/Payment processors is required where these inputs push directly to the `SubscriptionConfig` metadata.
                    </p>
                </div>
            </div>
        </div>
    );
}
