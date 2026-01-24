declare module 'iyzipay' {
    interface Options {
        apiKey: string;
        secretKey: string;
        uri: string;
    }

    interface PaymentCard {
        cardHolderName: string;
        cardNumber: string;
        expireMonth: string;
        expireYear: string;
        cvc: string;
        registerCard?: number;
    }

    interface Buyer {
        id: string;
        name: string;
        surname: string;
        gsmNumber?: string;
        email: string;
        identityNumber: string;
        lastLoginDate?: string;
        registrationDate?: string;
        registrationAddress: string;
        ip: string;
        city: string;
        country: string;
        zipCode?: string;
    }

    interface Address {
        contactName: string;
        city: string;
        country: string;
        address: string;
        zipCode?: string;
    }

    interface BasketItem {
        id: string;
        name: string;
        category1: string;
        category2?: string;
        itemType: string;
        price: string;
    }

    interface PaymentRequest {
        locale?: string;
        conversationId?: string;
        price: string | number;
        paidPrice: string | number;
        currency?: string;
        installment?: number;
        basketId?: string;
        paymentChannel?: string;
        paymentGroup?: string;
        paymentCard?: PaymentCard;
        buyer: Buyer;
        shippingAddress: Address;
        billingAddress: Address;
        basketItems: BasketItem[];
        callbackUrl?: string;
        enabledInstallments?: number[];
    }

    interface CheckoutFormInitializeRequest {
        locale?: string;
        conversationId?: string;
        price: string | number;
        paidPrice: string | number;
        currency?: string;
        basketId?: string;
        paymentGroup?: string;
        buyer: Buyer;
        shippingAddress: Address;
        billingAddress: Address;
        basketItems: BasketItem[];
        callbackUrl: string;
        enabledInstallments?: number[];
    }

    class Iyzipay {
        constructor(options: Options);

        checkoutFormInitialize: {
            create(request: CheckoutFormInitializeRequest, callback: (err: any, result: any) => void): void;
            retrieve(request: { locale?: string; conversationId?: string; token: string }, callback: (err: any, result: any) => void): void;
        };

        payment: {
            create(request: PaymentRequest, callback: (err: any, result: any) => void): void;
        };

        LOCALE: {
            TR: string;
            EN: string;
        };

        PAYMENT_GROUP: {
            PRODUCT: string;
            LISTING: string;
            SUBSCRIPTION: string;
        };

        CURRENCY: {
            TRY: string;
            USD: string;
            EUR: string;
        };

        BASKET_ITEM_TYPE: {
            PHYSICAL: string;
            VIRTUAL: string;
        };
    }

    export = Iyzipay;
}
