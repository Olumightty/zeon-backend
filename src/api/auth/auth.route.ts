import { Router } from 'express';
const router = Router();

router.post('register');
router.post('login');
router.post('logout');
router.post('refresh');
router.post('password-reset/request');
router.post('password-reset/confirm');

export default router;