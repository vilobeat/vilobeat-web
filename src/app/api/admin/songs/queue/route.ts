import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "SUPPORT_STAFF"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    try {
        const query: any = {
            include: {
                artist: { select: { artistName: true, email: true } },
                royaltySplits: true
            },
            orderBy: { createdAt: 'desc' }
        };

        if (status && status !== 'ALL') {
            query.where = { status };
        }

        const songs = await prisma.song.findMany(query);
        return NextResponse.json({ songs });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
