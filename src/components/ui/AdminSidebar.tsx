'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, FolderKanban, Music, DollarSign, Key, ShieldCheck, LogOut, ChevronDown, ChevronRight, HardDrive, Megaphone } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState } from 'react';

const SIDENAV = [
    { text: 'Dashboard', icon: LayoutDashboard, href: '/admin' },
    { text: 'Users', icon: Users, href: '/admin/users' },
    {
        text: 'Operations', icon: FolderKanban, href: '/admin/operations',
        subitems: [
            { text: 'Distribution', href: '/admin/operations/distribution' },
            { text: 'Mastering', href: '/admin/operations/mastering' },
            { text: 'Lyrics → Music', href: '/admin/operations/lyrics-to-music' },
            { text: 'Cover Generation', href: '/admin/operations/covers' },
            { text: 'Withdrawals', href: '/admin/operations/withdrawals' },
        ]
    },
    { text: 'Songs', icon: Music, href: '/admin/songs' },
    { text: 'Finance', icon: DollarSign, href: '/admin/finance' },
    { text: 'Subscriptions', icon: Key, href: '/admin/subscriptions' },
    { text: 'Roles', icon: ShieldCheck, href: '/admin/roles' },
    { text: 'Audit Log', icon: HardDrive, href: '/admin/audit' },
    { text: 'Broadcast', icon: Megaphone, href: '/admin/broadcast' },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const [operationsOpen, setOperationsOpen] = useState(pathname.startsWith('/admin/operations'));

    return (
        <aside className="fixed top-0 left-0 h-screen w-64 bg-card border-r border-border flex flex-col z-20 overflow-y-auto">
            <div className="p-8">
                <div className="flex items-center gap-3">
                    <img src="/logo.png" alt="ViloBeat Logo" className="w-10 h-10 object-contain rounded-xl shadow-soft" />
                </div>
                <p className="text-xs text-muted-foreground mt-1 tracking-widest uppercase font-semibold opacity-60">Admin Portal</p>
            </div>

            <nav className="flex-1 px-4 space-y-1 mt-4">
                {SIDENAV.map((item) => {
                    const isActive = item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);

                    if (item.subitems) {
                        return (
                            <div key={item.href} className="flex flex-col mb-2">
                                <button
                                    onClick={() => setOperationsOpen(!operationsOpen)}
                                    className={`group flex items-center justify-between px-3 py-2 rounded-xl transition-all font-medium active:scale-95 ${isActive
                                        ? 'text-primary font-bold'
                                        : 'text-foreground/70 hover:text-foreground'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full transition-colors ${isActive ? 'bg-primary/25 text-primary shadow-sm shadow-primary/20' : 'bg-transparent text-foreground/50 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                            <item.icon size={18} />
                                        </div>
                                        <span className={isActive ? 'text-primary' : ''}>{item.text}</span>
                                    </div>
                                    {operationsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </button>

                                {operationsOpen && (
                                    <div className="ml-12 mt-1 flex flex-col gap-1 border-l-2 border-border pl-2">
                                        {item.subitems.map(sub => {
                                            const subActive = pathname === sub.href;
                                            return (
                                                <Link
                                                    key={sub.href}
                                                    href={sub.href}
                                                    className={`py-2 px-3 rounded-lg text-sm transition-all active:scale-95 ${subActive
                                                        ? 'bg-primary/15 text-primary font-bold'
                                                        : 'text-muted-foreground hover:text-foreground hover:bg-black/5'
                                                        }`}
                                                >
                                                    {sub.text}
                                                </Link>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        )
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`group flex items-center gap-3 px-3 py-2 rounded-xl transition-all font-medium mb-1 active:scale-95 ${isActive
                                ? 'text-primary font-bold'
                                : 'text-foreground/70 hover:text-foreground'
                                }`}
                        >
                            <div className={`p-2 rounded-full transition-colors ${isActive ? 'bg-primary/25 text-primary shadow-sm shadow-primary/20' : 'bg-transparent text-foreground/50 group-hover:bg-primary/10 group-hover:text-primary'}`}>
                                <item.icon size={18} />
                            </div>
                            <span className={isActive ? 'text-primary' : ''}>{item.text}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 mt-auto">
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-left bg-accent/10 hover:bg-accent/20 text-accent font-medium transition-all active:scale-95"
                >
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}
