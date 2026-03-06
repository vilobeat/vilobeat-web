import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "SUPPORT_STAFF"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { action, payload } = body;

        const { id: songId } = await params;

        if (action === "UPDATE_STATUS") {
            const song = await prisma.song.update({
                where: { id: songId },
                data: { status: payload.status }
            });
            return NextResponse.json({ song });
        }

        if (action === "ADD_LINKS") {
            const song = await prisma.song.update({
                where: { id: songId },
                data: { shareLink: payload.link }
            });
            return NextResponse.json({ song });
        }

        return NextResponse.json({ error: "Invalid Action" }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
