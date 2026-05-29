import axios from "axios";
import { customAlphabet } from "nanoid";

type CreatePayInProp = {
    amount: number;
    description: string;
    payerName: string;
    payerEmail: string;
};

type CreatePayInResponse = {
    status: boolean;
    message: string;
    data: {
        reference: string;
        checkout_url: string;
    };
};

type VerifyPayInProp = {
    reference: string;
};

type VerifyPayInResponse = {
    status: boolean;
    message: string;
    data: {
        reference: string;
        status: string;
        amount: string | number;
        amount_paid: string | number;
        fee: string | number;
        currency: string;
        description: string;
        payer_bank_account: {
            account_number: string;
            account_name: string;
            bank_name: string;
        };
    };
};

const getErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
        return error.response?.data || error.message;
    }

    if (error instanceof Error) {
        return error.message;
    }

    return error;
};

const possibleCharacters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const  genReference = customAlphabet(possibleCharacters, 23);
const koraApi = axios.create({
    baseURL: process.env.KORA_API_URL!,
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.KORA_SECRET_KEY}`,
        "Accept": "application/json",
    }
});

export const createPayIn = async (payload: CreatePayInProp) => {
    try {
        const request = await koraApi.post('/charges/initialize', {
            amount: payload.amount,
            redirect_url: process.env.KORA_REDIRECT_URL,
            currency: "NGN",
            reference: `z-${genReference()}`,
            narration: payload.description,
            merchant_bears_cost: false,
            customer: {
                name: payload.payerName,
                email: payload.payerEmail
            },
            notification_url: process.env.KORA_WEBHOOK_URL
        });
        const response = request.data as CreatePayInResponse;
        if(response.status || request.status === 200){
            return {
                status: response.status,
                message: response.message,
                data: {
                    reference: response.data.reference,
                    checkout_url: response.data.checkout_url
                }
            };
        }
        throw new Error(`Failed to create payin: ${response.message}`);
    } catch (error) {
        console.error("Kora error creating payin:", getErrorMessage(error));
        return null
    }
}

export const verifyPayIn = async (payload: VerifyPayInProp) => {
    try {
        const request = await koraApi.get(`/charges/${payload.reference}`);
        const response = request.data as VerifyPayInResponse;
        if(response.status || request.status === 200){
            return {
                status: response.status,
                message: response.message,
                data: {
                    reference: response.data.reference,
                    status: response.data.status == 'success' ? 'SUCCESS' : 'FAILED' as 'SUCCESS' | 'FAILED',
                    amount: Number(response.data.amount),
                    amountPaid: Number(response.data.amount_paid),
                    fee: Number(response.data.fee),
                    currency: response.data.currency,
                    description: response.data.description,
                    payerBankAccount: {
                        accountNumber: response.data.payer_bank_account.account_number,
                        accountName: response.data.payer_bank_account.account_name,
                        bankName: response.data.payer_bank_account.bank_name
                    }
                }
            };
        }
        throw new Error(`Failed to verify payin: ${response.message}`);
    } catch (error) {
        console.error("Kora error verifying payin:", getErrorMessage(error));
        return null
    }
}
