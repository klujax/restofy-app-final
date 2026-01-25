import Link from 'next/link'

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-white text-slate-900">
            <h2 className="text-3xl font-bold mb-4">Sayfa Bulunamadı</h2>
            <p className="text-slate-600 mb-8">Aradığınız sayfaya ulaşılamıyor.</p>
            <Link
                href="/"
                className="px-6 py-3 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
                Ana Sayfaya Dön
            </Link>
        </div>
    )
}
