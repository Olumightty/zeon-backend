import { Router, type Request, type Response } from 'express';
import { isFromKora } from '../api/guard/auth.guard';
import { chargeSuccess } from '../events/kora.event';
const router = Router();

router.post('/webhook', isFromKora, async (req: Request, res: Response) => {
    const { event, data } = req.body as KoraWebhookPayload;

    //add a mongo store to log the webhook events from kora for debugging, record keeping purposes and to handle retries in case of failures

    switch(event) {
        case 'charge.success':
            //the function handles the charge success event, the metadata carries the payment intentId, the paymentIntent (new status becomes paid) and cargoallocation (new status becomes pending_pooling) in the db will be updated in status, these updates are called from cargo.service.ts and payment.service.ts respectively
            await chargeSuccess(data);
            break
        case 'transfer.success':
           
            break
        case 'transfer.failed':
            
        default:
            break
    }
    return res.sendStatus(200);
});

export default router;