// Temporary mock to fix build
class Iyzipay {
    constructor(config: any) { }
    payment: any = {
        create: (data: any, cb: any) => cb(null, { status: 'failure', errorMessage: 'Payment disabled' })
    }
    checkoutFormInitialize: any = {
        create: (data: any, cb: any) => cb(null, { status: 'failure', errorMessage: 'Payment disabled' }),
        retrieve: (data: any, cb: any) => cb(null, { status: 'failure', errorMessage: 'Payment disabled' })
    }
}

let iyzipay: any;

if (typeof window === 'undefined') {
    iyzipay = new Iyzipay({});
} else {
    iyzipay = {} as any;
}

export default iyzipay;
