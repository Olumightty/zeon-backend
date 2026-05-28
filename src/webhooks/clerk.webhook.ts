import { Router, type Request, type Response } from 'express';
import { Webhook } from 'svix';
import { buffer } from "micro";
import type { ClerkWebhookEvent } from '../types/api/webhook';
import { userCreated, userDeleted, userUpdated } from '../events/clerk.event';

const router = Router();

router.post('/webhook', async (req: Request, res: Response): Promise<any> => {
    const headers = req.headers;
    const SVIX_SECRET = process.env.SVIX_SECRET_KEY;

    if (!SVIX_SECRET) {
        console.error("Missing SVIX_SECRET_KEY");
        return res.status(500).json({ error: "Server misconfigured" });
    }

    let verifiedPayload: ClerkWebhookEvent;

    try {
        // 1. Read and verify the raw body stream BEFORE sending any response
        const rawBody = (await buffer(req)).toString();
        const wh = new Webhook(SVIX_SECRET);
        
        // This confirms the request actually came securely from Clerk
        verifiedPayload = wh.verify(rawBody, headers) as ClerkWebhookEvent;
    } catch (err) {
        console.error('Webhook verification failed:', err);
        // Explicit return stops execution instantly if forgery or error occurs
        return res.status(400).json({ message: "Verification failed" }); 
    }

    // 2. Verification succeeded! Send the 200 OK immediately so Clerk doesn't timeout
    res.status(200).json({ received: true });

    // 3. Process the events asynchronously in the background
    try {
        switch (verifiedPayload.type) {
            case 'user.created':
                const created = await userCreated(verifiedPayload);
                if (created) {
                    console.log("User successfully created in DB");
                } else {
                    console.error("Failed to create user in DB");
                }
                break;
            case 'user.updated':
                const updated = await userUpdated(verifiedPayload);
                if (updated) {
                    console.log("User successfully updated in DB");
                } else {
                    console.error("Failed to update user in DB");
                }
                break;
            case 'user.deleted':
                const deleted = await userDeleted(verifiedPayload);
                if (deleted) {
                    console.log("User successfully deleted from DB");
                } else {
                    console.error("Failed to delete user from DB");
                }
                break;
            default:
                console.log(`Unhandled event type: ${verifiedPayload.type}`);
                break;
        }
    } catch (error) {
        console.error("Background event processing failed:", error);
    }
});

export default router;