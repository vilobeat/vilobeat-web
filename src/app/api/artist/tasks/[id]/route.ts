import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import prisma from "@/lib/prisma"

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession(req)

    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: taskId } = await params;

    // Try deleting a task first
    const task = await prisma.task.findFirst({
        where: { id: taskId, requestedById: session.user.id }
    })

    if (task) {
        // Delete related task history first
        await prisma.taskHistory.deleteMany({ where: { taskId } })
        await prisma.task.delete({ where: { id: taskId } })
        return NextResponse.json({ success: true, type: "task" })
    }

    // Try deleting a song (Song uses artistId, not userId)
    const song = await prisma.song.findFirst({
        where: { id: taskId, artistId: session.user.id }
    })

    if (song) {
        // Delete related data first
        await prisma.royaltySplit.deleteMany({ where: { songId: taskId } })
        await prisma.analytics.deleteMany({ where: { songId: taskId } })
        await prisma.coverArt.deleteMany({ where: { songId: taskId } })
        // Delete tasks associated with this song
        const songTasks = await prisma.task.findMany({ where: { songId: taskId } })
        for (const t of songTasks) {
            await prisma.taskHistory.deleteMany({ where: { taskId: t.id } })
        }
        await prisma.task.deleteMany({ where: { songId: taskId } })
        await prisma.song.delete({ where: { id: taskId } })
        return NextResponse.json({ success: true, type: "song" })
    }

    return NextResponse.json({ error: "Activity not found" }, { status: 404 })
}
