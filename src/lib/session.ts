import { verifyToken } from "@/app/api/auth/mobile/route"
import { getServerSession } from "next-auth"
import { authOptions } from "./auth"

// Universal auth helper - works for both web (NextAuth cookies) and mobile (Bearer token)
export async function getSession(req?: Request) {
    // First, try Bearer token (mobile)
    if (req) {
        const authHeader = req.headers.get("authorization")
        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.slice(7)
            const payload = verifyToken(token)
            if (payload) {
                return {
                    user: {
                        id: payload.id,
                        email: payload.email,
                        role: payload.role,
                        tier: payload.tier,
                    },
                }
            }
        }
    }

    // Fall back to NextAuth session (web/cookies)
    const session = await getServerSession(authOptions)
    return session
}
