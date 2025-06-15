import type { Context } from 'hono';
import { nanoid } from 'nanoid';
import QRCode from 'qrcode';
import { db } from '../database';
import { tools, notifications } from '../database/schema';
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