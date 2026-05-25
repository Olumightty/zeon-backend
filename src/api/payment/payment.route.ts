import { Router } from 'express';
const router = Router();

router.post('intents');
router.get('intents/:id');
router.post('intents/:id/cancel');
router.get('escrow/:cargoAllocationId');

export default router;