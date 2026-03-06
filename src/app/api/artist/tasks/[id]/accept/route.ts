import { NextResponse } from "next/server"
import { getSession } from "@/lib/session"
import prisma from "@/lib/prisma"

// POST /api/artist/tasks/[id]/accept
// Triggered when an artist accepts the result of an Admin task (e.g. Mastering)
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await getSession(req)
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const { id: taskId } = await params

        // 1. Fetch Task
        const task = await prisma.task.findUnique({
            where: { id: taskId }
        })

        if (!task) {
            return NextResponse.json({ error: "Task not found" }, { status: 404 })
        }

        if (task.requestedById !== session.user.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
        }

        if (task.status !== "COMPLETED") {
            return NextResponse.json({ error: "Task is not yet completed by admin" }, { status: 400 })
        }

        if (!task.downloadUrl) {
            return NextResponse.json({ error: "Task is missing the completed audio file URL" }, { status: 400 })
        }

        // 2. Mark acceptance in History
        // (We don't change the Task status itself as COMPLETED means the admin finished their part.
        // The fact this endpoint is called means the Frontend is "accepting" it)
        await prisma.taskHistory.create({
            data: {
                taskId: task.id,
                action: "USER_ACCEPTED_RESULT",
                changedBy: session.user.id
            }
        })

        // 3. Return the completed audio URL for the frontend to pipe into the Distribution wizard
        return NextResponse.json({
            acceptedAudioUrl: task.downloadUrl,
            taskType: task.type,
            taskId: task.id
        })

    } catch (e: any) {
        console.error("Task accept error:", e)
        return NextResponse.json({ error: e.message || "Failed to accept task" }, { status: 500 })
    }
}
