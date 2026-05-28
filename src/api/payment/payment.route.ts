import { Router } from 'express';
import {cancelPaymentIntentById, createPaymentIntent, getEscrowDetailsByIntentId, getPaymentIntentById} from './payment.controller';
const router = Router();

// create a new payment intent for a specific cargo allocation, this happens when they choose to pay for the cargo allocation affter confirming (only the owner and admins (user) of the cargo allocation can create a payment intent for it)
router.post('/intents', createPaymentIntent);

// get a specific payment intent by id (only the owner and admins (user) of the cargo allocation can get the payment intent for it)
router.get('/intents/:id', getPaymentIntentById);

// cancel a specific payment intent by id (only the owner and admins (user) of the cargo allocation can cancel the payment intent for it)
router.post('/intents/:id/cancel', cancelPaymentIntentById);

// get the escrow details for a specific payment intent which was created when kora payment webhook was verified
router.get('/escrow/:intentId', getEscrowDetailsByIntentId);

export default router;