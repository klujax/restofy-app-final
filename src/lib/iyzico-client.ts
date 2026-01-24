// @ts-ignore
const Iyzipay = require('iyzipay');

let iyzipay: any;

// Ensure this only runs on server
if (typeof window === 'undefined') {
    iyzipay = new Iyzipay({
        apiKey: process.env.IYZICO_API_KEY || 'sandbox-api-key',
        secretKey: process.env.IYZICO_SECRET_KEY || 'sandbox-secret-key',
        uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'
    });
} else {
    // Mock for client side to prevent crashes if accidentally imported
    iyzipay = {} as any;
}

export default iyzipay;
