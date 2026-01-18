'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Coffee, Loader2, ArrowRight, Palette, Store, Sparkles, Check } from 'lucide-react'

const THEME_COLORS = [
    { name: 'Turuncu', value: '#f97316' },
    { name: 'Kırmızı', value: '#ef4444' },
    { name: 'Mavi', value: '#3b82f6' },
    { name: 'Yeşil', value: '#10b981' },
    { name: 'Mor', value: '#8b5cf6' },
    { name: 'Pembe', value: '#ec4899' },
    { name: 'Amber', value: '#f59e0b' },
    { name: 'Turkuaz', value: '#14b8a6' },
]

export default function SetupClient() {
    const [businessName, setBusinessName] = useState('')
    const [themeColor, setThemeColor] = useState('#f97316')
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()

            if (!user) {
                router.push('/login')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('business_name')
                .eq('id', user.id)
                .single()

            if (profile?.business_name) {
                router.push('/dashboard')
                return
            }

            setChecking(false)
        }

        checkUser()
    }, [supabase, router])

    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!businessName.trim()) {
            setError('Lütfen işletme adı girin')
            return
        }

        setLoading(true)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setError('Oturum bulunamadı')
                setLoading(false)
                return
            }

            await supabase
                .from('profiles')
                .update({
                    business_name: businessName.trim(),
                    theme_color: themeColor,
                    role: 'owner',
                })
                .eq('id', user.id)

            await supabase
                .from('categories')
                .insert({
                    profile_id: user.id,
                    name: 'Popüler',
                    description: 'En çok tercih edilen ürünlerimiz',
                    sort_order: 0,
                })

            router.push('/dashboard')
            router.refresh()
        } catch (err) {
            console.error('Setup error:', err)
            setError('Bir hata oluştu. Lütfen tekrar deneyin.')
            setLoading(false)
        }
    }

    if (checking) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="w-full max-w-lg space-y-8">
                <div className="text-center space-y-4">
                    <div className="mx-auto h-20 w-20 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-2xl shadow-orange-500/20">
                        <Store className="h-10 w-10 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center justify-center gap-2 text-orange-400 text-sm font-medium mb-2">
                            <Sparkles className="h-4 w-4" />
                            Son Adım!
                        </div>
                        <h1 className="text-3xl font-bold">Kafenizi Kuralım</h1>
                        <p className="text-slate-400 mt-2">
                            İşletme bilgilerinizi girin ve hemen başlayın
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSetup} className="space-y-8">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="space-y-3">
                        <Label htmlFor="businessName" className="text-slate-300 text-base flex items-center gap-2">
                            <Coffee className="h-4 w-4" />
                            İşletme Adı
                        </Label>
                        <Input
                            id="businessName"
                            type="text"
                            placeholder="Örn: Keyifli Kahve"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            required
                            autoFocus
                            className="h-14 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl text-lg"
                        />
                    </div>

                    <div className="space-y-3">
                        <Label className="text-slate-300 text-base flex items-center gap-2">
                            <Palette className="h-4 w-4" />
                            Tema Rengi
                        </Label>
                        <div className="grid grid-cols-4 gap-3">
                            {THEME_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setThemeColor(color.value)}
                                    className={`h-14 rounded-xl transition-all flex items-center justify-center ${themeColor === color.value
                                            ? 'ring-2 ring-white ring-offset-2 ring-offset-black scale-105'
                                            : 'hover:scale-105 opacity-70 hover:opacity-100'
                                        }`}
                                    style={{ backgroundColor: color.value }}
                                >
                                    {themeColor === color.value && <Check className="h-6 w-6 text-white" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                        <p className="text-sm text-slate-400 mb-4">Önizleme</p>
                        <div className="flex items-center gap-4">
                            <div
                                className="h-14 w-14 rounded-xl flex items-center justify-center"
                                style={{ backgroundColor: themeColor }}
                            >
                                <Coffee className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <p className="font-bold text-xl">{businessName || 'İşletme Adı'}</p>
                                <p className="text-sm text-slate-400">restofy.app/menu/...</p>
                            </div>
                        </div>
                    </div>

                    <Button
                        type="submit"
                        disabled={loading || !businessName.trim()}
                        className="w-full h-14 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-xl text-lg font-semibold gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Kuruluyor...
                            </>
                        ) : (
                            <>
                                Kurulumu Tamamla
                                <ArrowRight className="h-5 w-5" />
                            </>
                        )}
                    </Button>
                </form>
            </div>
        </div>
    )
}
