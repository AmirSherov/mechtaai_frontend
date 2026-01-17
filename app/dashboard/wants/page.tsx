'use client'

import React, { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { apiClient } from '@/lib/api-client'
import WantsWizard from '@/components/dashboard/wants/WantsWizard'

export default function WantsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        } else if (status === 'authenticated' && session?.accessToken) {
            apiClient.setAuthToken(session.accessToken)
        }
    }, [status, router, session])

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin"></div>
            </div>
        )
    }

    if (status !== 'authenticated') {
        return null // Will redirect
    }

    return (
        <div className="p-4 md:p-8">
            {session?.accessToken && <WantsWizard accessToken={session.accessToken} />}
        </div>
    )
}
