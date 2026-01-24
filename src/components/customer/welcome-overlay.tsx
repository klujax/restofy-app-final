'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { User, LogIn, UserPlus, ArrowRight } from 'lucide-react'
import { loginCustomer, registerCustomer } from '@/app/auth/actions'

interface WelcomeOverlayProps {
    restaurantName: string
    onComplete: (user: any) => void
}

export function WelcomeOverlay({ restaurantName, onComplete }: WelcomeOverlayProps) {
    const [isOpen, setIsOpen] = useState(false) // Initially false to prevent flash
    const [loading, setLoading] = useState(false)
    const [authTab, setAuthTab] = useState('login')

    // Form states
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')

    const supabase = createClient()

    useEffect(() => {
        // Check local session
        const storedUser = localStorage.getItem('customer_user')
        const isGuest = localStorage.getItem('is_guest')

        if (storedUser) {
            onComplete(JSON.parse(storedUser))
        } else if (isGuest) {
            onComplete({ is_guest: true })
        } else {
            setIsOpen(true)
        }
    }, [onComplete])

    const handleGuest = () => {
        localStorage.setItem('is_guest', 'true')
        setIsOpen(false)
        onComplete({ is_guest: true })
        toast.info('Misafir olarak devam ediliyor')
    }

    const handleLogin = async () => {
        if (!phone || !password) {
            toast.error('Lütfen telefon ve şifre girin')
            return
        }
        setLoading(true)
        try {
            // Call Server Action
            const result = await loginCustomer(phone, password)

            if (result.error) {
                toast.error(result.error)
            } else {
                const user = { ...result.user, is_guest: false }
                localStorage.setItem('customer_user', JSON.stringify(user))
                setIsOpen(false)
                onComplete(user)
                toast.success(`Hoşgeldin ${result.user.full_name}!`)
            }
        } catch (e) {
            console.error(e)
            toast.error('Giriş başarısız')
        } finally {
            setLoading(false)
        }
    }

    const handleRegister = async () => {
        if (!phone || !password || !fullName) {
            toast.error('Tüm alanları doldurun')
            return
        }
        setLoading(true)
        try {
            // Call Server Action
            const result = await registerCustomer({
                full_name: fullName,
                phone: phone,
                password: password
            })

            if (result.error) {
                toast.error(result.error)
                return
            }

            const user = { ...result.user, is_guest: false }
            localStorage.setItem('customer_user', JSON.stringify(user))
            setIsOpen(false)
            onComplete(user)
            toast.success('Kayıt başarılı! Hoşgeldiniz.')

        } catch (e) {
            console.error(e)
            toast.error('Kayıt oluşturulamadı')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white text-center">
                    <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold">{restaurantName}</h2>
                    <p className="text-slate-300 text-sm mt-1">Sipariş vermek için giriş yapın</p>
                </div>

                <div className="p-6">
                    <Tabs value={authTab} onValueChange={setAuthTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-6">
                            <TabsTrigger value="login">Giriş Yap</TabsTrigger>
                            <TabsTrigger value="register">Kayıt Ol</TabsTrigger>
                        </TabsList>

                        <TabsContent value="login" className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder="Telefon Numaranız"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                                <Input
                                    placeholder="Şifre"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <Button className="w-full h-12 text-lg" onClick={handleLogin} disabled={loading}>
                                {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                            </Button>
                        </TabsContent>

                        <TabsContent value="register" className="space-y-4">
                            <div className="space-y-2">
                                <Input
                                    placeholder="Ad Soyad"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                />
                                <Input
                                    placeholder="Telefon Numaranız"
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                />
                                <Input
                                    placeholder="Şifre Belirleyin"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                            <Button className="w-full h-12 text-lg bg-emerald-600 hover:bg-emerald-700" onClick={handleRegister} disabled={loading}>
                                {loading ? 'Kaydediliyor...' : 'Kayıt Ol ve Devam Et'}
                            </Button>
                        </TabsContent>
                    </Tabs>

                    <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                        <p className="text-slate-500 text-sm mb-3">Hesap oluşturmak istemiyor musun?</p>
                        <Button variant="outline" className="w-full border-slate-300 text-slate-600 hover:bg-slate-50" onClick={handleGuest}>
                            Misafir Olarak Devam Et
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
