import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecting Combo Offers and Products ---');
    const offers = await prisma.comboOffer.findMany({
        where: { active: true }
    });
    console.log('Active Combo Offers:', offers.length);

    for (const offer of offers) {
        console.log(`\nOffer: "${offer.title}" (ID: ${offer.id})`);
        let ids: string[] = [];
        try {
            ids = typeof offer.productIds === 'string' ? JSON.parse(offer.productIds) : offer.productIds;
        } catch (e) {
            console.error('Error parsing productIds:', e);
            continue;
        }

        console.log('Product IDs in combo:', ids);

        for (const id of ids) {
            const product = await prisma.product.findUnique({
                where: { id },
                include: {
                    variants: {
                        include: {
                            sizes: true
                        }
                    }
                }
            });

            if (!product) {
                console.log(`  Product ${id}: NOT FOUND in database`);
                continue;
            }

            console.log(`  Product "${product.title}" (ID: ${product.id}):`);
            console.log(`    Status: ${product.status}, Stock: ${product.stock}`);
            console.log(`    Variants Count: ${product.variants.length}`);
            
            product.variants.forEach((v, index) => {
                console.log(`    Variant ${index + 1}: Name: "${v.name}", ID: "${v.id}", Color: "${v.colorName}"`);
                console.log(`      Sizes:`, v.sizes.map(s => `[Size: ${s.size}, Stock: ${s.stock}]`).join(', '));
            });
        }
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
