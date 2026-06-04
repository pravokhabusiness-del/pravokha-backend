import { Router } from 'express';

const router = Router();

// Mock response for banners to satisfy frontend requirements
router.get('/', (req, res) => {
    res.json({
        success: true,
        banners: [
            {
                id: '1',
                title: 'Summer Collection 2026',
                subtitle: 'Discover the latest trends in fashion.',
                imageUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&w=1200&q=80',
                buttonText: 'Shop Now',
                buttonLink: '/products?category=fashion'
            },
            {
                id: '2',
                title: 'Electronics Mega Sale',
                subtitle: 'Up to 50% off on premium gadgets.',
                imageUrl: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=80',
                buttonText: 'Explore Deals',
                buttonLink: '/products?category=electronics'
            }
        ]
    });
});

export default router;
