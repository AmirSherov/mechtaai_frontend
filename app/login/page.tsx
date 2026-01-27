'use client'

import { useEffect, useState } from 'react'
import QRCodeSVG from 'react-qr-code'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api-client'

type LoginStatus = 'init' | 'pending' | 'confirming' | 'confirmed' | 'error' | 'expired'

export default function QRLoginPage() {
    const [status, setStatus] = useState<LoginStatus>('init')
    const [loginToken, setLoginToken] = useState<string>('')
    const [qrData, setQrData] = useState<string>('')
    const [expiresIn, setExpiresIn] = useState<number>(180)
    const [error, setError] = useState<string>('')
    const router = useRouter()

    useEffect(() => {
        initLogin()
    }, [])

    useEffect(() => {
        if (status === 'pending' && loginToken) {
            const interval = setInterval(checkStatus, 2000)
            return () => clearInterval(interval)
        }
    }, [status, loginToken])

    useEffect(() => {
        if (status === 'pending') {
            const timer = setInterval(() => {
                setExpiresIn((prev) => {
                    if (prev <= 1) {
                        setStatus('expired')
                        toast.error('QR-код истек', {
                            description: 'Время действия кода истекло. Создайте новый.'
                        })
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)
            return () => clearInterval(timer)
        }
    }, [status])

    const initLogin = async () => {
        try {
            setStatus('init')
            setError('')

            const data = await apiClient.initQRLogin()

            setLoginToken(data.login_token)
            setQrData(data.qr_code_data)
            setExpiresIn(data.expires_in_seconds)
            setStatus('pending')
            toast.success('QR-код создан', {
                description: 'Отсканируйте код в Telegram для входа'
            })
        } catch (err: any) {
            setError(err.message || 'Failed to initialize login')
            setStatus('error')
            toast.error('Ошибка', {
                description: 'Не удалось создать QR-код. Попробуйте снова.'
            })
        }
    }

    const checkStatus = async () => {
        try {
            const statusData = await apiClient.checkQRLoginStatus(loginToken)

            if (statusData.status === 'confirmed' && statusData.one_time_secret) {
                setStatus('confirming')
                toast.success('Подтверждено!', {
                    description: 'Выполняется вход в систему...'
                })

                const result = await signIn('telegram-qr', {
                    oneTimeSecret: statusData.one_time_secret,
                    redirect: false,
                })

                if (result?.ok) {
                    setStatus('confirmed')
                    toast.success('Успешно!', {
                        description: 'Вы вошли в систему'
                    })
                    setTimeout(() => {
                        router.push('/dashboard')
                    }, 1000)
                } else {
                    setError('Failed to authenticate')
                    setStatus('error')
                    toast.error('Ошибка авторизации')
                }
            }
        } catch (err: any) {
            if (err.response?.status === 400) {
                setStatus('expired')
            }
        }
    }

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-transparent relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35]/5 via-transparent to-[#ff4500]/5"></div>

            <div className="w-full max-w-md p-8 relative z-10">
                <div className="glass rounded-2xl p-8 shadow-2xl border border-[#333]">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 gradient-orange rounded-2xl mx-auto mb-4 flex items-center justify-center float-animation">
                            <span className="text-white font-bold text-2xl">M</span>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">
                            MechtaAI
                        </h1>
                        <p className="text-gray-400 text-sm">
                            Войти через Telegram
                        </p>
                    </div>

                    {status === 'init' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-12 h-12 border-4 border-[#ff6b35]/20 border-t-[#ff6b35] rounded-full animate-spin"></div>
                            <p className="mt-4 text-gray-400">Генерация QR-кода...</p>
                        </div>
                    )}

                    {status === 'pending' && (
                        <div className="flex flex-col items-center">
                            <div className="bg-white p-6 rounded-xl mb-6 shadow-lg">
                                <QRCodeSVG value={qrData} size={220} level="H" />
                            </div>

                            <div className="text-center mb-4">
                                <p className="text-white font-medium mb-1">
                                    Отсканируйте QR-код в Telegram
                                </p>
                                <p className="text-gray-500 text-sm">
                                    Код действителен {formatTime(expiresIn)}
                                </p>
                            </div>

                            <a
                                href={qrData}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full mb-4"
                            >
                                <button className="w-full gradient-orange hover:opacity-90 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-[#ff6b35]/50">
                                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 3.767-1.362 5.001-.168.523-.504.697-.826.716-.702.038-1.237-.464-1.918-.908-1.065-.695-1.667-1.127-2.7-1.806-.882-.58-.31-1.126.193-1.78.131-.171 2.413-2.214 2.461-2.403.006-.024.011-.112-.041-.159-.053-.047-.131-.031-.187-.018-.081.018-1.37.872-3.867 2.563-.366.251-.697.374-.992.369-.326-.006-.954-.185-1.42-.337-.572-.186-.97-.285-.933-.6.019-.164.227-.332.623-.5 2.435-1.063 4.059-1.763 4.867-2.1 2.319-.971 2.803-1.14 3.117-1.146.069-.001.224.016.325.097.086.069.109.162.12.228.012.066.027.216.016.334z" />
                                    </svg>
                                    Открыть в Telegram
                                </button>
                            </a>

                            <div className="flex items-center gap-2 text-gray-500 text-xs">
                                <div className="w-2 h-2 bg-[#ff6b35] rounded-full pulse-orange"></div>
                                <span>Ожидание подтверждения...</span>
                            </div>
                        </div>
                    )}

                    {status === 'confirming' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-[#ff6b35]/20 rounded-full"></div>
                                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-[#ff6b35] border-t-transparent rounded-full animate-spin"></div>
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <svg className="w-10 h-10 text-[#ff6b35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <p className="mt-6 text-white font-medium">Вход выполняется...</p>
                        </div>
                    )}

                    {status === 'confirmed' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-20 h-20 bg-[#ff6b35]/20 rounded-full flex items-center justify-center mb-4 animate-scale-in">
                                <svg className="w-12 h-12 text-[#ff6b35]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-white font-medium">Успешно!</p>
                            <p className="text-gray-400 text-sm mt-2">Перенаправление...</p>
                        </div>
                    )}

                    {status === 'expired' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-20 h-20 bg-orange-500/20 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-12 h-12 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <p className="text-white font-medium mb-2">QR-код истек</p>
                            <p className="text-gray-400 text-sm mb-6 text-center">
                                Время действия кода истекло. Создайте новый QR-код.
                            </p>
                            <button
                                onClick={initLogin}
                                className="px-6 py-3 gradient-orange hover:opacity-90 text-white rounded-xl transition-all font-medium"
                            >
                                Создать новый QR-код
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="flex flex-col items-center justify-center py-12">
                            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <p className="text-white font-medium mb-2">Ошибка</p>
                            <p className="text-gray-400 text-sm mb-6 text-center">
                                {error || 'Произошла ошибка. Попробуйте снова.'}
                            </p>
                            <button
                                onClick={initLogin}
                                className="px-6 py-3 gradient-orange hover:opacity-90 text-white rounded-xl transition-all font-medium"
                            >
                                Попробовать снова
                            </button>
                        </div>
                    )}
                </div>

                <p className="text-center text-gray-600 text-xs mt-6">
                    Нажимая "Войти", вы соглашаетесь с условиями использования
                </p>
            </div>

            <style jsx>{`
        @keyframes scale-in {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
        </div>
    )
}
