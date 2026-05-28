import { Router } from 'express';
import {cancelCargoAllocation, confirmCargoAllocation, createCargoAllocation, getCargoAllocationById, getCargoAllocations, updateCargoAllocation} from './cargo.controller';
const router = Router();
//business facing API

// create cargo allocation (All created will be a draft)
router.post('/allocation', createCargoAllocation);

// get all cargo allocations (user/organization scoped)
router.get('/allocation', getCargoAllocations);

// get a specific cargo allocation by ID
router.get('/allocation/:id', getCargoAllocationById);

// update a specific cargo allocation by ID
router.patch('/allocation/:id', updateCargoAllocation);

// confirm a specific cargo allocation by ID (sets status to pending_pooling, cannot be edited after this), this is the step where the cargo allocation is sent to carriers/admin for bidding to be polled and then associated with a cargo pool
router.post('/allocation/:id/confirm', confirmCargoAllocation);

// cancel a specific cargo allocation by ID, only if the pool it is in has not been confirmed to shipment (soft delete)
router.post('/allocation/:id/cancel', cancelCargoAllocation);

export default router;