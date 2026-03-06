import { ReactNode } from 'react';
import AdminSidebar from '@/components/ui/AdminSidebar';
import { Space_Grotesk } from 'next/font/google';

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    variable: '--font-grotesk',
    weight: ['300', '400', '500', '600', '700'],
});

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function AdminLayout({ children }: { children: ReactNode }) {
    const session = await auth();

    if (!session || !session.user) {
        redirect('/login');
    }

    if (session.user.role !== 'ADMIN') {
        redirect('/'); // Or a dedicated unauthorized page
    }

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
