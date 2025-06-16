import type { Context } from 'hono';
import { db } from '../database';
import { notifications, tools } from '../database/schema';
import { eq, desc } from 'drizzle-orm';

// Get notifications
export const getNotificationsController = async (c: Context) => {
    try {
        const notificationsList = await db.select({
            id: notifications.id,
            type: notifications.type,
            message: notifications.message,
            toolId: notifications.toolId,
            borrowRecordId: notifications.borrowRecordId,
            createdAt: notifications.createdAt,
            read: notifications.read,
            tool: {
                id: tools.id,
                name: tools.name,
            }
        }).from(notifications)
            .leftJoin(tools, eq(notifications.toolId, tools.id))
            .orderBy(desc(notifications.createdAt));

        return c.json({
            success: true,
            notifications: notificationsList,
            message: 'Notifications retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return c.json({
            success: false,
            notifications: [],
            message: 'Failed to fetch notifications'
        }, 500);
    }
};

// Mark notification as read
export const markNotificationAsReadController = async (c: Context) => {
    try {
        const notificationId = c.req.param('id');
        if (!notificationId) {
            return c.json({ success: false, message: 'Notification ID is required' }, 400);
        }

        const [updatedNotification] = await db.update(notifications)
            .set({ read: 'true' })
            .where(eq(notifications.id, notificationId))
            .returning();

        if (!updatedNotification) {
            return c.json({ success: false, message: 'Notification not found or already marked as read' }, 404);
        }

        return c.json({ success: true, message: 'Notification marked as read' });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return c.json({ success: false, message: 'Failed to mark notification as read' }, 500);
    }
};