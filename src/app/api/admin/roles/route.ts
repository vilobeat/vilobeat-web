import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await auth();
    // Only Super Admins can view/manage roles
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const admins = await prisma.user.findMany({
            where: {
                role: {
                    not: 'ARTIST'
                }
            },
            select: {
                id: true,
                artistName: true,
                email: true,
                role: true,
                createdAt: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const users = await prisma.user.findMany({
            where: { role: 'ARTIST' },
            select: { id: true, email: true, artistName: true, role: true },
            take: 50
        });

        const customRoles = await prisma.adminRole.findMany({
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ admins, users, customRoles });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await auth();
    if (!session?.user || session.user.role !== "SUPER_ADMIN") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    try {
        const body = await req.json();

        if (body.action === 'CREATE_ROLE') {
            const roleName = body.roleName.toUpperCase().replace(/\s+/g, '_');
            const newRole = await prisma.adminRole.create({
                data: {
                    name: roleName,
                    permissions: JSON.stringify(body.permissions)
                }
            });
            return NextResponse.json({ role: newRole });
        }

        if (body.action === 'ASSIGN_USER') {
            const updatedUser = await prisma.user.update({
                where: { id: body.userId },
                data: { role: body.newRole }
            });
            return NextResponse.json({ user: updatedUser });
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
