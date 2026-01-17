import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
    interface Session {
        accessToken?: string
        refreshToken?: string
        user: {
            id: string
            email: string
            name?: string | null
            image?: string | null
            first_name?: string
            telegram_id?: number
        }
    }

    interface User {
        id: string
        email: string
        name?: string | null
        accessToken?: string
        refreshToken?: string
        user?: any
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        accessToken?: string
        refreshToken?: string
        user?: any
    }
}
