// @ts-ignore - Prisma client is generated but IDE cache may be lagging
import { PrismaClient, ShippingZone } from '@prisma/client';
import { prisma as defaultPrisma } from '../infra/database/client';
import { SHIPPING_STATE_TIERS, DEFAULT_SHIPPING_FEE, getStateFromPincode } from '../config/shippingRules';

export interface ShippingCalculationResult {
    totalShippingFee: number;
    isFreeShipping: boolean;
    breakdown: {
        vendorId: string;
        vendorName: string;
        chargeableWeight: number;
        baseFee: number;
        slabFee: number;
        codFee: number;
        remoteSurcharge: number;
        expressFee: number;
        handlingFee?: number;
        fuelSurcharge?: number;
        tax?: number;
        total: number;
        minDays: number;
        maxDays: number;
        zone: string;
    }[];
}

export class ShippingService {
    /**
     * Calculates the total shipping fee for an order, separated by vendor.
     */
    static async calculateShipping(
        items: { productId: string; quantity: number; sellerId: string }[],
        destinationPincode: string,
        state?: string | boolean, // Support both string and legacy boolean if passed incorrectly
        isCod: boolean = false,
        isExpress: boolean = false,
        tx?: any // Optional transaction client
    ): Promise<ShippingCalculationResult> {
        const db = tx || defaultPrisma;

        // Resolve buyer state
        let resolvedState: string | null = null;
        let actualIsCod = isCod;
        let actualIsExpress = isExpress;

        // Handle case where callers pass arguments in legacy order: (items, pincode, isCod, isExpress)
        if (typeof state === 'boolean') {
            actualIsCod = state;
            actualIsExpress = !!isCod; // the 4th parameter
            resolvedState = getStateFromPincode(destinationPincode);
        } else if (typeof state === 'string' && state) {
            resolvedState = state.trim().toUpperCase();
        } else {
            resolvedState = getStateFromPincode(destinationPincode);
        }

        const tierPrice = resolvedState ? (SHIPPING_STATE_TIERS[resolvedState] ?? DEFAULT_SHIPPING_FEE) : DEFAULT_SHIPPING_FEE;

        // Fetch all products to get weights, dimensions and vendor warehouse address details
        const productIds = items.map(i => i.productId);
        const products = await db.product.findMany({
            where: { id: { in: productIds } },
            select: {
                id: true,
                weight: true,
                length: true,
                width: true,
                height: true,
                vendorId: true,
                vendor: {
                    select: {
                        storeName: true,
                        warehouseCity: true,
                        warehouseState: true,
                        pickupPincode: true
                    }
                }
            }
        });

        // Group items by Vendor
        const vendorItems: Record<string, typeof items> = {};
        items.forEach(item => {
            if (!vendorItems[item.sellerId]) vendorItems[item.sellerId] = [];
            vendorItems[item.sellerId].push(item);
        });

        const breakdown: ShippingCalculationResult['breakdown'] = [];
        let totalShippingFee = 0;

        // Calculate per Vendor dynamically based on weight tiers (250g/500g, Base ₹99, 50g buffer)
        for (const [vendorId, itemsList] of Object.entries(vendorItems)) {
            let totalActualWeight = 0;
            let totalVolumetricWeight = 0;

            itemsList.forEach((item: { productId: string; quantity: number; sellerId: string }) => {
                const product = products.find((p: any) => p.id === item.productId);
                if (product) {
                    // Base product weight (default 200g / 0.2kg) plus 50g (0.05kg) buffer per item
                    const itemWeight = (product.weight || 0.20) + 0.05;
                    totalActualWeight += itemWeight * item.quantity;
                    const volWeight = ((product.length || 20) * (product.width || 15) * (product.height || 5)) / 5000;
                    totalVolumetricWeight += volWeight * item.quantity;
                } else {
                    totalActualWeight += 0.25 * item.quantity; // Default 250g
                }
            });

            const chargeableWeight = Math.max(totalActualWeight, totalVolumetricWeight);

            const firstProduct = products.find((p: any) => p.vendorId === vendorId);
            const vendorName = firstProduct?.vendor?.storeName || "Vendor";

            const sellerState = firstProduct?.vendor?.warehouseState ? firstProduct.vendor.warehouseState.trim().toUpperCase() : "TAMIL NADU";
            const sellerPincode = firstProduct?.vendor?.pickupPincode ? firstProduct.vendor.pickupPincode.trim() : "";

            const buyerState = resolvedState ? resolvedState.trim().toUpperCase() : "";

            // Weight-based shipping tiers:
            // Base Charge: derived from state tier price (e.g., ₹60 for Tier 2, ₹40 for Tier 1, ₹80 for Tier 3)
            // Tier 2 (up to 500g / 0.50 kg): +₹50 slab fee
            // Tier 3 (> 500g): +₹49 for each additional 250g slab
            const baseFee = tierPrice;
            let slabFee = 0;

            if (chargeableWeight > 0.25 && chargeableWeight <= 0.50) {
                slabFee = 50; // 500g tier
            } else if (chargeableWeight > 0.50) {
                const extraWeight = chargeableWeight - 0.50;
                const extraSlabs = Math.ceil(extraWeight / 0.25);
                slabFee = 50 + (extraSlabs * 49);
            }

            const vendorTotal = baseFee + slabFee;

            let zoneName = "Standard Weight-Based Delivery";
            if (destinationPincode && sellerPincode && 
                (destinationPincode === sellerPincode || destinationPincode.substring(0, 3) === sellerPincode.substring(0, 3))) {
                zoneName = "Local (Same District)";
            } else if (buyerState === sellerState) {
                zoneName = `Intra-State (${sellerState})`;
            } else {
                zoneName = "Inter-State Delivery";
            }

            breakdown.push({
                vendorId,
                vendorName,
                chargeableWeight: Number(chargeableWeight.toFixed(2)),
                baseFee,
                slabFee,
                codFee: 0,
                remoteSurcharge: 0,
                expressFee: 0,
                handlingFee: 0,
                fuelSurcharge: 0,
                tax: 0,
                total: Number(vendorTotal.toFixed(2)),
                minDays: 3,
                maxDays: 7,
                zone: zoneName
            });

            totalShippingFee += vendorTotal;
        }

        return {
            totalShippingFee: Number(totalShippingFee.toFixed(2)),
            isFreeShipping: false,
            breakdown
        };
    }
}
