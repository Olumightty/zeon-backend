import { Router } from 'express';
const router = Router();

router.get('');
router.get(':id');
router.post(':id/manifest');
router.get(':id/manifest');
router.get(':id/download');

export default router;