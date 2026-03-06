import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ error: 'Push token required' }, { status: 400 });
        }

        // Validate Expo token format roughly before saving
        if (!token.startsWith('ExponentPushToken[') && !token.startsWith('ExpoPushToken[')) {
            return NextResponse.json({ error: 'Invalid Expo Push Token format' }, { status: 400 });
        }

        // Save token to user profile
        await prisma.user.update({
            where: { id: session.user.id },
            data: { expoPushToken: token }
        });

        return NextResponse.json({ message: 'Push token registered successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('Failed to register push token:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
