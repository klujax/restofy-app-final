'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Coffee, Loader2, ArrowRight } from 'lucide-react'

export default function LoginClient() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
            return
        }

        if (authData.user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, business_name')
                .eq('id', authData.user.id)
                .single()

            if (profile?.role === 'super_admin') {
                router.push('/admin')
            } else if (!profile?.business_name) {
                router.push('/setup')
            } else {
                router.push('/dashboard')
            }
            router.refresh()
        } else {
            router.push('/dashboard')
            router.refresh()
        }
    }

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <Link href="/" className="inline-block">
                        <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                            Restofy
                        </div>
                    </Link>
                </div>

                <div className="text-center">
                    <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                        <Coffee className="h-8 w-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Hoş Geldiniz</h1>
                    <p className="text-slate-400">Hesabınıza giriş yapın</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-4 rounded-xl">
                            {error}
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-slate-300">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="ornek@kafe.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:border-orange-500 focus:ring-orange-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password" className="text-slate-300">Şifre</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="h-12 bg-white/5 border-white/10 text-white placeholder:text-slate-500 rounded-xl focus:border-orange-500 focus:ring-orange-500"
                        />
                    </div>

                    <Button
                        type="submit"
                        disabled={loading}
                        className="w-full h-14 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 rounded-xl text-lg font-semibold gap-2"
                    >
                        {loading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                Giriş Yap
                                <ArrowRight className="h-5 w-5" />
                            </>
                        )}
                    </Button>
                </form>

                <p className="text-center text-slate-400">
                    Hesabınız yok mu?{' '}
                    <Link href="/register" className="text-orange-400 hover:text-orange-300 font-medium">
                        Kayıt Olun
                    </Link>
                </p>

                <div className="text-center">
                    <Link href="/" className="text-slate-500 hover:text-slate-300 text-sm">
                        ← Ana Sayfaya Dön
                    </Link>
                </div>
            </div>
        </div>
    )
}
