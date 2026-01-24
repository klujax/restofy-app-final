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
    Mail,
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
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <User className="h-6 w-6 text-blue-400" />
                    Hesap & Güvenlik
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                    Hesap bilgilerinizi ve güvenlik ayarlarınızı yönetin
                </p>
            </div>

            {/* Account Card */}
            <Card className="bg-slate-800/30 border-white/5 overflow-hidden">
                <div className="p-6 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                            <User className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <p className="text-lg font-semibold text-white">{email}</p>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="inline-flex items-center gap-1 text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded-full">
                                    <Shield className="h-3 w-3" />
                                    {role === 'super_admin' ? 'Super Admin' : 'İşletme Sahibi'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm font-medium text-white">E-posta</p>
                                <p className="text-xs text-slate-400">{email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5">
                        <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-slate-400" />
                            <div>
                                <p className="text-sm font-medium text-white">Kayıt Tarihi</p>
                                <p className="text-xs text-slate-400">{formatDate(createdAt)}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Password Card */}
            <Card className="bg-slate-800/30 border-white/5 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                            <Key className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-white">Şifre</p>
                            <p className="text-sm text-slate-400">Şifrenizi e-posta ile sıfırlayın</p>
                        </div>
                    </div>
                    <Button
                        onClick={handlePasswordReset}
                        disabled={resettingPassword}
                        variant="outline"
                        className="bg-white/5 border-white/10 text-white hover:bg-white/10 rounded-xl gap-2"
                    >
                        {resettingPassword ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <ExternalLink className="h-4 w-4" />
                        )}
                        Şifre Sıfırla
                    </Button>
                </div>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-red-500/5 border-red-500/20 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                            <AlertTriangle className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                            <p className="font-semibold text-red-400">Hesabı Sil</p>
                            <p className="text-sm text-red-300/70">Bu işlem geri alınamaz</p>
                        </div>
                    </div>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="bg-red-600 hover:bg-red-700 rounded-xl gap-2">
                                <Trash2 className="h-4 w-4" />
                                Sil
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-slate-900 border-white/10 text-white">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-red-400">Emin misiniz?</AlertDialogTitle>
                                <AlertDialogDescription className="text-slate-400">
                                    Tüm verileriniz silinecek. Bu işlem geri alınamaz.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                    İptal
                                </AlertDialogCancel>
                                <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() => toast.error('Destek ile iletişime geçin')}
                                >
                                    Evet, Sil
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </Card>
        </div>
    )
}
