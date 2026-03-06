export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
        const tasks = await prisma.task.findMany({ select: { id: true, type: true, status: true, requestedById: true } });

        return NextResponse.json({ users, tasks }, { status: 200 });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
