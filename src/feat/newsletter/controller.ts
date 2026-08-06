import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../../infra/database/client';
import { asyncHandler } from '../../utils/asyncHandler';

const newsletterSchema = z.object({
    email: z.string({ required_error: 'Email is required' }).email('Please provide a valid email address')
});

export const subscribeToNewsletter = asyncHandler(async (req: Request, res: Response) => {
    const parseResult = newsletterSchema.safeParse(req.body);
    if (!parseResult.success) {
        return res.status(400).json({
            success: false,
            message: parseResult.error.errors[0]?.message || 'Invalid email address format'
        });
    }

    const email = parseResult.data.email.toLowerCase().trim();

    try {
        await prisma.newsletterSubscription.create({
            data: { email }
        });

        // Notify Admins
        try {
            const { NotificationService } = await import('../notification/service');
            const admins = await prisma.user.findMany({
                where: { role: 'ADMIN' },
                select: { id: true }
            });

            for (const admin of admins) {
                await NotificationService.notifyAdminNewsletterSubscription(admin.id, email);
            }
        } catch (err) {
            console.error('Failed to notify admins of newsletter subscription:', err);
        }

        res.status(201).json({ success: true, message: 'Subscribed successfully' });
    } catch (error: any) {
        if (error.code === 'P2002') {
            return res.status(200).json({ success: true, message: 'Already subscribed' });
        }
        throw error;
    }
});
