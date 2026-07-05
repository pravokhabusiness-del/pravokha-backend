import { Router } from 'express';
import { prisma } from '../../infra/database/client';
import { authenticate, authorize, checkAccountStatus } from '../../shared/middleware/auth';
import { Role } from '../../shared/domain/types';

const router = Router();

// GET /banners - Public list of active banners (or all banners for admins)
router.get('/', async (req, res) => {
    try {
        const { active } = req.query;
        const where: any = {};
        
        if (active === 'true') {
            where.active = true;
        }

        const banners = await prisma.banner.findMany({
            where,
            orderBy: {
                sortOrder: 'asc'
            }
        });

        res.json({
            success: true,
            banners
        });
    } catch (error: any) {
        console.error('[BannerRoute] GET Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch banners', error: error.message });
    }
});

// POST /banners - Create a banner (Admin/Super Admin only)
router.post('/', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), checkAccountStatus, async (req, res) => {
    try {
        const { title, subtitle, imageUrl, buttonText, buttonLink, active, sortOrder } = req.body;
        
        if (!title || !imageUrl) {
            return res.status(400).json({ success: false, message: 'Title and image URL are required' });
        }

        const banner = await prisma.banner.create({
            data: {
                title,
                subtitle,
                imageUrl,
                buttonText: buttonText || 'Shop Now',
                buttonLink: buttonLink || '/products',
                active: active !== undefined ? active : true,
                sortOrder: sortOrder !== undefined ? parseInt(sortOrder.toString()) : 0
            }
        });

        res.status(201).json({
            success: true,
            message: 'Banner created successfully',
            banner
        });
    } catch (error: any) {
        console.error('[BannerRoute] POST Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create banner', error: error.message });
    }
});

// PUT /banners/:id - Update a banner (Admin/Super Admin only)
router.put('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), checkAccountStatus, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, subtitle, imageUrl, buttonText, buttonLink, active, sortOrder } = req.body;

        const existing = await prisma.banner.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        const banner = await prisma.banner.update({
            where: { id },
            data: {
                title: title !== undefined ? title : existing.title,
                subtitle: subtitle !== undefined ? subtitle : existing.subtitle,
                imageUrl: imageUrl !== undefined ? imageUrl : existing.imageUrl,
                buttonText: buttonText !== undefined ? buttonText : existing.buttonText,
                buttonLink: buttonLink !== undefined ? buttonLink : existing.buttonLink,
                active: active !== undefined ? active : existing.active,
                sortOrder: sortOrder !== undefined ? parseInt(sortOrder.toString()) : existing.sortOrder
            }
        });

        res.json({
            success: true,
            message: 'Banner updated successfully',
            banner
        });
    } catch (error: any) {
        console.error('[BannerRoute] PUT Error:', error);
        res.status(500).json({ success: false, message: 'Failed to update banner', error: error.message });
    }
});

// DELETE /banners/:id - Delete a banner (Admin/Super Admin only)
router.delete('/:id', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), checkAccountStatus, async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.banner.findUnique({ where: { id } });
        if (!existing) {
            return res.status(404).json({ success: false, message: 'Banner not found' });
        }

        await prisma.banner.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Banner deleted successfully'
        });
    } catch (error: any) {
        console.error('[BannerRoute] DELETE Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete banner', error: error.message });
    }
});

export default router;
