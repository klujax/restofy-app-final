# Restofy Kafe - Restoran Yönetim Sistemi ve QR Menü

Restofy Kafe, restoranlar ve cafeler için geliştirilmiş modern, hızlı ve temassız bir yönetim çözümüdür. QR kod ile menü görüntüleme, sipariş verme ve ödeme alma özelliklerini içerir.

## 🚀 Özellikler

*   **QR Menü & Sipariş**: Müşteriler masa QR kodunu okutarak menüye ulaşır ve sipariş verir.
*   **İşletme Kontrol Paneli**: Restoran sahipleri siparişleri anlık takip eder.
*   **Kişiselleştirme**: Menü renkleri, logo ve çalışma saatleri işletmeye özel ayarlanabilir.
*   **Garson Çağırma**: Müşteriler tek tuşla garson isteyebilir.
*   **Ödeme Entegrasyonu**: Kredi kartı ile (Iyzico altyapısı - mock/live) ödeme alma desteği.
*   **Güvenlik**: Şifreli müşteri ve yönetici girişleri.

## 🛠️ Teknolojiler

*   **Framework**: Next.js 15 (App Router)
*   **Dil**: TypeScript
*   **Veritabanı**: Supabase (PostgreSQL)
*   **UI**: Tailwind CSS, Lucide Icons, Radix UI
*   **Ödeme**: Iyzico (Iyzipay)

## 📦 Kurulum

1.  Projeyi klonlayın veya indirin.
2.  Gerekli paketleri yükleyin:
    ```bash
    npm install
    ```
3.  Ortam değişkenlerini (.env.local) ayarladığınızdan emin olun (Supabase URL, Key vb.).
4.  Geliştirme sunucusunu başlatın:
    ```bash
    npm run dev
    ```

## 🔒 Güvenlik Notu

Müşteri şifreleri `bcryptjs` kullanılarak hash'lenmiş şekilde veritabanında saklanmaktadır. Ödeme sistemi varsayılan olarak "Mock" modundadır, gerçek ödemeler için `src/lib/iyzico-client.ts` ve env ayarları düzenlenmelidir.

---
*Geliştirme: Emir B.*
