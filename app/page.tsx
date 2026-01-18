import Link from "next/link";

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center">
      <div className="max-w-xl">
        <h1 className="text-5xl font-extrabold tracking-tight text-slate-900 sm:text-6xl mb-6">
          Restofy Kafe
        </h1>
        <p className="text-lg text-slate-600 mb-8">
          Kafeler için yeni nesil QR menü ve sipariş yönetim sistemi.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/login"
            className="rounded-xl bg-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-orange-700 hover:shadow-xl"
          >
            Yönetici Girişi
          </Link>
        </div>
      </div>
    </main>
  );
}