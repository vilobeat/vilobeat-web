import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "FINANCE_MANAGER"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { amount, date } = body;
        const { id: songId } = await params;

        const song = await prisma.song.findUnique({
            where: { id: songId }
        });

        if (!song) return NextResponse.json({ error: "Song not found" }, { status: 404 });

        // 1. Create the royalty ledger entry for the song
        const royalty = await prisma.royaltyLedger.create({
            data: {
                artistId: song.artistId,
                songId: song.id,
                amount: parseFloat(amount),
                date: date ? new Date(date) : new Date()
            }
        });

        // 2. Add the amount to the user's wallet
        await prisma.user.update({
            where: { id: song.artistId },
            data: { walletBalance: { increment: parseFloat(amount) } }
        });

        return NextResponse.json({ royalty, message: "Revenue added and wallet updated." });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
