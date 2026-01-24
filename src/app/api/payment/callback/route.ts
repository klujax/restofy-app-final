import { createClient } from '@/lib/supabase/server';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const token = formData.get('token') as string;

        if (!token) {
            return NextResponse.json({ error: 'Token missing' }, { status: 400 });
        }

        let supabase;
        try {
            const { createAdminClient } = await import('@/lib/supabase/admin');
            supabase = createAdminClient();
        } catch {
            const { createClient } = await import('@/lib/supabase/server');
            supabase = await createClient();
        }

        // @ts-ignore
        const { default: iyzipay } = await import('@/lib/iyzico-client');

        return new Promise<NextResponse>((resolve) => {
            iyzipay.checkoutFormInitialize.retrieve({
                locale: 'tr',
                conversationId: '123456789', // Not strictly verified by Iyzico SDK in retrieve
                token: token
            }, async (err: any, result: any) => {
                if (err || result.status !== 'success' || result.paymentStatus !== 'SUCCESS') {
                    console.error('Payment Verification Failed:', err || result.errorMessage);
                    // Redirect to failure page
                    // We need to find the restaurant slug ideally, but we might not have it easily here
                    // unless we query by orderID if available in result, or use a generic failure page.
                    // Let's try to find order from basketId if available

                    const orderId = result?.basketId;
                    let redirectUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://restofy-kafe.vercel.app';

                    if (orderId) {
                        // Update order as failed
                        await supabase.from('orders').update({ status: 'cancelled', notes: 'Ödeme başarısız' }).eq('id', orderId);
                    }

                    resolve(NextResponse.redirect(`${redirectUrl}/payment/failure`, 302));
                } else {
                    // Success
                    const orderId = result.basketId;

                    // 1. Update Order Status
                    const { data: order, error: orderError } = await supabase
                        .from('orders')
                        .update({
                            status: 'received', // 'Onaylandı'
                            notes: `[KREDİ KARTI İLE ÖDENDİ] - Iyzico Payment ID: ${result.paymentId}`
                        })
                        .eq('id', orderId)
                        .select('*, restaurants(slug)')
                        .single();

                    if (orderError || !order) {
                        console.error('Order update failed:', orderError);
                        // Payment successful but DB update failed - critical error
                        // Still redirect to success but maybe log this
                        return resolve(NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/payment/success?orderId=${orderId}`, 302));
                    }

                    // 2. Redirect to Menu with Order Tracker parameter
                    // Format: /menu/[slug]?orderId=...&payment_success=true
                    const restaurantSlug = order.restaurants?.slug || order.restaurant_id; // Fallback
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://restofy-kafe.vercel.app';
                    const redirectUrl = `${baseUrl}/menu/${restaurantSlug}?table=${order.table_number}&orderId=${orderId}&payment_success=true`;

                    resolve(NextResponse.redirect(redirectUrl, 302));
                }
            });
        });

    } catch (e: any) {
        console.error('Callback Error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
