const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany();
    const categories = await prisma.category.findMany();
    const vendors = await prisma.vendor.findMany();
    
    console.log('Products count:', products.length);
    console.log('Categories count:', categories.length);
    console.log('Vendors count:', vendors.length);
    
    if (products.length > 0) {
        console.log('First product:', products[0].title);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
