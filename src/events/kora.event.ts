import { markCargoAllocationPendingPoolingService } from "../api/cargo/cargo.service";
import { verifyPayIn } from "../api/payment/payment.provider";
import { findPaymentIntentByProviderReference, markPaymentIntentPaidService } from "../api/payment/payment.service";
import type { KoraPayinWebhookData } from "../types/api/webhook";

export const chargeSuccess = async (data: KoraPayinWebhookData) => {
    try {
        const verify = await verifyPayIn({ reference: data.reference });
        if (!verify) {
            console.warn("verify payin returned null/undefined", { ref: data.reference });
            throw new Error("verify payin returned null/undefined");
        }
        if(verify.data.status !== "SUCCESS"){
            console.warn("payin not approved", { 
                ref: verify.data.reference, 
                status: verify.data.status,
            });
            throw new Error("payin not approved");
        }

        const paymentIntent = await findPaymentIntentByProviderReference(data.reference);
        if (!paymentIntent) {
            console.warn("No payment intent found for reference", { ref: data.reference });
            throw new Error("No payment intent found for reference");
        }

        await markPaymentIntentPaidService(paymentIntent.id, {
            heldAmountMinor: BigInt(data.amount * 100), // Convert to minor units
            releaseCondition: "After delivery confirmation",
        });
        await markCargoAllocationPendingPoolingService(paymentIntent.cargoAllocationId);

        return
    } catch (error) {
        console.error("Error in chargeSuccess handler:", error);
        throw error;
    }
}