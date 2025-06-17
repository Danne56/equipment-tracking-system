import type { Context } from 'hono';
import { createDatabase } from '../database';
import { tools, borrowRecords, notifications } from '../database/schema';
import { eq, and, desc } from 'drizzle-orm';

// Borrow a tool
export const borrowToolController = async (c: Context) => {
    try {
        const db = createDatabase(c.env);
        const body = await c.req.json();
        const { toolId, borrowerName, borrowerLocation, purpose } = body;

        if (!toolId || !borrowerName?.trim() || !borrowerLocation?.trim() || !purpose?.trim()) {
            return c.json({
                success: false,
                message: 'All fields are required: toolId, borrowerName, borrowerLocation, purpose'
            }, 400);
        }

        // Check if tool exists and is available
        const [tool] = await db.select().from(tools).where(eq(tools.id, toolId));
        if (!tool) {
            return c.json({ success: false, message: 'Tool not found' }, 404);
        }
        if (tool.status !== 'available') {
            return c.json({ success: false, message: `Tool is currently ${tool.status}` }, 400);
        }

        // Create borrow record
        const [borrowRecord] = await db.insert(borrowRecords).values({
            toolId: toolId,
            borrowerName: borrowerName.trim(),
            borrowerLocation: borrowerLocation.trim(),
            purpose: purpose.trim(),
        }).returning();

        if (!borrowRecord) {
            return c.json({ success: false, message: 'Failed to create borrow record' }, 500);
        }

        // Update tool status
        await db.update(tools).set({
            status: 'borrowed',
            updatedAt: new Date()
        }).where(eq(tools.id, toolId));

        // Create notification
        await db.insert(notifications).values({
            type: 'borrow',
            message: `Tool "${tool.name}" borrowed by ${borrowerName} for ${purpose}`,
            toolId: toolId,
            borrowRecordId: borrowRecord.id,
        });

        return c.json({
            success: true,
            borrowRecord,
            message: 'Tool borrowed successfully'
        });
    } catch (error) {
        console.error('Error borrowing tool:', error);
        return c.json({ success: false, message: 'Failed to borrow tool' }, 500);
    }
};

// Return a tool
export const returnToolController = async (c: Context) => {
    try {
        const db = createDatabase(c.env);
        const body = await c.req.json();
        if (!body.borrowRecordId) {
            return c.json({ success: false, message: 'Borrow record ID is required' }, 400);
        }

        // Get borrow record
        const [borrowRecord] = await db.select().from(borrowRecords).where(and(eq(borrowRecords.id, body.borrowRecordId), eq(borrowRecords.status, 'active')));
        if (!borrowRecord) {
            return c.json({ success: false, message: 'Active borrow record not found' }, 404);
        }

        // Update borrow record
        const [updatedRecord] = await db.update(borrowRecords).set({
            returnedAt: new Date(),
            status: 'returned'
        }).where(eq(borrowRecords.id, body.borrowRecordId)).returning();

        // Update tool status
        await db.update(tools).set({
            status: 'available',
            updatedAt: new Date()
        }).where(eq(tools.id, borrowRecord.toolId));

        // Get tool info for notification
        const [tool] = await db.select().from(tools).where(eq(tools.id, borrowRecord.toolId));
        if (!tool) {
            console.error(`Tool not found for borrow record ID: ${body.borrowRecordId}`);
            return c.json({ success: false, message: 'Associated tool not found' }, 404);
        }

        // Create notification
        await db.insert(notifications).values({
            type: 'return',
            message: `Tool "${tool.name}" returned by ${borrowRecord.borrowerName}`,
            toolId: borrowRecord.toolId,
            borrowRecordId: borrowRecord.id,
        });

        return c.json({
            success: true,
            borrowRecord: updatedRecord,
            message: 'Tool returned successfully'
        });
    } catch (error) {
        console.error('Error returning tool:', error);
        return c.json({ success: false, message: 'Failed to return tool' }, 500);
    }
};

// Get all borrow records
export const getAllBorrowRecordsController = async (c: Context) => {
    try {
        const db = createDatabase(c.env);
        const records = await db.select({
            id: borrowRecords.id,
            toolId: borrowRecords.toolId,
            borrowerName: borrowRecords.borrowerName,
            borrowerLocation: borrowRecords.borrowerLocation,
            purpose: borrowRecords.purpose,
            borrowedAt: borrowRecords.borrowedAt,
            returnedAt: borrowRecords.returnedAt,
            status: borrowRecords.status,
            tool: {
                id: tools.id,
                name: tools.name,
                description: tools.description,
                qrCode: tools.qrCode,
                status: tools.status,
                createdAt: tools.createdAt,
                updatedAt: tools.updatedAt,
            }
        }).from(borrowRecords)
            .leftJoin(tools, eq(borrowRecords.toolId, tools.id))
            .orderBy(desc(borrowRecords.borrowedAt));

        return c.json({
            success: true,
            records,
            message: 'Borrow records retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching borrow records:', error);
        return c.json({ success: false, records: [], message: 'Failed to fetch borrow records' }, 500);
    }
};

// Get active borrows
export const getActiveBorrowRecordsController = async (c: Context) => {
    try {
        const db = createDatabase(c.env);
        const records = await db.select({
            id: borrowRecords.id,
            toolId: borrowRecords.toolId,
            borrowerName: borrowRecords.borrowerName,
            borrowerLocation: borrowRecords.borrowerLocation,
            purpose: borrowRecords.purpose,
            borrowedAt: borrowRecords.borrowedAt,
            returnedAt: borrowRecords.returnedAt,
            status: borrowRecords.status,
            tool: {
                id: tools.id,
                name: tools.name,
                description: tools.description,
                qrCode: tools.qrCode,
                status: tools.status,
                createdAt: tools.createdAt,
                updatedAt: tools.updatedAt,
            }
        }).from(borrowRecords)
            .leftJoin(tools, eq(borrowRecords.toolId, tools.id))
            .where(eq(borrowRecords.status, 'active'))
            .orderBy(desc(borrowRecords.borrowedAt));

        return c.json({
            success: true,
            records,
            message: 'Active borrow records retrieved successfully'
        });
    } catch (error) {
        console.error('Error fetching active borrow records:', error);
        return c.json({ success: false, records: [], message: 'Failed to fetch active borrow records' }, 500);
    }
};