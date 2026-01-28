'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { apiClient } from '@/lib/api-client'
import type { FutureStoryPublic, VisualAssetPublic } from '@/lib/types'
import { Toaster, toast } from 'sonner'

export default function VisualsPage() {
    const { data: session, status } = useSession()
    const router = useRouter()

    const [story, setStory] = useState<FutureStoryPublic | null>(null)
    const [gallery, setGallery] = useState<VisualAssetPublic[]>([])
    const [loading, setLoading] = useState(true)
    const [creatingStory, setCreatingStory] = useState(false)
    const [busyKeys, setBusyKeys] = useState<Record<string, boolean>>({})
    const [busyAssetIds, setBusyAssetIds] = useState<Record<string, boolean>>({})

    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mechtaai.ru'

    const latestByKey = useMemo(() => {
        const map: Record<string, VisualAssetPublic> = {}
        for (const asset of gallery) {
            if (!map[asset.image_key]) {
                map[asset.image_key] = asset
            }
        }
        return map
    }, [gallery])

    const loadAll = useCallback(async (token: string) => {
        apiClient.setAuthToken(token)
        setLoading(true)
        try {
            const currentStory = await apiClient.getFutureStory(token)
            setStory(currentStory || null)

            if (currentStory?.id) {
                const assets = await apiClient.getStoryGallery(currentStory.id, token)
                setGallery(assets || [])
            } else {
                setGallery([])
            }
        } catch (error) {
            console.error('Не удалось загрузить данные визуализации', error)
            toast.error('Не удалось загрузить данные визуализаций')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login')
        }
        if (session?.accessToken) {
            void loadAll(session.accessToken)
        }
    }, [loadAll, session, status, router])

    const setKeyBusy = (key: string, value: boolean) => {
        setBusyKeys((prev) => ({ ...prev, [key]: value }))
    }

    const setAssetBusy = (assetId: string, value: boolean) => {
        setBusyAssetIds((prev) => ({ ...prev, [assetId]: value }))
    }

    const imageUrl = useCallback((localPath: string) => {
        if (!localPath) return ''
        if (/^https?:\/\//i.test(localPath)) return localPath
        return `${apiBaseUrl}${localPath}`
    }, [apiBaseUrl])

    const onGenerateStory = async () => {
        if (!session?.accessToken) return
        setCreatingStory(true)
        try {
            apiClient.setAuthToken(session.accessToken)
            const created = await apiClient.generateFutureStory(session.accessToken)
            if (!created?.id) {
                throw new Error('Не удалось создать историю')
            }
            toast.success('История создана')
            await loadAll(session.accessToken)
        } catch (error: any) {
            const message =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                'Не удалось сгенерировать историю'
            console.error('Не удалось сгенерировать историю', error)
            toast.error(message)
        } finally {
            setCreatingStory(false)
        }
    }

    const onGenerate = async (imageKey: string) => {
        if (!session?.accessToken) return
        if (!story?.id) {
            toast.error('Сначала создайте “Историю будущего”')
            return
        }

        setKeyBusy(imageKey, true)
        try {
            apiClient.setAuthToken(session.accessToken)
            const result = await apiClient.generateStoryImage(
                { story_id: story.id, image_key: imageKey },
                session.accessToken
            )

            if (!result || typeof result !== 'object' || !(result as any).id) {
                throw new Error('Пустой ответ от сервера')
            }

            const asset = result as VisualAssetPublic
            setGallery((prev) => [asset, ...prev.filter((a) => a.id !== asset.id)])
            const gamificationMessage = (result as any)?.gamification_event?.message
            toast.success(gamificationMessage || 'Изображение создано')
        } catch (error: any) {
            const message =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                'Не удалось сгенерировать изображение'
            console.error('Не удалось сгенерировать изображение', error)
            toast.error(message)
        } finally {
            setKeyBusy(imageKey, false)
        }
    }

    const onRegenerate = async (asset: VisualAssetPublic) => {
        if (!session?.accessToken) return
        setAssetBusy(asset.id, true)
        try {
            apiClient.setAuthToken(session.accessToken)
            const updated = await apiClient.regenerateVisual(
                { asset_id: asset.id },
                session.accessToken
            )

            if (!updated) {
                throw new Error('Пустой ответ от сервера')
            }

            setGallery((prev) => [updated, ...prev.filter((a) => a.id !== asset.id)])
            toast.success('Изображение обновлено')
        } catch (error: any) {
            const message =
                error?.response?.data?.error?.message ||
                error?.response?.data?.message ||
                'Не удалось перегенерировать изображение'
            console.error('Не удалось перегенерировать изображение', error)
            toast.error(message)
        } finally {
            setAssetBusy(asset.id, false)
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin"></div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Toaster position="top-center" theme="dark" richColors />
                <div className="w-8 h-8 border-4 border-[#ff6b35]/30 border-t-[#ff6b35] rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
            <Toaster position="top-center" theme="dark" richColors />
            <header className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl gradient-orange flex items-center justify-center shadow-lg shadow-[#ff6b35]/20">
                        <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </span>
                    Визуализации
                </h1>
                <p className="text-gray-400 text-lg">
                    Создайте доску желаний (Vision Board), которая будет вдохновлять вас каждый день.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {!story ? (
                        <div className="glass rounded-2xl p-8 border border-[#333] flex flex-col items-center justify-center text-center min-h-[400px] relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#ff6b35]/5 via-transparent to-transparent pointer-events-none"></div>

                            <div className="w-24 h-24 rounded-full bg-[#ff6b35]/10 flex items-center justify-center mb-6 float-animation relative z-10">
                                <svg className="w-12 h-12 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>

                            <h2 className="text-2xl font-bold text-white mb-3 relative z-10">Сначала нужна “История будущего”</h2>
                            <p className="text-gray-400 max-w-md mb-8 relative z-10 text-balance">
                                Визуализации строятся на ключевых образах из вашей истории. Создайте историю, и мы сможем сгенерировать изображения.
                            </p>

                            <Link
                                href="/dashboard/future-story"
                                className="px-8 py-3 gradient-orange text-white font-medium rounded-xl hover:opacity-90 transition-all shadow-lg hover:shadow-[#ff6b35]/30 transform hover:-translate-y-0.5 active:translate-y-0 relative z-10 flex items-center gap-2"
                            >
                                <span>Перейти к истории</span>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>

                            <button
                                onClick={onGenerateStory}
                                disabled={creatingStory}
                                className="mt-3 px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {creatingStory ? 'Генерация истории...' : 'Сгенерировать историю автоматически'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="glass rounded-2xl p-6 border border-[#333]">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Ключевые образы</h2>
                                        <p className="text-gray-400 text-sm mt-1">
                                            Нажмите “Сгенерировать”, чтобы создать визуал для выбранного образа.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => session?.accessToken && loadAll(session.accessToken)}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors"
                                    >
                                        Обновить
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {(story.key_images || []).map((img) => {
                                    const asset = latestByKey[img.id]
                                    const isBusy = Boolean(busyKeys[img.id])
                                    const isBusyRegenerate = asset ? Boolean(busyAssetIds[asset.id]) : false
                                    const title = img.text_ru || img.text || img.id

                                    return (
                                        <div
                                            key={img.id}
                                            className="glass rounded-2xl border border-[#333] overflow-hidden"
                                        >
                                            <div className="aspect-square bg-black/40 relative">
                                                {asset?.local_path ? (
                                                    <Image
                                                        src={imageUrl(asset.local_path)}
                                                        alt={title}
                                                        fill
                                                        unoptimized
                                                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                                                        className="object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-center p-6">
                                                        <div>
                                                            <div className="w-12 h-12 rounded-xl bg-[#ff6b35]/10 flex items-center justify-center mx-auto mb-3">
                                                                <svg className="w-6 h-6 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14" />
                                                                </svg>
                                                            </div>
                                                            <p className="text-gray-400 text-sm">Изображение ещё не создано</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="p-5 space-y-3">
                                                <div>
                                                    <h3 className="text-white font-semibold leading-snug">{title}</h3>
                                                    <p className="text-xs text-gray-500 mt-1">{img.id}</p>
                                                </div>

                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => onGenerate(img.id)}
                                                        disabled={isBusy || isBusyRegenerate}
                                                        className="flex-1 py-2.5 gradient-orange text-white font-medium rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isBusy ? 'Генерация...' : asset ? 'Сгенерировать ещё' : 'Сгенерировать'}
                                                    </button>

                                                    {asset ? (
                                                        <button
                                                            onClick={() => onRegenerate(asset)}
                                                            disabled={isBusy || isBusyRegenerate}
                                                            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            {isBusyRegenerate ? '...' : '↻'}
                                                        </button>
                                                    ) : null}
                                                </div>

                                                {asset?.local_path ? (
                                                    <a
                                                        href={imageUrl(asset.local_path)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="block text-sm text-[#ff6b35] hover:text-[#ff8a5f] transition-colors"
                                                    >
                                                        Открыть изображение
                                                    </a>
                                                ) : null}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <div className="glass rounded-2xl p-6 border border-[#333]">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <svg className="w-5 h-5 text-[#ff6b35]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Инсайт
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            Визуализация укрепляет нейронные связи и помогает мозгу быстрее находить пути к цели.
                        </p>
                    </div>

                    <div className="glass-orange rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-2">AI Генератор</h3>
                        <p className="text-sm text-white/80">
                            Опишите свою мечту словами, и нейросеть создаст для неё уникальное изображение.
                        </p>
                    </div>

                    {story ? (
                        <div className="glass rounded-2xl p-6 border border-[#333]">
                            <h3 className="text-lg font-bold text-white mb-2">Галерея</h3>
                            <p className="text-sm text-gray-400 mb-4">
                                Создано изображений: <span className="text-white font-semibold">{gallery.length}</span>
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                                {gallery.slice(0, 9).map((a) => (
                                    <a
                                        key={a.id}
                                        href={imageUrl(a.local_path)}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block aspect-square relative rounded-lg overflow-hidden border border-white/10 hover:border-[#ff6b35]/40 transition-colors"
                                        title={a.image_key}
                                    >
                                        <Image
                                            src={imageUrl(a.local_path)}
                                            alt={a.image_key}
                                            fill
                                            unoptimized
                                            sizes="120px"
                                            className="object-cover"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
