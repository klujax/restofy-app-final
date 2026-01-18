'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

export default function ProfileSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [resettingPassword, setResettingPassword] = useState(false)
    const [deletingAccount, setDeletingAccount] = useState(false)

    const [email, setEmail] = useState('')
    const [createdAt, setCreatedAt] = useState('')
    const [role, setRole] = useState('')

    const router = useRouter()
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

            if (profile) {
                setRole(profile.role || 'owner')
            }

            setLoading(false)
        }
        fetchUser()
    }, [supabase])

    const handlePasswordReset = async () => {
        setResettingPassword(true)
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/reset-password`,
            })

            if (error) throw error

            toast.success('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi')
        } catch (error) {
            console.error('Password reset error:', error)
            toast.error('Şifre sıfırlama e-postası gönderilemedi')
        } finally {
            setResettingPassword(false)
        }
    }

    const handleDeleteAccount = async () => {
        setDeletingAccount(true)
        try {
            // Note: Full account deletion requires server-side implementation
            // This is a placeholder that signs out the user
            toast.error('Hesap silme işlemi için lütfen destek ile iletişime geçin')

            // await supabase.auth.signOut()
            // router.push('/')
        } catch (error) {
            console.error('Delete account error:', error)
            toast.error('Hesap silinemedi')
        } finally {
            setDeletingAccount(false)
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
        <div className="space-y-8 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent flex items-center gap-3">
                    <User className="h-7 w-7 text-orange-500" />
                    Hesap Ayarları
                </h1>
                <p className="text-slate-400 mt-1">
                    Hesap güvenliği ve kişisel bilgilerinizi yönetin
                </p>
            </div>

            {/* Account Info Card */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Mail className="h-5 w-5 text-orange-500" />
                        Hesap Bilgileri
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Hesabınızla ilgili temel bilgiler
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-slate-300">E-posta Adresi</Label>
                        <Input
                            value={email}
                            disabled
                            className="bg-white/5 border-white/10 text-slate-400"
                        />
                        <p className="text-xs text-slate-500">
                            E-posta adresi değiştirilemez
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Hesap Rolü</Label>
                            <div className="flex items-center gap-2 h-10 px-3 rounded-md bg-white/5 border border-white/10">
                                <Shield className="h-4 w-4 text-emerald-400" />
                                <span className="text-slate-300 capitalize">
                                    {role === 'super_admin' ? 'Super Admin' : role === 'owner' ? 'İşletme Sahibi' : 'Kullanıcı'}
                                </span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Kayıt Tarihi</Label>
                            <div className="h-10 px-3 rounded-md bg-white/5 border border-white/10 flex items-center">
                                <span className="text-slate-300">{formatDate(createdAt)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Security Card */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Key className="h-5 w-5 text-orange-500" />
                        Güvenlik
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Şifrenizi güncelleyin
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                        <div>
                            <p className="font-medium text-white">Şifre Değiştir</p>
                            <p className="text-sm text-slate-400">
                                Şifre sıfırlama bağlantısı e-posta adresinize gönderilecek
                            </p>
                        </div>
                        <Button
                            onClick={handlePasswordReset}
                            disabled={resettingPassword}
                            variant="outline"
                            className="bg-white/5 border-white/10 text-white hover:bg-white/10"
                        >
                            {resettingPassword ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                'Şifre Sıfırla'
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Danger Zone Card */}
            <Card className="bg-red-500/5 border-red-500/20">
                <CardHeader>
                    <CardTitle className="text-red-400 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Tehlikeli Bölge
                    </CardTitle>
                    <CardDescription className="text-red-300/70">
                        Bu işlemler geri alınamaz
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                        <div>
                            <p className="font-medium text-red-400">Hesabı Sil</p>
                            <p className="text-sm text-red-300/70">
                                Tüm verileriniz kalıcı olarak silinecek
                            </p>
                        </div>
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button
                                    variant="destructive"
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Hesabı Sil
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="bg-[#1a1a1a] border-white/10 text-white">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-red-400">Hesabınızı silmek istediğinizden emin misiniz?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-slate-400">
                                        Bu işlem geri alınamaz. Tüm verileriniz (menü, siparişler, ayarlar) kalıcı olarak silinecektir.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                                        İptal
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                        onClick={handleDeleteAccount}
                                        disabled={deletingAccount}
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        {deletingAccount ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            'Evet, Hesabımı Sil'
                                        )}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
