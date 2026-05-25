import { Router } from 'express';
const router = Router();

router.post('conversations');
router.get('conversations/:id');
router.get('conversations/:id/messages');
router.post('conversations/:id/messages');
router.get('conversations/:id/close');

export default router;