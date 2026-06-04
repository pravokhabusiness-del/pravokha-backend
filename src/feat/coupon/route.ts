import { Router } from 'express';
import { CouponController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '../../shared/domain/types';

const router = Router();

// Public validation endpoint (anyone can check if coupon is valid)
router.post('/validate', CouponController.validateCoupon);

// Admin / Seller endpoints
router.get('/', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER]), CouponController.listCoupons);
router.post('/', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER]), CouponController.createCoupon);
router.delete('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN, Role.SELLER]), CouponController.deleteCoupon);

export default router;
