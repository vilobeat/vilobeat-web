import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import crypto from "crypto"

// Simple JWT-like token for mobile auth
// In production, use a proper JWT library (jsonwebtoken)
export function createToken(payload: object): string {
    const data = JSON.stringify(payload)
    const signature = crypto
        .createHmac("sha256", process.env.NEXTAUTH_SECRET || "dev-secret")
        .update(data)
        .digest("hex")
    return Buffer.from(data).toString("base64") + "." + signature
}

export function verifyToken(token: string): any | null {
    try {
        const [dataB64, signature] = token.split(".")
        const data = Buffer.from(dataB64, "base64").toString("utf8")
        const expectedSig = crypto
            .createHmac("sha256", process.env.NEXTAUTH_SECRET || "dev-secret")
            .update(data)
            .digest("hex")
        if (signature !== expectedSig) return null
        return JSON.parse(data)
    } catch {
        return null
    }
}

// POST /api/auth/mobile - Login for mobile clients, returns a token
export async function POST(req: Request) {
    const { email, password } = await req.json()

    if (!email || !password) {
        return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
        where: { email },
    })

    if (!user) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // TODO: In production, use bcrypt.compare()
    if (user.passwordHash !== password) {
        return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

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
            role: user.role,
            tier: user.subscriptionTier,
        },
    })
}
