import { createAdminClient } from '@/lib/supabase/admin';

import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { cafeId, items, totalPrice, tableNumber, customerName, customerId, saveCard } = body;

        let supabase;
        try {
            supabase = createAdminClient();
        } catch (e) {
            console.error('Admin Client Init Error:', e);
            // Fallback to regular client if admin key missing (will likely fail RLS)
            const { createClient } = await import('@/lib/supabase/server');
            supabase = await createClient();
        }

        // 1. Get Restaurant info
        const { data: restaurant, error: restError } = await supabase
            .from('restaurants')
            .select('*')
            .eq('id', cafeId)
            .single();

        if (restError || !restaurant) {
            return NextResponse.json({ error: 'Restoran bulunamadı' }, { status: 404 });
        }

        // 2. Create Order in Pending State
        const notes = `[ONLINE ÖDEME BEKLİYOR] - ${customerName || 'Misafir'}`;

        const { data: order, error: orderError } = await supabase
            .from('orders')
            .insert({
                restaurant_id: cafeId,
                profile_id: restaurant.owner_id,
                customer_name: customerName || 'Misafir',
                table_number: tableNumber,
                total_amount: totalPrice,
                status: 'pending', // Pending payment
                notes: notes,
            })
            .select()
            .single();

        if (orderError) throw new Error(`Sipariş oluşturulamadı: ${orderError.message}`);

        // 3. Insert Order Items
        const orderItems = items.map((item: any) => ({
            order_id: order.id,
            menu_item_id: item.menuItem.id,
            menu_item_name: item.menuItem.name,
            quantity: item.quantity,
            unit_price: item.menuItem.price,
            total_price: item.menuItem.price * item.quantity,
        }));

        const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
        if (itemsError) throw new Error(`Sipariş detayları kaydedilemedi: ${itemsError.message}`);

        // 4. Determine Callback URL
        // Use request origin or env var
        const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'https://restofy-kafe.vercel.app';
        const callbackUrl = `${origin}/api/payment/callback`;

        // 5. Initialize Iyzico Checkout Form
        // CHECK FOR MOCK MODE: If keys are default 'sandbox' keys or explicitly disabled
        const isMockMode = true; // Forced for testing as per user request

        if (isMockMode) {
            console.log('Running in MOCK PAYMENT mode');

            // Simulate successful payment instantly
            await supabase
                .from('orders')
                .update({
                    status: 'received', // 'Onaylandı'
                    notes: `[MOCK ÖDEME - TEST] - ${notes}`
                })
                .eq('id', order.id);

            // Return URL to redirect back to menu immediately
            const restaurantSlug = restaurant.slug || restaurant.id;
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://restofy-kafe.vercel.app';
            // Use origin from request if available for localhost support
            const effectiveBaseUrl = req.headers.get('origin') || baseUrl;

            const successUrl = `${effectiveBaseUrl}/menu/${restaurantSlug}?table=${tableNumber}&orderId=${order.id}&payment_success=true`;

            return NextResponse.json({
                success: true,
                paymentPageUrl: successUrl,
                orderId: order.id
            });
        }

        // Dynamically import iyzipay only when needed (and in production mode)
        // @ts-ignore
        const { default: iyzipay } = await import('@/lib/iyzico-client');

        const request = {
            locale: 'tr',
            conversationId: order.id,
            price: totalPrice.toFixed(2),
            paidPrice: totalPrice.toFixed(2),
            currency: 'TRY',
            basketId: order.id,
            paymentGroup: 'PRODUCT',
            callbackUrl: callbackUrl,
            enabledInstallments: [1],
            buyer: {
                id: order.id,
                name: customerName || 'Misafir',
                surname: 'Müşteri',
                gsmNumber: '+905555555555',
                email: 'guest@restofy.app',
                identityNumber: '11111111111',
                lastLoginDate: '2024-01-01 12:00:00',
                registrationDate: '2024-01-01 12:00:00',
                registrationAddress: `Masa ${tableNumber}`,
                ip: '85.34.78.112', // In prod use req.headers.get('x-forwarded-for')
                city: 'Istanbul',
                country: 'Turkey',
                zipCode: '34732'
            },
            shippingAddress: {
                contactName: customerName || 'Misafir',
                city: 'Istanbul',
                country: 'Turkey',
                address: `Masa ${tableNumber} - ${restaurant.name}`,
                zipCode: '34732'
            },
            billingAddress: {
                contactName: customerName || 'Misafir',
                city: 'Istanbul',
                country: 'Turkey',
                address: `Masa ${tableNumber} - ${restaurant.name}`,
                zipCode: '34732'
            },
            basketItems: items.map((item: any) => ({
                id: item.menuItem.id,
                name: item.menuItem.name,
                category1: 'Gıda',
                itemType: 'PHYSICAL',
                price: (item.menuItem.price * item.quantity).toFixed(2)
            }))
        };

        return new Promise<NextResponse>((resolve) => {
            iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
                if (err || result.status !== 'success') {
                    console.error('Iyzico Init Error:', err || result.errorMessage);
                    // If payment init fails, we should technically cancel the order or retry
                    // For now, return error
                    resolve(NextResponse.json({ error: result?.errorMessage || 'Ödeme başlatılamadı' }, { status: 400 }));
                } else {
                    resolve(NextResponse.json({
                        success: true,
                        paymentPageUrl: result.paymentPageUrl,
                        orderId: order.id
                    }));
                }
            });
        });

    } catch (e: any) {
        console.error('Payment API Error:', e);
        return NextResponse.json({ error: e.message || 'Bir hata oluştu' }, { status: 500 });
    }
}
