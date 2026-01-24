'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

// Restaurant Owner Auth
export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    const { error } = await supabase.auth.signInWithPassword(data)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function signup(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
        options: {
            data: {
                business_name: formData.get('businessName') as string,
            },
        },
    }

    const { error } = await supabase.auth.signUp(data)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/dashboard')
}

export async function logout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}

// ==========================================
// CUSTOMER AUTH (Custom Table)
// ==========================================

import { createAdminClient } from '@/lib/supabase/admin'

export async function registerCustomer(data: any) {
    // Use Admin Client to bypass RLS policies
    let supabase;
    try {
        supabase = createAdminClient()
    } catch (e) {
        console.error('Admin Client Init Error:', e)
        return { error: 'Sistem hatası: Service Role Key eksik.' }
    }

    // Check if phone exists
    const { data: existing } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', data.phone)
        .single()

    if (existing) {
        return { error: 'Bu telefon numarası zaten kayıtlı.' }
    }

    // Create customer
    const { data: customer, error } = await supabase
        .from('customers')
        .insert({
            full_name: data.full_name,
            phone: data.phone,
            password_hash: data.password, // TODO: Hash password in prod
            is_guest: false
        })
        .select()
        .single()

    if (error) {
        console.error('Registration Error Detailed:', error)
        return { error: `Kayıt hatası: ${error.message}` }
    }

    return { success: true, user: customer }
}

export async function loginCustomer(phone: string, password: string) {
    // Use Admin Client to bypass RLS
    let supabase;
    try {
        supabase = createAdminClient()
    } catch (e) {
        console.error('Admin Client Init Error:', e)
        return { error: 'Sistem hatası: Service Role Key eksik.' }
    }

    const { data: customer, error } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single()

    if (error || !customer) {
        return { error: 'Kullanıcı bulunamadı.' }
    }

    // Verify password (Simple check for now)
    if (customer.password_hash !== password) {
        return { error: 'Hatalı şifre.' }
    }

    return { success: true, user: customer }
}
