import { redirect } from 'next/navigation'

// Redirect /dashboard/settings to /dashboard/settings/shop
export default function SettingsPage() {
    redirect('/dashboard/settings/shop')
}
