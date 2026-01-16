'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
    Settings,
    Store,
    Coins,
    Wifi,
    ImageIcon,
    Loader2,
    Save,
    Upload,
    X,
    Coffee,
    Palette
} from 'lucide-react'



interface ProfileData {
    id: string
    business_name: string
    currency: string
    logo_url: string | null
    wifi_password?: string
    description?: string
    theme_color?: string
    qr_color?: string
}

export default function SettingsPage() {
    const [profile, setProfile] = useState<ProfileData | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    const [businessName, setBusinessName] = useState('')
    const [wifiPassword, setWifiPassword] = useState('')
    const [description, setDescription] = useState('')
    const [themeColor, setThemeColor] = useState('#f97316')
    const [qrColor, setQrColor] = useState('#000000')
    const [logoUrl, setLogoUrl] = useState<string | null>(null)
    const [logoFile, setLogoFile] = useState<File | null>(null)
    const [logoPreview, setLogoPreview] = useState<string | null>(null)

    const fileInputRef = useRef<HTMLInputElement>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchProfile()
    }, [])

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()

            if (error) throw error

            if (data) {
                setProfile(data)
                setBusinessName(data.business_name || '')
                setWifiPassword(data.wifi_password || '')
                setDescription(data.description || '')
                setThemeColor(data.theme_color || '#f97316')
                setQrColor(data.qr_color || '#000000')
                setLogoUrl(data.logo_url)
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
            toast.error('Profil yüklenirken hata oluştu')
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            setLogoFile(file)
            const previewUrl = URL.createObjectURL(file)
            setLogoPreview(previewUrl)
        }
    }

    const clearLogo = () => {
        setLogoFile(null)
        if (logoPreview) {
            URL.revokeObjectURL(logoPreview)
        }
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
        if (!profile) return

        setSaving(true)
        try {
            // Upload logo if new file selected
            let newLogoUrl = logoUrl
            if (logoFile) {
                newLogoUrl = await uploadLogo()
            }

            const { error } = await supabase
                .from('profiles')
                .update({
                    business_name: businessName,
                    currency: '₺',
                    wifi_password: wifiPassword,
                    description: description,
                    theme_color: themeColor,
                    qr_color: qrColor,
                    logo_url: newLogoUrl,
                })
                .eq('id', profile.id)

            if (error) throw error

            setLogoUrl(newLogoUrl)
            setLogoFile(null)
            setLogoPreview(null)

            toast.success('Ayarlar kaydedildi! ✓')
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
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    const currentLogo = logoPreview || logoUrl
    const fallbackAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(businessName || 'Cafe')}&background=random&color=fff&size=128`

    return (
        <div className="space-y-6 max-w-2xl">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                    <Settings className="h-8 w-8" />
                    Ayarlar
                </h2>
                <p className="text-muted-foreground">
                    Kafe profilinizi ve tercihlerinizi yönetin.
                </p>
            </div>

            {/* Cafe Info Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Store className="h-5 w-5" />
                        Kafe Bilgileri
                    </CardTitle>
                    <CardDescription>
                        Müşterilerinizin göreceği temel bilgiler
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="businessName">Kafe Adı</Label>
                        <Input
                            id="businessName"
                            placeholder="Örn: Keyifli Kahve"
                            value={businessName}
                            onChange={(e) => setBusinessName(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Açıklama (Opsiyonel)</Label>
                        <Input
                            id="description"
                            placeholder="Örn: 1990'dan beri kaliteli kahve"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Logo Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        Logo
                    </CardTitle>
                    <CardDescription>
                        Menüde görünecek kafe logosu
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-start gap-6">
                        {/* Current Logo Preview */}
                        <div className="shrink-0">
                            <div className="relative">
                                <img
                                    src={currentLogo || fallbackAvatar}
                                    alt="Logo"
                                    className="h-24 w-24 rounded-xl object-cover border-2 border-muted"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement
                                        target.src = fallbackAvatar
                                    }}
                                />
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
                        </div>

                        {/* Upload Button */}
                        <div className="space-y-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => fileInputRef.current?.click()}
                                className="gap-2"
                            >
                                <Upload className="h-4 w-4" />
                                Logo Yükle
                            </Button>
                            <p className="text-xs text-muted-foreground">
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

            {/* Brand Color Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Palette className="h-5 w-5" />
                        Renkler
                    </CardTitle>
                    <CardDescription>
                        Menü ve QR kod için ayrı tema renkleri
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Menu Theme Color */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">Menü Tema Rengi</Label>
                        <p className="text-xs text-muted-foreground">
                            Müşteri menüsünde butonlar ve vurgular için kullanılır
                        </p>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={themeColor}
                                onChange={(e) => setThemeColor(e.target.value)}
                                className="w-14 h-14 rounded-xl cursor-pointer border-2 border-muted overflow-hidden"
                                style={{ padding: 0 }}
                            />
                            <Input
                                value={themeColor}
                                onChange={(e) => setThemeColor(e.target.value)}
                                placeholder="#f97316"
                                className="w-28 font-mono uppercase"
                                maxLength={7}
                            />
                            <div
                                className="h-10 w-10 rounded-lg border"
                                style={{ backgroundColor: themeColor }}
                            />
                        </div>
                    </div>

                    <Separator />

                    {/* QR Code Color */}
                    <div className="space-y-3">
                        <Label className="text-sm font-medium">QR Kod Rengi</Label>
                        <p className="text-xs text-muted-foreground">
                            QR kodlarının ön plan rengi (varsayılan: siyah)
                        </p>
                        <div className="flex items-center gap-3">
                            <input
                                type="color"
                                value={qrColor}
                                onChange={(e) => setQrColor(e.target.value)}
                                className="w-14 h-14 rounded-xl cursor-pointer border-2 border-muted overflow-hidden"
                                style={{ padding: 0 }}
                            />
                            <Input
                                value={qrColor}
                                onChange={(e) => setQrColor(e.target.value)}
                                placeholder="#000000"
                                className="w-28 font-mono uppercase"
                                maxLength={7}
                            />
                            <div
                                className="h-10 w-10 rounded-lg border"
                                style={{ backgroundColor: qrColor }}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Preferences Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5" />
                        Tercihler
                    </CardTitle>
                    <CardDescription>
                        Para birimi ve diğer ayarlar
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Para Birimi</Label>
                        <Input
                            value="₺ Türk Lirası (TRY)"
                            disabled
                            className="bg-muted"
                        />
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label htmlFor="wifiPassword" className="flex items-center gap-2">
                            <Wifi className="h-4 w-4" />
                            Wi-Fi Şifresi (Opsiyonel)
                        </Label>
                        <Input
                            id="wifiPassword"
                            placeholder="Müşterilerinize göstermek için"
                            value={wifiPassword}
                            onChange={(e) => setWifiPassword(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Bu bilgi menüde görünebilir
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button
                    onClick={handleSave}
                    disabled={saving || uploading}
                    size="lg"
                    className="gap-2"
                >
                    {saving || uploading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            {uploading ? 'Logo yükleniyor...' : 'Kaydediliyor...'}
                        </>
                    ) : (
                        <>
                            <Save className="h-4 w-4" />
                            Değişiklikleri Kaydet
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
