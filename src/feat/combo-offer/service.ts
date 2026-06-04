import { prisma } from '../../infra/database/client';
import { marketplaceEmitter, MARKETPLACE_EVENTS } from '../../shared/util/events';

export class ComboOfferService {
    static async createOffer(data: any) {
        const offer = await prisma.comboOffer.create({
            data: {
                title: data.title,
                description: data.description,
                // Handle both frontend (camelCase) and raw API (snake_case)
                productIds: JSON.stringify(data.productIds || data.product_ids || []),
                originalPrice: data.originalPrice ?? data.original_price,
                comboPrice: data.comboPrice ?? data.combo_price,
                discountPercentage: data.discountPercentage ?? data.discount_percentage,
                active: data.active ?? true,
                imageUrl: data.imageUrl || data.image_url,
                startDate: (data.startDate || data.start_date) ? new Date(data.startDate || data.start_date) : null,
                endDate: (data.endDate || data.end_date) ? new Date(data.endDate || data.end_date) : null
            }
        });

        // Trigger Audit Log
        marketplaceEmitter.emit(MARKETPLACE_EVENTS.ADMIN_ACTION_PERFORMED, {
            adminId: data.adminId, // Expecting admin info in request
            role: data.adminRole,
            action: 'CREATE_COMBO_OFFER',
            entity: 'ComboOffer',
            entityId: offer.id,
            changes: data,
            ip: data.ip
        });

        return offer;
    }

    static async getOffers(activeOnly: boolean = false) {
        const where: any = {};
        if (activeOnly) {
            where.active = true;
        }

        const offers = await prisma.comboOffer.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        // Enrich each offer with product details (title, slug, first image)
        const enrichedOffers = await Promise.all(offers.map(async (offer) => {
            let products: any[] = [];
            if (offer.productIds) {
                try {
                    const ids = typeof offer.productIds === 'string'
                        ? JSON.parse(offer.productIds)
                        : offer.productIds;

                    if (Array.isArray(ids) && ids.length > 0) {
                        const dbProducts = await prisma.product.findMany({
                            where: { id: { in: ids } },
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                stock: true,
                                status: true,
                                isBlocked: true,
                                deletedAt: true,
                                variants: {
                                    take: 1,
                                    select: { images: true }
                                },
                                images: {
                                    take: 1,
                                    orderBy: { order: 'asc' },
                                    select: { url: true }
                                }
                            }
                        });

                        // Preserve order of productIds
                        products = ids.map((id: string) => {
                            const p = dbProducts.find((p: any) => p.id === id);
                            if (!p) return null;
                            
                            // Check if product is unavailable/inactive/blocked/deleted
                            if (p.deletedAt !== null || p.isBlocked || p.status !== 'ACTIVE') {
                                return null;
                            }

                            // Try variant images first, then product images
                            let imageUrl: string | null = null;
                            if (p.variants?.[0]?.images) {
                                try {
                                    const parsed = typeof p.variants[0].images === 'string'
                                        ? JSON.parse(p.variants[0].images)
                                        : p.variants[0].images;
                                    imageUrl = Array.isArray(parsed) ? parsed[0] : parsed;
                                } catch { }
                            }
                            if (!imageUrl && p.images?.[0]?.url) {
                                imageUrl = p.images[0].url;
                            }
                            return { id: p.id, title: p.title, slug: p.slug, imageUrl, stock: p.stock };
                        }).filter(Boolean);
                    }
                } catch (e) {
                    // malformed productIds — return empty products
                }
            }
            return { ...offer, products };
        }));

        if (activeOnly) {
            // For activeOnly, if one item in the combo is out of stock (stock <= 0)
            // or if the parsed products list is shorter than the combo's productIds,
            // it means some products are missing/inactive/out of stock. So we hide the combo offer!
            return enrichedOffers.filter(offer => {
                let offerProductIds: string[] = [];
                try {
                    offerProductIds = typeof offer.productIds === 'string' ? JSON.parse(offer.productIds) : offer.productIds;
                } catch (e) {}

                if (offer.products.length < offerProductIds.length) {
                    return false;
                }
                const anyOutOfStock = offer.products.some((p: any) => p.stock <= 0);
                if (anyOutOfStock) {
                    return false;
                }
                return true;
            });
        }

        return enrichedOffers;
    }

    static async getOfferById(id: string) {
        return await prisma.comboOffer.findUnique({
            where: { id }
        });
    }

    static async getOffersForProduct(productId: string) {
        const allOffers = await prisma.comboOffer.findMany({
            where: { active: true }
        });

        const relevantOffers = allOffers.filter(offer => {
            try {
                const ids = typeof offer.productIds === 'string' ? JSON.parse(offer.productIds) : offer.productIds;
                return Array.isArray(ids) && ids.includes(productId);
            } catch (e) {
                return false;
            }
        });

        // Enrich with product details
        const enrichedOffers = await Promise.all(relevantOffers.map(async (offer) => {
            const ids = typeof offer.productIds === 'string' ? JSON.parse(offer.productIds) : offer.productIds;
            const products = await prisma.product.findMany({
                where: { id: { in: ids } },
                include: {
                    variants: {
                        take: 1,
                        include: { sizes: true }
                    }
                }
            });
            return { ...offer, products };
        }));

        // Filter out offers where any product is out of stock or unavailable
        return enrichedOffers.filter(offer => {
            let offerProductIds: string[] = [];
            try {
                offerProductIds = typeof offer.productIds === 'string' ? JSON.parse(offer.productIds) : offer.productIds;
            } catch (e) {}

            const activeProducts = offer.products.filter((p: any) => p.deletedAt === null && !p.isBlocked && p.status === 'ACTIVE' && p.stock > 0);
            return activeProducts.length === offerProductIds.length;
        });
    }

    static async updateOffer(id: string, data: any) {
        const updateData: any = { ...data };

        // Standardize input fields (support both camelCase and snake_case)
        if (data.productIds || data.product_ids) updateData.productIds = JSON.stringify(data.productIds || data.product_ids);
        if (data.originalPrice || data.original_price) updateData.originalPrice = data.originalPrice ?? data.original_price;
        if (data.comboPrice || data.combo_price) updateData.comboPrice = data.comboPrice ?? data.combo_price;
        if (data.discountPercentage || data.discount_percentage) updateData.discountPercentage = data.discountPercentage ?? data.discount_percentage;
        if (data.imageUrl || data.image_url) updateData.imageUrl = data.imageUrl || data.image_url;
        if (data.startDate || data.start_date) updateData.startDate = new Date(data.startDate || data.start_date);
        if (data.endDate || data.end_date) updateData.endDate = new Date(data.endDate || data.end_date);

        // Remove redundant snake_case keys to keep Prisma clean
        ['product_ids', 'original_price', 'combo_price', 'discount_percentage', 'image_url', 'start_date', 'end_date'].forEach(k => delete updateData[k]);

        const offer = await prisma.comboOffer.update({
            where: { id },
            data: updateData
        });

        // Trigger Audit Log
        marketplaceEmitter.emit(MARKETPLACE_EVENTS.ADMIN_ACTION_PERFORMED, {
            adminId: data.adminId,
            role: data.adminRole,
            action: 'UPDATE_COMBO_OFFER',
            entity: 'ComboOffer',
            entityId: id,
            changes: data,
            ip: data.ip
        });

        return offer;
    }

    static async toggleStatus(id: string, active: boolean) {
        return await prisma.comboOffer.update({
            where: { id },
            data: { active }
        });
    }

    static async deleteOffer(id: string) {
        return await prisma.comboOffer.delete({
            where: { id }
        });
    }

    static async calculateComboDiscount(items: any[]) {
        const activeOffers = await prisma.comboOffer.findMany({
            where: { active: true }
        });

        let totalDiscount = 0;
        const appliedOffers: any[] = [];

        // Map of product ID to quantity available in cart
        const itemQuantities = new Map<string, number>();
        items.forEach(i => {
            itemQuantities.set(i.productId, (itemQuantities.get(i.productId) || 0) + i.quantity);
        });

        for (const offer of activeOffers) {
            if (!offer.productIds) continue;

            let offerProductIds: string[];
            try {
                offerProductIds = typeof offer.productIds === 'string' ? JSON.parse(offer.productIds) : offer.productIds;
            } catch (e) {
                offerProductIds = [];
            }

            if (offerProductIds.length === 0) continue;

            // Find how many sets of this combo can be formed with the cart quantities.
            let maxComboSets = Infinity;
            for (const id of offerProductIds) {
                const availableQty = itemQuantities.get(id) || 0;
                if (availableQty === 0) {
                    maxComboSets = 0;
                    break;
                }
                maxComboSets = Math.min(maxComboSets, availableQty);
            }

            if (maxComboSets > 0 && maxComboSets !== Infinity) {
                // Fetch the actual prices of these products to compute the discount
                const products = await prisma.product.findMany({
                    where: { id: { in: offerProductIds } }
                });

                const originalTotal = products.reduce((sum, p) => sum + p.price, 0);
                const singleSetDiscount = originalTotal - offer.comboPrice;

                if (singleSetDiscount > 0) {
                    const discount = singleSetDiscount * maxComboSets;
                    totalDiscount += discount;
                    appliedOffers.push({
                        id: offer.id,
                        title: offer.title,
                        discount,
                        sets: maxComboSets
                    });

                    // Consume the quantities used for this combo
                    offerProductIds.forEach(id => {
                        const current = itemQuantities.get(id) || 0;
                        itemQuantities.set(id, current - maxComboSets);
                    });
                }
            }
        }

        return { totalDiscount, appliedOffers };
    }
}
