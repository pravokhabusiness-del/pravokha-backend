import { Request, Response } from 'express';
import { CouponService } from './service';
import { asyncHandler } from '../../utils/asyncHandler';

export class CouponController {
    static listCoupons = asyncHandler(async (req: Request, res: Response) => {
        const coupons = await CouponService.listCoupons();
        res.json(coupons);
    });

    static createCoupon = asyncHandler(async (req: Request, res: Response) => {
        const coupon = await CouponService.createCoupon(req.body);
        res.status(201).json(coupon);
    });

    static validateCoupon = asyncHandler(async (req: Request, res: Response) => {
        const { code, cartTotal } = req.body;
        if (!code) {
            return res.status(400).json({ success: false, message: 'Coupon code is required' });
        }
        try {
            const validated = await CouponService.validateCoupon(code, Number(cartTotal || 0));
            res.json({
                success: true,
                code: validated.code,
                type: validated.type === 'percent' ? 'percent' : 'flat',
                discount: validated.value
            });
        } catch (err: any) {
            res.status(400).json({ success: false, message: err.message });
        }
    });

    static deleteCoupon = asyncHandler(async (req: Request, res: Response) => {
        const { id } = req.params;
        await CouponService.deleteCoupon(id);
        res.json({ success: true, message: 'Coupon deleted successfully' });
    });
}
