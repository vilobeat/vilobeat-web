'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        const res = await signIn('credentials', {
            email,
            password,
            redirect: false,
        });

        setLoading(false);

        if (res?.error) {
            setError('Invalid email or password.');
        } else {
            router.push('/admin');
        }
    }

    return (
        <div className="min-h-screen bg-[color:var(--background)] flex items-center justify-center px-4">
            {/* Ambient glow */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-accent/10 blur-[120px]" />
            </div>

            <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
                {/* Logo */}
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-heading font-extrabold">
                        Vilo<span className="text-primary italic">Beat</span>
                    </h1>
                    <p className="text-sm text-muted-foreground mt-2 tracking-widest uppercase font-semibold opacity-60">
                        Admin Portal
                    </p>
                </div>

                {/* Card */}
                <div className="bg-card rounded-3xl p-8 shadow-[0_8px_40px_-4px_rgba(0,0,0,0.4)] border border-border">
                    <h2 className="text-2xl font-heading font-bold mb-1">Sign In</h2>
                    <p className="text-sm text-muted-foreground opacity-70 mb-8">Enter your credentials to continue</p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-80 mb-2 block">
                                Email Address
                            </label>
                            <input
                                id="login-email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                placeholder="admin@vilobeat.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground opacity-80 mb-2 block">
                                Password
                            </label>
                            <input
                                id="login-password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-background/50 border border-border rounded-xl text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-accent/10 text-accent text-sm font-medium px-4 py-3 rounded-xl border border-accent/20">
                                {error}
                            </div>
                        )}

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 bg-primary text-white font-bold rounded-xl shadow-soft hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-xs text-muted-foreground opacity-40 mt-8">
                    © 2026 ViloBeat. All rights reserved.
                </p>
            </div>
        </div>
    );
}
