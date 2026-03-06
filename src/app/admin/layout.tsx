import { ReactNode } from 'react';
import AdminSidebar from '@/components/ui/AdminSidebar';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    variable: '--font-grotesk',
    weight: ['300', '400', '500', '600', '700'],
});

export default function AdminLayout({ children }: { children: ReactNode }) {
    return (
        <div className={`min-h-screen bg-background text-foreground flex ${spaceGrotesk.variable} font-grotesk`}>
            {/* Sidebar fixed size left */}
            <AdminSidebar />

            {/* Main content right */}
            <main className="flex-1 lg:ml-64 p-4 md:p-8 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
