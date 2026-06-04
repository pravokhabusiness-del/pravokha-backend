
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
    try {
        const products = await prisma.product.findMany({
            include: { category: true, vendor: true, images: true, variants: true }
        });
        console.log('Product count:', products.length);
        products.forEach(p => {
            console.log(`Product: ${p.title}`);
            console.log(`Images:`, p.images);
            console.log(`Variants:`, p.variants.map(v => v.images));
        });

        const categories = await prisma.category.findMany();
        console.log('Category count:', categories.length);

        const vendors = await prisma.vendor.findMany();
        console.log('Vendor count:', vendors.length);
    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
