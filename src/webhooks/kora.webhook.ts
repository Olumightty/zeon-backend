import { Router, type Request, type Response } from 'express';
import { isFromKora } from '../api/guard/auth.guard';
const router = Router();

router.post('/webhook', isFromKora, (req: Request, res: Response) => {
    const { event, data } = req.body as KoraWebhookPayload;

    //add a mongo store to log the webhook events from kora for debugging, record keeping purposes and to handle retries in case of failures

    switch(event) {
        case 'charge.success':
            
        case 'transfer.success':
           
            break
        case 'transfer.failed':
            
        default:
            break
    }
    return res.sendStatus(200);
});

export default router;