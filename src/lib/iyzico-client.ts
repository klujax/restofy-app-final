// Temporary mock to fix build
interface MockCallback {
    (err: { status: string; errorMessage: string } | null, result: { status: string; errorMessage?: string; paymentPageUrl?: string; basketId?: string; paymentStatus?: string; paymentId?: string } | null): void;
}

class Iyzipay {
    constructor() { }

    payment = {
        create: (_data: unknown, cb: MockCallback) => cb(null, { status: 'failure', errorMessage: 'Payment disabled' })
    };

    checkoutFormInitialize = {
        create: (_data: unknown, cb: MockCallback) => cb(null, { status: 'failure', errorMessage: 'Payment disabled' }),
        retrieve: (_data: unknown, cb: MockCallback) => cb(null, { status: 'failure', errorMessage: 'Payment disabled' })
    };
}

let iyzipay: Iyzipay;

if (typeof window === 'undefined') {
    iyzipay = new Iyzipay();
} else {
    // Client-side fallback
    iyzipay = new Iyzipay();
}

export default iyzipay;
