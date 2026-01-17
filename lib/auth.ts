import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { apiClient } from '@/lib/api-client'

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            id: 'telegram-qr',
            name: 'Telegram QR',
            credentials: {
                oneTimeSecret: { label: 'One Time Secret', type: 'text' },
            },
            async authorize(credentials) {
                if (!credentials?.oneTimeSecret) {
                    return null
                }

                try {
                    const authData = await apiClient.exchangeSecret(credentials.oneTimeSecret)

                    return {
                        id: authData.user.id,
                        email: authData.user.email,
                        name: authData.user.first_name || authData.user.email,
                        accessToken: authData.access_token,
                        refreshToken: authData.refresh_token,
                        user: authData.user,
                    }
                } catch (error) {
                    console.error('Authorization error:', error)
                    return null
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.accessToken = (user as any).accessToken
                token.refreshToken = (user as any).refreshToken
                token.user = (user as any).user
            }
            return token
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string
            session.refreshToken = token.refreshToken as string
            session.user = token.user as any
            return session
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
    },
    secret: process.env.NEXTAUTH_SECRET,
}
