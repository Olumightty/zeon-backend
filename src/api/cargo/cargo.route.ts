import { Router } from 'express';
import {cancelCargoAllocation, checkoutCargoAllocation, confirmCargoAllocation, createCargoAllocation, getCargoAllocationById, getCargoAllocations, updateCargoAllocation} from './cargo.controller';
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

// checkout a cargo allocation that is in draft status, this is the step where a cost breakdown is generated (by function already implemented in payment.service file)
router.post('/allocation/checkout', checkoutCargoAllocationValidator, checkoutCargoAllocation);

// because we want to make room for negotiation of price between the user and the supplier, this is the step where the cargo allocation is confirmed such that before confirmation, the price can be negotiated between the user and the supplier (trade partner of that store) and they can edit the cost breakdown (only values within the suppliers control, this will be a separate endpoint to be implemented later), but once confirmed, the price is fixed and the payment intent will now be created (by a function already implemented in payment.service file) and the cargo allocations will become awaiting_payment status
router.post('/allocation/:id/confirm', cargoAllocationIdValidator, confirmCargoAllocation);

// get a specific cargo allocation by ID
router.get('/allocation/:id', cargoAllocationIdValidator, getCargoAllocationById);

// update a specific cargo allocation by ID, only up to the point that the cargo pool is in draft
router.patch('/allocation/:id', updateCargoAllocationValidator, updateCargoAllocation);

// cancel a specific cargo allocation by ID, only up to the point that the cargo pool it is in has not been confirmed to shipment (i.e closed), user will be refunded if already paid.
router.post('/allocation/:id/cancel', cargoAllocationIdValidator, cancelCargoAllocation);

export default router;
