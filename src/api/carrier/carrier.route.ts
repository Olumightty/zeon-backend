import { Router } from 'express';
const router = Router();

router.post('map');
router.get('vessels');
router.get('vessels/:id');
router.get('ports')

export default router;