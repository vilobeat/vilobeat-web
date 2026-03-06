import NextAuth, { type NextAuthOptions, type DefaultSession, getServerSession } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "./prisma"

declare module "next-auth" {
    interface User {
        id: string;
        role: string;
        tier: string;
    }
    interface Session {
        user: {
            id: string;
            role: string;
            tier: string;
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role: string;
        tier: string;
    }
}

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                })

                if (!user) {
                    return null
                }

                // TODO: In production, compare hashed password with bcrypt
                if (user.passwordHash !== credentials.password) {
                    return null
                }

                return {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    tier: user.subscriptionTier
                }
            }
        })
    ],
    callbacks: {
        jwt({ token, user }) {
            if (user) {
                token.role = (user as any).role
                token.tier = (user as any).tier
            }
            return token
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.sub as string
                session.user.role = token.role
                session.user.tier = token.tier
            }
            return session
        }
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    pages: {
        signIn: '/login',
    },
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }

// Wrapper function matching the pattern used by API routes: `const session = await auth()`
export async function auth() {
    return getServerSession(authOptions)
}
