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

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
    let session;
    let authError = null;

    try {
        session = await auth();
    } catch (e: any) {
        authError = e instanceof Error ? e.message : String(e);
        console.error("Auth Error in AdminLayout:", e);
    }

    if (authError) {
        return (
            <div className={`min-h-screen bg-background text-foreground flex ${spaceGrotesk.variable} font-grotesk p-8`}>
                <div className="bg-red-500/10 text-red-500 border border-red-500/20 p-8 rounded-xl max-w-2xl mx-auto mt-20">
                    <h2 className="text-2xl font-bold mb-4">Server Error (Diagnostic)</h2>
                    <p className="mb-4">The server encountered an error while validating the session:</p>
                    <pre className="bg-black/50 p-4 rounded-lg overflow-x-auto text-sm">{authError}</pre>
                    <p className="mt-4 text-sm opacity-80">This custom error page was added to help debug the "Digest: 1301160727" error.</p>
                </div>
            </div>
        );
    }

    if (!session || !session.user) {
        redirect('/login');
    }

    const adminRoles = ["SUPER_ADMIN", "ADMIN", "DISTRIBUTION_MANAGER", "CREATIVE_MANAGER", "FINANCE_ADMIN", "SUPPORT_STAFF"];
    if (!adminRoles.includes(session.user.role)) {
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
