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
        const { action, payload } = body;
        const { id: requestId } = await params;

        const request = await prisma.withdrawalRequest.findUnique({ where: { id: requestId }, include: { artist: true } });
        if (!request) return NextResponse.json({ error: "Request not found" }, { status: 404 });

        if (action === "APPROVE") {
            const updated = await prisma.withdrawalRequest.update({
                where: { id: requestId },
                data: { status: 'APPROVED' }
            });
            // Deduct the wallet right now, or when PAID. Assuming at approval for safety.
            await prisma.user.update({
                where: { id: request.artistId },
                data: { walletBalance: { decrement: request.amount } }
            });
            return NextResponse.json({ withdrawal: updated });
        }

        if (action === "REJECT") {
            const updated = await prisma.withdrawalRequest.update({
                where: { id: requestId },
                data: { status: 'REJECTED' }
            });
            return NextResponse.json({ withdrawal: updated });
        }

        if (action === "MARK_PAID") {
            const updated = await prisma.withdrawalRequest.update({
                where: { id: requestId },
                data: { status: 'PAID' } // and usually attach payload.reference
            });
            return NextResponse.json({ withdrawal: updated });
        }

        return NextResponse.json({ error: "Invalid Action" }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
