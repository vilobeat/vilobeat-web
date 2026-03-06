import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    const session = await auth();
    if (!session || !['SUPER_ADMIN', 'SUPPORT_STAFF'].includes(session?.user?.role || '')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const broadcasts = await prisma.broadcast.findMany({
            orderBy: { createdAt: 'desc' },
            include: { admin: { select: { email: true } } },
            take: 50
        });

        return NextResponse.json({ broadcasts }, { status: 200 });
    } catch (error: any) {
        console.error('Failed to fetch broadcast history:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
