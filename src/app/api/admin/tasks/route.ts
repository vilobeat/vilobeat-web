import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
    const session = await auth()

    if (!session?.user || session.user.role === "ARTIST") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    let whereClause: any = {}

    if (status) {
        whereClause.status = status
    }

    if (type) {
        whereClause.type = type
    }

    // Role-based filtering - Managers should only see their own tasks
    if (session.user.role === "DISTRIBUTION_MANAGER") {
        whereClause.type = "DISTRIBUTION"
    } else if (session.user.role === "MASTERING_MANAGER") {
        whereClause.type = "MASTERING"
    } else if (session.user.role === "PRODUCTION_MANAGER") {
        whereClause.type = { in: ["PRODUCTION", "AI_LYRICS", "AI_COVER"] }
    }
    // SUPER_ADMIN and SUPPORT_STAFF see everything matching explicit filters

    const tasks = await prisma.task.findMany({
        where: whereClause,
        include: {
            song: true,
            requestedBy: {
                select: { email: true }
            }
        },
        orderBy: { createdAt: "desc" }
    })

    return NextResponse.json({ tasks })
}

export async function PUT(req: Request) {
    const session = await auth()

    if (!session?.user || session.user.role === "ARTIST") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id, status, assignedToId, meta, songData } = await req.json()

    if (!id) {
        return NextResponse.json({ error: "Task ID required" }, { status: 400 })
    }

    const updateData: any = {}
    if (status) updateData.status = status
    if (assignedToId) updateData.assignedToId = assignedToId
    if (meta) updateData.meta = JSON.stringify(meta)

    // Run updates in a transaction if we also need to update a song
    let task;

    if (songData && Object.keys(songData).length > 0) {
        const existingTask = await prisma.task.findUnique({
            where: { id },
            select: { songId: true }
        });

        if (existingTask?.songId) {
            // Transaction to update both
            const result = await prisma.$transaction([
                prisma.task.update({ where: { id }, data: updateData }),
                prisma.song.update({
                    where: { id: existingTask.songId },
                    data: {
                        isrc: songData.isrc || undefined,
                        releaseDate: songData.releaseDate ? new Date(songData.releaseDate) : undefined,
                        status: status === 'COMPLETED' ? 'LIVE' : undefined
                    }
                })
            ]);
            task = result[0];
        } else {
            task = await prisma.task.update({ where: { id }, data: updateData });
        }
    } else {
        task = await prisma.task.update({
            where: { id },
            data: updateData
        })
    }

    // Log action
    await prisma.adminLog.create({
        data: {
            adminId: session.user.id,
            action: `UPDATED_TASK_${id}`,
            meta: JSON.stringify({ status, assignedToId, songData })
        }
    })

    return NextResponse.json({ task })
}
