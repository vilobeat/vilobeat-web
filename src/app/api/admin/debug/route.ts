import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        const tasks = await prisma.task.findMany({
            select: { id: true, type: true, status: true, requestedById: true, requestedBy: { select: { email: true, role: true } }, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 20
        });

        return NextResponse.json({ users, tasks });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
