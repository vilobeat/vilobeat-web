import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await auth();
    if (!session?.user || !["SUPER_ADMIN", "SUPPORT_STAFF", "FINANCE_MANAGER"].includes(session.user.role)) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    try {
        const query: any = {
            include: { user: { select: { artistName: true, email: true, walletBalance: true } } },
            orderBy: { createdAt: 'desc' }
        };

        if (status && status !== 'ALL') {
            query.where = { status };
        }

        const withdrawals = await prisma.withdrawalRequest.findMany(query);
        return NextResponse.json({ withdrawals });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
