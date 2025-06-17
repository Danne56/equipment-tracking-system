import { Hono } from 'hono';
import {
    getNotificationsController,
    markNotificationAsReadController
} from '../controllers/notification.controllers';
import type { Bindings } from '../types';

const notificationRoutes = new Hono<{ Bindings: Bindings }>();

// Get notifications
notificationRoutes.get('/', getNotificationsController);

// Mark notification as read
notificationRoutes.patch('/:id/read', markNotificationAsReadController);

export default notificationRoutes;