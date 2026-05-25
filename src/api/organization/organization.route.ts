import { Router } from 'express';
const router = Router();

router.get('');
router.patch('');
router.get('settings/notifications');
router.patch('settings/notifications');
router.get('settings/webhooks');
router.post('settings/webhooks');
router.patch('settings/webhooks/:id');
router.delete('settings/webhooks/:id');

export default router;