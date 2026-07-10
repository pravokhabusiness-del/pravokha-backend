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

        // Calculate per Vendor dynamically based on relative distance zones
        for (const [vendorId, itemsList] of Object.entries(vendorItems)) {
            let totalActualWeight = 0;
            let totalVolumetricWeight = 0;

            itemsList.forEach((item: { productId: string; quantity: number; sellerId: string }) => {
                const product = products.find((p: any) => p.id === item.productId);
                if (product) {
                    totalActualWeight += ((product.weight || 0.5) + 0.05) * item.quantity;
                    const volWeight = ((product.length || 20) * (product.width || 15) * (product.height || 5)) / 5000;
                    totalVolumetricWeight += volWeight * item.quantity;
                }
            });

            const chargeableWeight = Math.max(totalActualWeight, totalVolumetricWeight);

            const firstProduct = products.find((p: any) => p.vendorId === vendorId);
            const vendorName = firstProduct?.vendor?.storeName || "Vendor";

            const sellerState = firstProduct?.vendor?.warehouseState ? firstProduct.vendor.warehouseState.trim().toUpperCase() : "TAMIL NADU";
            const sellerPincode = firstProduct?.vendor?.pickupPincode ? firstProduct.vendor.pickupPincode.trim() : "";

            const buyerState = resolvedState ? resolvedState.trim().toUpperCase() : "";

            let zoneName = "Rest of India";
            let vendorTotal = 100; // Default: Rest of India (₹100)

            const nearbySouthStates = ['KARNATAKA', 'KERALA', 'ANDHRA PRADESH', 'TELANGANA', 'PUDUCHERRY', 'LAKSHADWEEP'];

            // Proximity matching
            if (destinationPincode && sellerPincode && 
                (destinationPincode === sellerPincode || destinationPincode.substring(0, 3) === sellerPincode.substring(0, 3))) {
                zoneName = "Local (Same District)";
                vendorTotal = 40;
            } else if (buyerState === sellerState) {
                zoneName = `Intra-State (${sellerState})`;
                vendorTotal = 60;
            } else if (nearbySouthStates.includes(buyerState)) {
                zoneName = "Nearby South States";
                vendorTotal = 80;
            } else {
                zoneName = "Rest of India";
                vendorTotal = 100;
            }

            breakdown.push({
                vendorId,
                vendorName,
                chargeableWeight: Number(chargeableWeight.toFixed(2)),
                baseFee: vendorTotal,
                slabFee: 0,
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
