import { Router } from 'express';
const router = Router();

router.get('stores');
router.get('stores/:id');
router.get('products');
router.get('trade-partners'); //everyone can see the list of trade partners for each store
router.get('trade-partners/:id');

export default router;