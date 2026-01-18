'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Store,
    Palette,
    Upload,
    Loader2,
    Save,
    ImageIcon,
    X,
    Coins
} from 'lucide-react'
import { toast } from 'sonner'

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

const CURRENCIES = [
    { code: '₺', name: 'Türk Lirası (TRY)' },
    { code: '$', name: 'ABD Doları (USD)' },
    { code: '€', name: 'Euro (EUR)' },
]

export default function ShopSettingsPage() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [businessName, setBusinessName] = useState('')
    const [description, setDescription] = useState('')
    const [themeColor, setThemeColor] = useState('#f97316')
    const [qrColor, setQrColor] = useState('#000000')
    const [currency, setCurrency] = useState('₺')
    const [wifiPassword, setWifiPassword] = useState('')
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) {
                console.error('Error fetching profile:', error)
                toast.error('Ayarlar yüklenemedi')
            }

            if (data) {
                setBusinessName(data.business_name || '')
                setDescription(data.description || '')
                setThemeColor(data.theme_color || '#f97316')
                setQrColor(data.qr_color || '#000000')
                setCurrency(data.currency || '₺')
                setWifiPassword(data.wifi_password || '')
                setLogoUrl(data.logo_url)
            }
            setLoading(false)
        }
        fetchProfile()
    }, [supabase])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Dosya 2MB\'dan küçük olmalı')
            return
        }

        setLogoFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
            setLogoPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
    }

    const clearLogo = () => {
        setLogoFile(null)
        setLogoPreview(null)
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const uploadLogo = async (): Promise<string | null> => {
        if (!logoFile) return logoUrl

        setUploading(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('Not authenticated')

            const fileExt = logoFile.name.split('.').pop()
            const fileName = `${user.id}/logo-${Date.now()}.${fileExt}`

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, logoFile, { upsert: true })

            if (uploadError) throw uploadError

            const { data: urlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName)

            return urlData.publicUrl
        } catch (error) {
            console.error('Error uploading logo:', error)
            toast.error('Logo yüklenirken hata oluştu')
            return null
        } finally {
            setUploading(false)
        }
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Oturum bulunamadı')
                return
            }

            let newLogoUrl = logoUrl
            if (logoFile) {
                newLogoUrl = await uploadLogo()
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    business_name: businessName,
                    description: description,
                    theme_color: themeColor,
                    qr_color: qrColor,
                    currency: currency,
                    wifi_password: wifiPassword,
                    logo_url: newLogoUrl,
                })
                .eq('id', user.id)

            if (error) throw error

            setLogoUrl(newLogoUrl)
            setLogoFile(null)
            setLogoPreview(null)

            toast.success('Ayarlar kaydedildi!')
        } catch (error) {
            console.error('Error saving settings:', error)
            toast.error('Ayarlar kaydedilirken hata oluştu')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
        )
    }

    const currentLogo = logoPreview || logoUrl

    return (
        <div className="space-y-8 max-w-3xl">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent flex items-center gap-3">
                    <Store className="h-7 w-7 text-orange-500" />
                    İşletme Ayarları
                </h1>
                <p className="text-slate-400 mt-1">
                    Kafenizin görünümünü ve bilgilerini özelleştirin
                </p>
            </div>

            {/* Business Info Card */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Store className="h-5 w-5 text-orange-500" />
                        İşletme Bilgileri
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Müşterilerinizin göreceği temel bilgiler
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-slate-300">İşletme Adı</Label>
                        <Input
                            placeholder="Örn: Keyifli Kahve"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Açıklama (Opsiyonel)</Label>
                        <Input
                            placeholder="Örn: 1990'dan beri kaliteli kahve"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-slate-300">Wi-Fi Şifresi (Opsiyonel)</Label>
                        <Input
                            placeholder="Müşterilerinize göstermek için"
                            value={wifiPassword}
                            onChange={(e) => setWifiPassword(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-slate-500"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Logo Card */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <ImageIcon className="h-5 w-5 text-orange-500" />
                        Logo
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Menüde ve QR kodlarda görünecek logo
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-6">
                        <div className="shrink-0 relative">
                            {currentLogo ? (
                                <img
                                    src={currentLogo}
                                    alt="Logo"
                                    className="h-24 w-24 rounded-xl object-cover border-2 border-white/10"
                                />
                            ) : (
                                <div className="h-24 w-24 rounded-xl bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center">
                                    <ImageIcon className="h-8 w-8 text-slate-500" />
                                </div>
                            )}
                            {logoPreview && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6"
                                    onClick={clearLogo}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="gap-2 bg-white/5 border-white/10 text-white hover:bg-white/10"
                            >
                                <Upload className="h-4 w-4" />
                                Logo Yükle
                            </Button>
                            <p className="text-xs text-slate-500">
                                PNG, JPG veya WebP. Max 2MB.
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Theme Colors Card */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Palette className="h-5 w-5 text-orange-500" />
                        Renkler
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Menü ve QR kod için tema renkleri
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Menu Theme Color */}
                    <div className="space-y-3">
                        <Label className="text-slate-300">Menü Tema Rengi</Label>
                        <p className="text-xs text-slate-500">
                            Butonlar ve vurgular için kullanılır
                        </p>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                            {THEME_COLORS.map((color) => (
                                <button
                                    key={color.value}
                                    type="button"
                                    onClick={() => setThemeColor(color.value)}
                                    className={`h-10 rounded-lg transition-all ${themeColor === color.value
                                            ? 'ring-2 ring-white ring-offset-2 ring-offset-[#0a0a0a] scale-110'
                                            : 'hover:scale-105 opacity-70 hover:opacity-100'
                                        }`}
                                    style={{ backgroundColor: color.value }}
                                    title={color.name}
                                />
                            ))}
                        </div>
                    </div>

                    {/* QR Color */}
                    <div className="space-y-3">
                        <Label className="text-slate-300">QR Kod Rengi</Label>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={qrColor}
                                onChange={(e) => setQrColor(e.target.value)}
                                className="w-14 h-14 rounded-xl cursor-pointer border-2 border-white/10 overflow-hidden bg-transparent"
                            />
                            <Input
                                value={qrColor}
                                onChange={(e) => setQrColor(e.target.value)}
                                placeholder="#000000"
                                className="w-28 font-mono uppercase bg-white/5 border-white/10 text-white"
                                maxLength={7}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Currency Card */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <Coins className="h-5 w-5 text-orange-500" />
                        Para Birimi
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2">
                        {CURRENCIES.map((cur) => (
                            <Button
                                key={cur.code}
                                type="button"
                                variant="outline"
                                onClick={() => setCurrency(cur.code)}
                                className={`gap-2 ${currency === cur.code
                                        ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                                        : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                                    }`}
                            >
                                <span className="font-bold">{cur.code}</span>
                                {cur.name}
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving || uploading}
                    className="h-12 px-8 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-lg font-semibold gap-2"
                >
                    {saving || uploading ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {uploading ? 'Yükleniyor...' : 'Kaydediliyor...'}
                        </>
                    ) : (
                        <>
                            <Save className="h-5 w-5" />
                            Kaydet
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
