import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "SUPPORT_STAFF"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const covers = await prisma.coverArt.findMany({
            include: { user: { select: { artistName: true, email: true } } },
            orderBy: { createdAt: 'desc' }
        });

        // MVP: CoverArt doesn't have a status in schema, we will mock it based on imageUrl presence
        const formattedCovers = covers.map((cover: any) => ({
            ...cover,
            status: cover.imageUrl ? 'COMPLETED' : 'PENDING'
        }));

        return NextResponse.json({ covers: formattedCovers });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
