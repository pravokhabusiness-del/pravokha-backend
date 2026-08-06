import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { SupportController } from './controller';
import { authenticate, authorize } from '../../shared/middleware/auth';
import { Role } from '../../shared/domain/types';

const contactLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // Max 5 submissions per 15 minutes
    message: { success: false, message: 'Too many contact form submissions. Please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = Router();

// Public routes
router.post('/contact', contactLimiter, SupportController.contactUs);

// User routes
router.post('/tickets', authenticate, SupportController.createTicket);
router.get('/tickets', authenticate, SupportController.listTickets);
router.get('/tickets/:id', authenticate, SupportController.getTicket);

// Conversations (User)
router.get('/conversations', authenticate, SupportController.listUserConversations);
router.post('/conversations', authenticate, SupportController.createConversation);

// Admin routes
router.get('/admin/tickets', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), SupportController.listAllTickets);
router.patch('/tickets/:id/status', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), SupportController.updateStatus);

// Shared/Messaging routes
router.get('/tickets/:id/messages', authenticate, SupportController.getTicketMessages);
router.post('/tickets/:id/reply', authenticate, SupportController.replyToTicket);

// Conversation/Chat routes
router.get('/admin/conversations', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), SupportController.listConversations);
router.get('/conversations/:id/messages', authenticate, SupportController.getConversationMessages);
router.post('/conversations/:id/messages', authenticate, SupportController.sendConversationMessage);
router.patch('/conversations/:id/status', authenticate, authorize([Role.SUPER_ADMIN, Role.ADMIN]), SupportController.updateConversationStatus);

export default router;
