import { Router } from 'express';
import {cancelPaymentIntentById, getEscrowDetailsByIntentId, getPaymentIntentById, updateCostBreakdown} from './payment.controller';
import { escrowIntentIdValidator, paymentIntentIdValidator, updateCostBreakdownValidator } from './payment.validator';
const router = Router();

// business facing API

// when a negotiation happens and a new cost for the cargo allocation is agreed upon, the owner or admin or finance of the store can edit the cost breakdown
router.patch('/breakdown', updateCostBreakdownValidator, updateCostBreakdown)

// get a specific payment intent by id (only the owner and admins (user) of the cargo allocation can get the payment intent for it)
router.get('/intents/:id', paymentIntentIdValidator, getPaymentIntentById);

// cancel a specific payment intent by id (only the owner and admins (user) of the cargo allocation can cancel the payment intent for it), this will restore the cargo allocation to draft status and the user can choose to checkout again which will create a new payment intent
router.post('/intents/:id/cancel', paymentIntentIdValidator, cancelPaymentIntentById);

// get the escrow details for a specific payment intent which was created when kora payment webhook verified the payment, this is for the user to be able to see the details of the escrow that was created for the payment intent, only the owner and admins (user) of the cargo allocation can get the escrow details for it
router.get('/escrow/:intentId', escrowIntentIdValidator, getEscrowDetailsByIntentId);

export default router;
