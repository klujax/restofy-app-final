import Link from "next/link";

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm text-center">
        {/* Logo */}
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          Restofy
        </h1>
        <p className="text-slate-500 mb-12">
          Restoran Yönetim Sistemi
        </p>

        {/* Buttons */}
        <div className="space-y-4">
          <Link
            href="/register"
            className="block w-full py-4 px-6 bg-slate-900 text-white font-medium rounded-lg hover:bg-slate-800 transition-colors"
          >
            Kayıt Ol
          </Link>

          <Link
            href="/login"
            className="block w-full py-4 px-6 bg-white text-slate-900 font-medium rounded-lg border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-colors"
          >
            Üye Girişi
          </Link>
        </div>
      </div>
    </main>
  );
}