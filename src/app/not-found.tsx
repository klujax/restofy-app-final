export const dynamic = 'force-dynamic'

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <div className="text-center">
                <h1 className="text-8xl font-bold text-slate-900 mb-4">404</h1>
                <p className="text-xl text-slate-500 mb-8">
                    Sayfa bulunamadı
                </p>
                <a
                    href="/"
                    className="inline-flex items-center px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-colors"
                >
                    Ana Sayfaya Dön
                </a>
            </div>
        </div>
    )
}
