import type { Request, Response } from "express"
import {
    cancelPaymentIntentService,
    findEscrowByPaymentIntentId,
    findPaymentIntentById,
} from "./payment.service";

const jsonSafe = (data: unknown) => {
    return JSON.parse(
        JSON.stringify(data, (_key, value) => (typeof value === "bigint" ? value.toString() : value)),
    );
};

const getAuthUser = (req: Request) => {
    const userId = req.user?.userId;
    if (!userId) {
        return null;
    }

    const orgId = req.user?.orgId;

    return {
        userId,
        orgId,
    };
};

const getParam = (req: Request, key: string) => {
    const value = req.params[key];
    return Array.isArray(value) ? value[0] || "" : value || "";
};

export const getPaymentIntentById = async (req: Request, res: Response) => {
    try {
        const auth = getAuthUser(req);
        if (!auth) {
            return res.status(401).json({ message: "Unauthorized", status: false });
        }

        const paymentIntent = await findPaymentIntentById(getParam(req, "id"), auth);
        if (!paymentIntent) {
            return res.status(404).json({ message: "Payment intent not found", status: false });
        }

        return res.status(200).json({
            message: "Payment intent fetched successfully",
            status: true,
            data: jsonSafe(paymentIntent),
        });
    } catch (error) {
        console.error("Get payment intent error:", error);
        return res.status(500).json({ message: "Unable to process request", status: false });
    }
}


export const cancelPaymentIntentById = async (req: Request, res: Response) => {
    try {
        const auth = getAuthUser(req);
        if (!auth) {
            return res.status(401).json({ message: "Unauthorized", status: false });
        }

        const result = await cancelPaymentIntentService(getParam(req, "id"), auth);
        if (!result) {
            return res.status(404).json({ message: "Payment intent not found", status: false });
        }

        if (result === "INVALID_STATUS") {
            return res.status(400).json({ message: "Only pending payment intents can be cancelled", status: false });
        }

        if (result === "POOL_CLOSED") {
            return res.status(400).json({ message: "Payment intent can no longer be cancelled", status: false });
        }

        return res.status(200).json({
            message: "Payment intent cancelled successfully",
            status: true,
            data: jsonSafe(result),
        });
    } catch (error) {
        console.error("Cancel payment intent error:", error);
        return res.status(500).json({ message: "Unable to process request", status: false });
    }
}


export const getEscrowDetailsByIntentId = async (req: Request, res: Response) => {
    try {
        const auth = getAuthUser(req);
        if (!auth) {
            return res.status(401).json({ message: "Unauthorized", status: false });
        }

        const escrow = await findEscrowByPaymentIntentId(getParam(req, "intentId"), auth);
        if (!escrow) {
            return res.status(404).json({ message: "Escrow details not found", status: false });
        }

        return res.status(200).json({
            message: "Escrow details fetched successfully",
            status: true,
            data: jsonSafe(escrow),
        });
    } catch (error) {
        console.error("Get escrow details error:", error);
        return res.status(500).json({ message: "Unable to process request", status: false });
    }
}
