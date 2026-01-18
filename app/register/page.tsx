'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Coffee, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        // Validation
        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor')
            return
        }

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalı')
            return
        }

        setLoading(true)

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/setup`
            }
        })

        if (signUpError) {
            setError(signUpError.message)
            setLoading(false)
            return
        }

        // Redirect to setup page
        router.push('/setup')
        router.refresh()
    }

    return (
        <div className="min-h-screen bg-black text-white flex">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
                <div className="w-full max-w-md space-y-8">
                    {/* Logo */}
                    <div className="text-center">
                        <Link href="/" className="inline-block">
                            <div className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                                Restofy
                            </div>
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold mb-2">Hesap Oluştur</h1>
                        <p className="text-slate-400">30 saniyede kafenizi dijitale taşıyın</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleRegister} className="space-y-6">
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

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-slate-300">Şifre Tekrar</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
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
                                    Hesap Oluştur
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Login Link */}
                    <p className="text-center text-slate-400">
                        Zaten hesabınız var mı?{' '}
                        <Link href="/login" className="text-orange-400 hover:text-orange-300 font-medium">
                            Giriş Yap
                        </Link>
                    </p>
                </div>
            </div>

            {/* Right Side - Features */}
            <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-orange-600/20 to-red-600/20 items-center justify-center p-12">
                <div className="max-w-md space-y-8">
                    <h2 className="text-4xl font-bold">
                        Kafenizi <span className="text-orange-400">dijitale</span> taşıyın
                    </h2>

                    <div className="space-y-6">
                        <FeatureItem text="QR Menü ile masalardan sipariş alın" />
                        <FeatureItem text="Siparişleri anlık takip edin" />
                        <FeatureItem text="Stok ve fiyat yönetimi" />
                        <FeatureItem text="Detaylı raporlar ve analizler" />
                    </div>

                    <div className="pt-8 border-t border-white/10">
                        <p className="text-slate-400 text-sm">
                            "Restofy sayesinde günde 50+ sipariş daha alıyoruz.
                            Garsonlar menü taşımak yerine servis yapıyor."
                        </p>
                        <p className="text-white font-medium mt-3">- Ahmet Y., Cafe Moda</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

function FeatureItem({ text }: { text: string }) {
    return (
        <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <span className="text-slate-300">{text}</span>
        </div>
    )
}
