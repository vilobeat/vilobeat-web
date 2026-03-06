import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import prisma from "@/lib/prisma"
import { enforceAndIncrementQuota } from "@/lib/subscriptions"

export async function GET(req: Request) {
    const session = await getSession(req)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tasks = await prisma.task.findMany({
        where: { requestedById: session.user.id },
        include: {
            song: { select: { title: true, genre: true } }
        },
        orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ tasks })
}

export async function POST(req: Request) {
    const session = await getSession(req)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { type, songId, meta } = await req.json()

    const allowedTypes = ["MASTERING", "PRODUCTION", "AI_LYRICS", "AI_COVER", "LYRICS_TO_MUSIC"]
    if (!allowedTypes.includes(type)) {
        return NextResponse.json({ error: "Invalid task type" }, { status: 400 })
    }

    let quotaField: "masteringUsed" | "songCreationUsed" | "coverCreationUsed" | "lyricsUsed" | null = null;
    if (type === "MASTERING") quotaField = "masteringUsed";
    if (type === "LYRICS_TO_MUSIC") quotaField = "songCreationUsed";
    if (type === "AI_COVER") quotaField = "coverCreationUsed";
    if (type === "AI_LYRICS") quotaField = "lyricsUsed";

    if (quotaField) {
        const quotaCheck = await enforceAndIncrementQuota(session.user.id, quotaField);
        if (!quotaCheck.allowed) {
            return NextResponse.json({ error: quotaCheck.message }, { status: 403 });
        }
    }

    const task = await prisma.task.create({
        data: {
            type,
            requestedById: session.user.id,
            songId: songId || null,
            meta: meta ? JSON.stringify(meta) : null,
            status: "PENDING"
        }
    })

    return NextResponse.json({ task })
}
