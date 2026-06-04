const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const result = await prisma.product.updateMany({
        where: { status: 'PUBLISHED' },
        data: { status: 'ACTIVE' }
    });
    console.log('Updated products count:', result.count);
}

main().catch(console.error).finally(() => prisma.$disconnect());
