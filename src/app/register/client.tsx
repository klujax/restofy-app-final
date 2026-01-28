'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function RegisterClient() {
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

        if (password !== confirmPassword) {
            setError('Şifreler eşleşmiyor')
            return
        }

        if (password.length < 6) {
            setError('Şifre en az 6 karakter olmalı')
            return
        }

        setLoading(true)

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${window.location.origin}/dashboard`
            }
        })

        if (signUpError) {
            console.error('Signup error:', signUpError)
            setError(signUpError.message)
            setLoading(false)
            return
        }

        if (data.session) {
            toast.success('Kayıt başarılı! Yönlendiriliyorsunuz...')
            router.push('/dashboard')
            router.refresh()
        } else if (data.user) {
            // User created but email verification required (or manual approval)
            setError(null) // Clear any previous errors
            toast.success('Kayıt oluşturuldu! Lütfen e-posta adresinize gelen doğrulama linkine tıklayın.')
            // Optional: You might want to show a specific UI state here instead of just a toast
            setLoading(false)
        } else {
            // Fallback
            router.push('/login')
        }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center p-6">
            <div className="w-full max-w-sm">
                {/* Header */}
                <div className="text-center mb-8">
                    <Link href="/" className="inline-block">
                        <h1 className="text-3xl font-bold text-slate-900">Restofy</h1>
                    </Link>
                    <p className="text-slate-500 mt-2">Yeni hesap oluşturun</p>
                </div>

                {/* Form */}
                <form onSubmit={handleRegister} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-lg">
                            {error}
                        </div>
                    )}

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            placeholder="ornek@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Şifre
                        </label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        />
                    </div>

                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1.5">
                            Şifre Tekrar
                        </label>
                        <input
                            id="confirmPassword"
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full h-12 px-4 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-slate-500 mt-6">
                    Zaten hesabınız var mı?{' '}
                    <Link href="/login" className="text-slate-900 font-medium hover:underline">
                        Giriş Yap
                    </Link>
                </p>

                <div className="text-center mt-4">
                    <Link href="/" className="text-sm text-slate-400 hover:text-slate-600">
                        ← Ana Sayfa
                    </Link>
                </div>
            </div>
        </div>
    )
}
