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

        const { id: taskId } = await params;

        if (action === "ASSIGN_AND_START") {
            const task = await prisma.task.update({
                where: { id: taskId },
                data: { status: 'IN_PROGRESS', assignedToId: session.user.id }
            });
            return NextResponse.json({ task });
        }

        if (action === "UPLOAD_AND_COMPLETE" || action === "MARK_DELIVERED") {
            // payload.url contains the generated media or master
            // In a real app we'd save this to `resultUrl` on the task model
            const task = await prisma.task.update({
                where: { id: taskId },
                data: { status: 'COMPLETED', assignedToId: session.user.id } // For MVP, assume the URL is just stored in DB or given via email
            });

            // Deduct Quota if this was the final step & it hadn't been deducted yet
            // Assuming quotas are deducted upon completion for MVP tasks
            if (task.requestedById) {
                const user = await prisma.user.findUnique({ where: { id: task.requestedById }, include: { quota: true } });
                if (user?.quota) {
                    const updateData: any = {};
                    if (task.type === 'MASTERING') updateData.masteringUsed = { increment: 1 };
                    if (task.type === 'LYRICS_TO_MUSIC') updateData.songCreationUsed = { increment: 1 };

                    if (Object.keys(updateData).length > 0) {
                        await prisma.quota.update({
                            where: { id: user.quota.id },
                            data: updateData
                        });
                    }
                }
            }

            return NextResponse.json({ task });
        }

        return NextResponse.json({ error: "Invalid Action" }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
