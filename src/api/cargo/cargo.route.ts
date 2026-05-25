import { Router } from 'express';
const router = Router();

router.post('allocation');
router.get('allocation');
router.get('allocation/:id');
router.patch('allocation/:id');
router.post('allocation/:id/confirm');
router.post('allocation/:id/cancel');

export default router;