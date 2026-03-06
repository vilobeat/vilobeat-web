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
    const type = searchParams.get('type') as string; // MASTERING or LYRICS_TO_MUSIC

    try {
        const query: any = {
            where: { type },
            include: {
                requestedBy: { select: { artistName: true, email: true } },
                assignedTo: { select: { email: true, artistName: true } }
            },
            orderBy: { createdAt: 'desc' }
        };

        if (status && status !== 'ALL') {
            query.where.status = status;
        }

        const tasks = await prisma.task.findMany(query);
        return NextResponse.json({ tasks });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
