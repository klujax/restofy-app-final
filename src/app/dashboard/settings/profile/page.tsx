'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import {
    User,
    Key,
    Trash2,
    Loader2,
    Shield,
    AlertTriangle,
    Calendar,
    ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

export default function ProfilePage() {
    const [loading, setLoading] = useState(true)
    const [resettingPassword, setResettingPassword] = useState(false)

    const [email, setEmail] = useState('')
    const [createdAt, setCreatedAt] = useState('')
    const [role, setRole] = useState('')

    const supabase = createClient()

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            setEmail(user.email || '')
            setCreatedAt(user.created_at || '')

            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single()

            if (profile) setRole(profile.role || 'owner')
            setLoading(false)
        }
        fetchUser()
    }, [supabase])

    const handlePasswordReset = async () => {
        setResettingPassword(true)
        try {
            await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })
            toast.success('Şifre sıfırlama linki gönderildi!')
        } catch {
            toast.error('Bir hata oluştu')
        } finally {
            setResettingPassword(false)
        }
    }

    const formatDate = (dateString: string) => {
        try {
            return new Date(dateString).toLocaleDateString('tr-TR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            })
        } catch {
            return '-'
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto py-10 px-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                    <User className="h-8 w-8 text-indigo-500" />
                    Profil ve Güvenlik
                </h1>
                <p className="text-slate-500 mt-2 font-medium italic">
                    Restofy hesabınızı ve giriş güvenliğinizi bu panelden kontrol edebilirsiniz.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Left: Summary Info */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="p-8 border-slate-200 shadow-sm bg-white overflow-hidden text-center relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-500" />
                        <div className="mx-auto h-24 w-24 rounded-3xl bg-slate-50 border-2 border-slate-100 flex items-center justify-center mb-4 transition-transform hover:scale-105">
                            <User className="h-10 w-10 text-slate-400" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-800 break-words">{email}</h2>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold mt-2 border border-indigo-100 uppercase tracking-tighter">
                            <Shield className="h-3 w-3" />
                            {role === 'super_admin' ? 'Süper Yönetici' : 'İşletme Sahibi'}
                        </span>
                    </Card>

                    <Card className="p-6 border-slate-200 shadow-sm bg-white space-y-4">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-slate-400" />
                            <div className="text-left">
                                <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest">Kayıt Tarihi</p>
                                <p className="text-sm font-bold text-slate-700">{formatDate(createdAt)}</p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right: Security & Actions */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="p-8 border-slate-200 shadow-sm bg-white">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center border border-amber-100">
                                <Key className="h-5 w-5 text-amber-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Giriş Güvenliği</h3>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <p className="font-bold text-slate-800">Şifre Değiştir</p>
                                <p className="text-sm text-slate-500 mt-0.5 font-medium">Hesap güvenliğiniz için periyodik olarak şifrenizi yenileyin.</p>
                            </div>
                            <Button
                                onClick={handlePasswordReset}
                                disabled={resettingPassword}
                                className="bg-white border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-bold h-11 px-6 shadow-sm whitespace-nowrap gap-2"
                                variant="outline"
                            >
                                {resettingPassword ? <Loader2 className="h-4 w-4 animate-spin text-indigo-500" /> : <ExternalLink className="h-4 w-4" />}
                                Şifre Sıfırlama Linki Gönder
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-8 border-red-100 shadow-sm bg-white overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-1 bg-red-500 h-full" />
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center border border-red-100">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-red-600">Tehlikeli Alan</h3>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div>
                                <p className="font-bold text-slate-800">Hesabı Tamamen Sil</p>
                                <p className="text-sm text-slate-500 mt-0.5 font-medium">Hesabınız ve tüm mağaza verileriniz kalıcı olarak silinecektir.</p>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold h-11 px-8 shadow-sm gap-2">
                                        <Trash2 className="h-4 w-4" />
                                        Hesabı Sil
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white rounded-3xl border-none shadow-2xl p-8">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle className="text-2xl font-bold text-slate-900">Emin misiniz?</AlertDialogTitle>
                                        <AlertDialogDescription className="text-slate-500 font-medium py-2">
                                            Bu işlem geri alınamaz. Tüm restoran verileriniz, menüleriniz ve geçmiş siparişleriniz sunucularımızdan kalıcı olarak temizlenecektir.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter className="gap-3 mt-6">
                                        <AlertDialogCancel className="bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl h-12 px-6 font-bold border-2">
                                            Vazgeç
                                        </AlertDialogCancel>
                                        <AlertDialogAction
                                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-red-500/30"
                                            onClick={() => toast.error('Lütfen silme işlemi için destek ekibimizle iletişime geçin.')}
                                        >
                                            Onayla ve Sil
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    )
}
