import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: Request) {
    const session = await auth()

    if (!session?.user || !["SUPER_ADMIN", "SUPPORT_STAFF"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    try {
        const users = await prisma.user.findMany({
            where: { role: "ARTIST" },
            select: {
                id: true,
                email: true,
                artistName: true,
                subscriptionTier: true,
                quota: true
            },
            orderBy: { subscriptionTier: "desc" },
            take: 50
        })

        return NextResponse.json({ users })
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 })
    }
}
