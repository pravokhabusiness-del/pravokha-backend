import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function linkImages() {
    console.log('🔗 Starting image linking process...');

    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    if (!fs.existsSync(uploadsDir)) {
        console.error(`❌ Uploads directory not found at: ${uploadsDir}`);
        console.info('Please move the images from e:\\pravokha-updated\\uploads to this directory.');
        return;
    }

    const files = fs.readdirSync(uploadsDir).filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f));
    console.log(`📸 Found ${files.length} images in uploads folder.`);

    if (files.length === 0) {
        console.warn('⚠️ No images found to link.');
        return;
    }

    const products = await prisma.product.findMany({
        include: { images: true, variants: true }
    });

    console.log(`📦 Found ${products.length} products to update.`);

    for (const [index, product] of products.entries()) {
        // Assign 1-3 images per product if available
        const startIndex = (index * 2) % files.length;
        const selectedFiles = files.slice(startIndex, startIndex + 2);

        console.log(`Updating product "${product.title}" with ${selectedFiles.length} images...`);

        // Update ProductImage model
        for (const file of selectedFiles) {
            const imageUrl = `/uploads/${file}`;
            await prisma.productImage.create({
                data: {
                    productId: product.id,
                    url: imageUrl,
                    order: 0
                }
            });
        }

        // Update variants with images JSON
        for (const variant of product.variants) {
            const variantImages = selectedFiles.map(f => `/uploads/${f}`);
            await prisma.productVariant.update({
                where: { id: variant.id },
                data: {
                    images: JSON.stringify(variantImages)
                }
            });
        }
    }

    console.log('✅ Image linking complete!');
}

linkImages()
    .catch(e => console.error('❌ Error linking images:', e))
    .finally(async () => await prisma.$disconnect());
