import { prisma } from '../../infra/database/client';

export class CouponService {
    static async validateCoupon(code: string, cartTotal: number) {
        const coupon = await prisma.coupon.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!coupon) {
            throw new Error('Invalid coupon code');
        }

        if (coupon.status !== 'active') {
            throw new Error('This coupon is no longer active');
        }

        const now = new Date();
        if (coupon.endDate && new Date(coupon.endDate) < now) {
            // Auto update status to expired
            await prisma.coupon.update({
                where: { id: coupon.id },
                data: { status: 'expired' }
            });
            throw new Error('This coupon has expired');
        }

        if (coupon.usedCount >= coupon.maxUses) {
            throw new Error('This coupon has reached its maximum usage limit');
        }

        if (cartTotal < coupon.minOrder) {
            throw new Error(`Minimum order amount of ₹${coupon.minOrder} is required for this coupon`);
        }

        return {
            id: coupon.id,
            code: coupon.code,
            type: coupon.type,
            value: coupon.value
        };
    }

    static async createCoupon(data: any) {
        const { code, type, value, min_order, max_uses, start_date, end_date } = data;
        
        // Default end date is 30 days from now if not provided
        const endDate = end_date ? new Date(end_date) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const startDate = start_date ? new Date(start_date) : new Date();

        return await prisma.coupon.create({
            data: {
                code: code.trim().toUpperCase(),
                type: type === 'percentage' ? 'percent' : 'flat',
                value: Number(value),
                minOrder: Number(min_order || 0),
                maxUses: Number(max_uses || 100),
                startDate,
                endDate,
                status: 'active'
            }
        });
    }

    static async listCoupons() {
        return await prisma.coupon.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    static async deleteCoupon(id: string) {
        return await prisma.coupon.delete({
            where: { id }
        });
    }

    static async incrementUsedCount(id: string, tx?: any) {
        const client = tx || prisma;
        const coupon = await client.coupon.findUnique({ where: { id } });
        if (!coupon) return;

        const newUsedCount = coupon.usedCount + 1;
        const status = newUsedCount >= coupon.maxUses ? 'expired' : coupon.status;

        await client.coupon.update({
            where: { id },
            data: {
                usedCount: newUsedCount,
                status
            }
        });
    }
}
