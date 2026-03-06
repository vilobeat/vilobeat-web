import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return NextResponse.json({ notifications }, { status: 200 });
    } catch (error: any) {
        console.error('Failed to fetch notifications:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
