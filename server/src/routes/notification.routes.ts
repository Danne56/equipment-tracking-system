import { Hono } from 'hono';
import {
    getNotificationsController,
    markNotificationAsReadController
} from '../controllers/notification.controllers';

const notificationRoutes = new Hono();

// Get notifications
notificationRoutes.get('/', getNotificationsController);

// Mark notification as read
notificationRoutes.patch('/:id/read', markNotificationAsReadController);

export default notificationRoutes;