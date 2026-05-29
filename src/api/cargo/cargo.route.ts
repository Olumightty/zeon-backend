import { Router } from 'express';
import {cancelCargoAllocation, checkoutCargoAllocation, createCargoAllocation, getCargoAllocationById, getCargoAllocations, updateCargoAllocation} from './cargo.controller';
import {
    cargoAllocationIdValidator,
    checkoutCargoAllocationValidator,
    createCargoAllocationValidator,
    getCargoAllocationsValidator,
    updateCargoAllocationValidator,
} from './cargo.validator';
const router = Router();
// business facing API

// when a user clicks save on a stores cargo(cart), this will create cargo allocation (All created will be a draft) as well as the items in it, it would not have a cargo pool associated with it until payment is confirmed, and the pooling will be handled elswhere
router.post('/allocation', createCargoAllocationValidator, createCargoAllocation);

// get all cargo allocations (user/organization scoped), be able to query them based on status (draft, awaiting_payment, pending_pooling, pooled, in_transit, delivered, cancelled)
router.get('/allocation', getCargoAllocationsValidator, getCargoAllocations);

// checkout a cargo allocation that is in draft status, this is the step where a cost breakdown and payment intent is generated (by functions to be implemented in payment.service file), and the cargo allocations will become awaiting_payment status
router.post('/allocation/checkout', checkoutCargoAllocationValidator, checkoutCargoAllocation);

// get a specific cargo allocation by ID
router.get('/allocation/:id', cargoAllocationIdValidator, getCargoAllocationById);

// update a specific cargo allocation by ID, only up to the point that the cargo pool is in draft
router.patch('/allocation/:id', updateCargoAllocationValidator, updateCargoAllocation);

// cancel a specific cargo allocation by ID, only up to the point that the cargo pool it is in has not been confirmed to shipment (i.e closed), user will be refunded if already paid.
router.post('/allocation/:id/cancel', cargoAllocationIdValidator, cancelCargoAllocation);

export default router;
