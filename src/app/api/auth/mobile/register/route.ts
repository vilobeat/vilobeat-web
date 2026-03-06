import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { createToken } from "../route"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, email, password } = body

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
        }

        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json({ error: "Email already in use" }, { status: 400 })
        }

        // MVP Plaintext, update to bcrypt in prod
        const user = await prisma.user.create({
            data: {
                artistName: name,
                email,
                passwordHash: password,
                role: "ARTIST",
                subscriptionTier: "BASIC",
            },
        })

        const token = createToken({
            id: user.id,
            email: user.email,
            role: user.role,
            tier: user.subscriptionTier,
            iat: Date.now(),
        })

        return NextResponse.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                artistName: user.artistName,
                role: user.role,
                tier: user.subscriptionTier,
            },
        })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Failed to register" }, { status: 500 })
    }
}
