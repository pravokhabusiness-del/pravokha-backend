const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        include: { variants: true }
    });
    
    for (const product of products) {
        if (product.variants.length === 0) {
            await prisma.productVariant.create({
                data: {
                    productId: product.id,
                    name: 'STANDARD',
                    colorName: 'STANDARD',
                    colorHex: '#000000',
                    images: '[]',
                    sizes: {
                        create: {
                            size: 'L',
                            stock: 50
                        }
                    }
                }
            });
            console.log(`Added variant to ${product.title}`);
        }
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
