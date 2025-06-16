import type { Context } from 'hono';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import { db } from '../database';
import { tools, notifications, borrowRecords } from '../database/schema';
import { desc, eq } from 'drizzle-orm';

// Get all tools
export const getAllToolsController = async (c: Context) => {
    try {
        const allTools = await db.select().from(tools).orderBy(desc(tools.createdAt));
        return c.json({
            success: true,
            tools: allTools,
            message: 'Tools retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching tools:', error);
        return c.json({
            success: false,
            tools: [],
            message: 'Failed to fetch tools'
        }, 500);
    }
};

// Create a new tool
export const createToolController = async (c: Context) => {
    try {
        const body = await c.req.json();
        if (!body.name?.trim()) {
            return c.json({
                success: false,
                message: 'Tool name is required'
            }, 400);
        }

        const toolId = nanoid(4);
        const qrCode = await QRCode.toDataURL(toolId);

        const [newTool] = await db.insert(tools).values({
            id: toolId,
            name: body.name.trim(),
            description: body.description?.trim(),
            qrCode: qrCode,
        }).returning();

        if (!newTool) {
            return c.json({
                success: false,
                message: 'Failed to create tool'
            }, 500);
        }

        // Create notification for new tool
        await db.insert(notifications).values({
            type: 'borrow', // Using existing type since schema doesn't have 'tool_added'
            message: `New tool "${newTool.name}" has been added to the system`,
            toolId: newTool.id,
        });

        return c.json({
            success: true,
            tool: newTool,
            message: 'Tool created successfully'
        });
    } catch (error) {
        console.error('Error creating tool:', error);
        return c.json({
            success: false,
            message: 'Failed to create tool'
        }, 500);
    }
};

// Get tool by QR code
export const getToolByQrIdController = async (c: Context) => {
    try {
        const qrId = c.req.param('qrId');
        const [tool] = await db.select().from(tools).where(eq(tools.id, qrId));

        if (!tool) {
            return c.json({ success: false, message: 'Tool not found' }, 404);
        }
        return c.json({ success: true, tool, message: 'Tool found' });
    } catch (error) {
        console.error('Error fetching tool by QR:', error);
        return c.json({ success: false, message: 'Failed to fetch tool' }, 500);
    }
};

// Get tool by ID
export const getToolByIdController = async (c: Context) => {
    try {
        const id = c.req.param('id');
        const [tool] = await db.select().from(tools).where(eq(tools.id, id));

        if (!tool) {
            return c.json({ success: false, message: 'Tool not found' }, 404);
        }
        return c.json({ success: true, tool, message: 'Tool retrieved successfully' });
    } catch (error) {
        console.error('Error fetching tool by ID:', error);
        return c.json({ success: false, message: 'Failed to fetch tool' }, 500);
    }
};

// Update a tool
export const updateToolController = async (c: Context) => {
    try {
        const id = c.req.param('id');
        const body = await c.req.json();

        // Check if tool exists
        const [existingTool] = await db.select().from(tools).where(eq(tools.id, id));
        if (!existingTool) {
            return c.json({ success: false, message: 'Tool not found' }, 404);
        }

        // Validate input
        const updateData: any = {
            updatedAt: new Date()
        };

        if (body.name?.trim()) {
            updateData.name = body.name.trim();
        }

        if (body.description !== undefined) {
            updateData.description = body.description?.trim() || null;
        }

        if (body.status && ['available', 'borrowed', 'maintenance'].includes(body.status)) {
            updateData.status = body.status;
        }

        // Update tool
        const [updatedTool] = await db.update(tools)
            .set(updateData)
            .where(eq(tools.id, id))
            .returning();

        if (!updatedTool) {
            return c.json({
                success: false,
                message: 'Failed to update tool'
            }, 500);
        }

        // Create notification for tool update
        await db.insert(notifications).values({
            type: 'borrow', // Using existing type since schema doesn't have 'tool_updated'
            message: `Tool "${updatedTool.name}" has been updated`,
            toolId: updatedTool.id,
        });

        return c.json({
            success: true,
            tool: updatedTool,
            message: 'Tool updated successfully'
        });
    } catch (error) {
        console.error('Error updating tool:', error);
        return c.json({
            success: false,
            message: 'Failed to update tool'
        }, 500);
    }
};

// Delete a tool
export const deleteToolController = async (c: Context) => {
    try {
        const id = c.req.param('id');

        // Check if tool exists
        const [existingTool] = await db.select().from(tools).where(eq(tools.id, id));
        if (!existingTool) {
            return c.json({ success: false, message: 'Tool not found' }, 404);
        }

        // Check if tool is currently borrowed
        if (existingTool.status === 'borrowed') {
            return c.json({ 
                success: false, 
                message: 'Cannot delete a tool that is currently borrowed' 
            }, 400);
        }

        // Check if there are any borrow records for this tool
        const relatedBorrowRecords = await db.select().from(borrowRecords).where(eq(borrowRecords.toolId, id));
        if (relatedBorrowRecords.length > 0) {
            return c.json({
                success: false,
                message: 'Cannot delete a tool that has borrow history. Consider archiving instead.'
            }, 400);
        }

        // Delete all related notifications first to avoid foreign key constraint violation
        await db.delete(notifications).where(eq(notifications.toolId, id));

        // Then delete the tool
        await db.delete(tools).where(eq(tools.id, id));

        return c.json({
            success: true,
            message: 'Tool deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting tool:', error);
        return c.json({
            success: false,
            message: 'Failed to delete tool'
        }, 500);
    }
};

// Force delete a tool (removes all related data)
export const forceDeleteToolController = async (c: Context) => {
    try {
        const id = c.req.param('id');

        // Check if tool exists
        const [existingTool] = await db.select().from(tools).where(eq(tools.id, id));
        if (!existingTool) {
            return c.json({ success: false, message: 'Tool not found' }, 404);
        }

        // Check if tool is currently borrowed
        if (existingTool.status === 'borrowed') {
            return c.json({ 
                success: false, 
                message: 'Cannot delete a tool that is currently borrowed' 
            }, 400);
        }

        // Delete all related data in proper order to maintain referential integrity
        
        // 1. Delete notifications
        await db.delete(notifications).where(eq(notifications.toolId, id));
        
        // 2. Delete borrow records 
        await db.delete(borrowRecords).where(eq(borrowRecords.toolId, id));
        
        // 3. Finally delete the tool
        await db.delete(tools).where(eq(tools.id, id));

        return c.json({
            success: true,
            message: 'Tool and all related data deleted successfully'
        });
    } catch (error) {
        console.error('Error force deleting tool:', error);
        return c.json({
            success: false,
            message: 'Failed to delete tool'
        }, 500);
    }
};