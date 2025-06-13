import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { eq, and, desc } from 'drizzle-orm'
import QRCode from 'qrcode'
import { createId } from '@paralleldrive/cuid2'
import { db } from './database'
import { tools, borrowRecords, notifications } from './database/schema'
import type { 
  ApiResponse,
  CreateToolRequest,
  CreateToolResponse,
  BorrowToolRequest,
  BorrowToolResponse,
  ReturnToolRequest,
  ReturnToolResponse,
  GetToolsResponse,
  GetBorrowRecordsResponse,
  GetNotificationsResponse,
  Tool,
  BorrowRecord,
  Notification
} from 'shared/dist'

const app = new Hono()

app.use(cors())

app.get('/', (c) => {
  return c.text('Workshop Tool Tracking System')
})

app.get('/hello', async (c) => {
  const data: ApiResponse = {
    message: "Hello Workshop Tool Tracking System!",
    success: true
  }
  return c.json(data, { status: 200 })
})

// Get all tools
app.get('/api/tools', async (c) => {
  try {
    const allTools = await db.select().from(tools).orderBy(desc(tools.createdAt))
    
    const response: GetToolsResponse = {
      success: true,
      tools: allTools,
      message: 'Tools retrieved successfully'
    }
    
    return c.json(response)
  } catch (error) {
    console.error('Error fetching tools:', error)
    const response: GetToolsResponse = {
      success: false,
      tools: [],
      message: 'Failed to fetch tools'
    }
    return c.json(response, 500)
  }
})

// Create a new tool
app.post('/api/tools', async (c) => {
  try {
    const body: CreateToolRequest = await c.req.json()
    
    if (!body.name?.trim()) {
      const response: CreateToolResponse = {
        success: false,
        message: 'Tool name is required'
      }
      return c.json(response, 400)
    }

    const toolId = createId()
    const qrCode = await QRCode.toDataURL(toolId)
    
    const [newTool] = await db.insert(tools).values({
      id: toolId,
      name: body.name.trim(),
      description: body.description?.trim(),
      qrCode: qrCode,
    }).returning()

    if (!newTool) {
      const response: CreateToolResponse = {
        success: false,
        message: 'Failed to create tool'
      }
      return c.json(response, 500)
    }

    // Create notification for new tool
    await db.insert(notifications).values({
      type: 'borrow',
      message: `New tool "${newTool.name}" has been added to the system`,
      toolId: newTool.id,
    })

    const response: CreateToolResponse = {
      success: true,
      tool: newTool,
      message: 'Tool created successfully'
    }
    
    return c.json(response)
  } catch (error) {
    console.error('Error creating tool:', error)
    const response: CreateToolResponse = {
      success: false,
      message: 'Failed to create tool'
    }
    return c.json(response, 500)
  }
})

// Get tool by QR code
app.get('/api/tools/qr/:qrId', async (c) => {
  try {
    const qrId = c.req.param('qrId')
    
    const [tool] = await db.select().from(tools).where(eq(tools.id, qrId))
    
    if (!tool) {
      return c.json({ success: false, message: 'Tool not found' }, 404)
    }
    
    return c.json({ success: true, tool, message: 'Tool found' })
  } catch (error) {
    console.error('Error fetching tool by QR:', error)
    return c.json({ success: false, message: 'Failed to fetch tool' }, 500)
  }
})

// Borrow a tool
app.post('/api/borrow', async (c) => {
  try {
    const body: BorrowToolRequest = await c.req.json()
    
    if (!body.toolId || !body.borrowerName?.trim() || !body.borrowerLocation?.trim() || !body.purpose?.trim()) {
      const response: BorrowToolResponse = {
        success: false,
        message: 'All fields are required: toolId, borrowerName, borrowerLocation, purpose'
      }
      return c.json(response, 400)
    }

    // Check if tool exists and is available
    const [tool] = await db.select().from(tools).where(eq(tools.id, body.toolId))
    
    if (!tool) {
      const response: BorrowToolResponse = {
        success: false,
        message: 'Tool not found'
      }
      return c.json(response, 404)
    }

    if (tool.status !== 'available') {
      const response: BorrowToolResponse = {
        success: false,
        message: `Tool is currently ${tool.status}`
      }
      return c.json(response, 400)
    }

    // Create borrow record
    const [borrowRecord] = await db.insert(borrowRecords).values({
      toolId: body.toolId,
      borrowerName: body.borrowerName.trim(),
      borrowerLocation: body.borrowerLocation.trim(),
      purpose: body.purpose.trim(),
    }).returning()

    if (!borrowRecord) {
      const response: BorrowToolResponse = {
        success: false,
        message: 'Failed to create borrow record'
      }
      return c.json(response, 500)
    }

    // Update tool status
    await db.update(tools).set({ 
      status: 'borrowed', 
      updatedAt: new Date() 
    }).where(eq(tools.id, body.toolId))

    // Create notification
    await db.insert(notifications).values({
      type: 'borrow',
      message: `Tool "${tool.name}" borrowed by ${body.borrowerName} for ${body.purpose}`,
      toolId: body.toolId,
      borrowRecordId: borrowRecord.id,
    })

    const response: BorrowToolResponse = {
      success: true,
      borrowRecord,
      message: 'Tool borrowed successfully'
    }
    
    return c.json(response)
  } catch (error) {
    console.error('Error borrowing tool:', error)
    const response: BorrowToolResponse = {
      success: false,
      message: 'Failed to borrow tool'
    }
    return c.json(response, 500)
  }
})

// Return a tool
app.post('/api/return', async (c) => {
  try {
    const body: ReturnToolRequest = await c.req.json()
    
    if (!body.borrowRecordId) {
      const response: ReturnToolResponse = {
        success: false,
        message: 'Borrow record ID is required'
      }
      return c.json(response, 400)
    }

    // Get borrow record
    const [borrowRecord] = await db.select().from(borrowRecords).where(
      and(
        eq(borrowRecords.id, body.borrowRecordId),
        eq(borrowRecords.status, 'active')
      )
    )
    
    if (!borrowRecord) {
      const response: ReturnToolResponse = {
        success: false,
        message: 'Active borrow record not found'
      }
      return c.json(response, 404)
    }

    // Update borrow record
    const [updatedRecord] = await db.update(borrowRecords).set({
      returnedAt: new Date(),
      status: 'returned'
    }).where(eq(borrowRecords.id, body.borrowRecordId)).returning()

    // Update tool status
    await db.update(tools).set({ 
      status: 'available',
      updatedAt: new Date()
    }).where(eq(tools.id, borrowRecord.toolId))

    // Get tool info for notification
    const [tool] = await db.select().from(tools).where(eq(tools.id, borrowRecord.toolId))

    if (!tool) {
      const response: ReturnToolResponse = {
        success: false,
        message: 'Tool not found'
      }
      return c.json(response, 404)
    }

    // Create notification
    await db.insert(notifications).values({
      type: 'return',
      message: `Tool "${tool.name}" returned by ${borrowRecord.borrowerName}`,
      toolId: borrowRecord.toolId,
      borrowRecordId: borrowRecord.id,
    })

    const response: ReturnToolResponse = {
      success: true,
      borrowRecord: updatedRecord,
      message: 'Tool returned successfully'
    }
    
    return c.json(response)
  } catch (error) {
    console.error('Error returning tool:', error)
    const response: ReturnToolResponse = {
      success: false,
      message: 'Failed to return tool'
    }
    return c.json(response, 500)
  }
})

// Get all borrow records
app.get('/api/borrow-records', async (c) => {
  try {
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
    .orderBy(desc(borrowRecords.borrowedAt))
    
    const response: GetBorrowRecordsResponse = {
      success: true,
      records,
      message: 'Borrow records retrieved successfully'
    }
    
    return c.json(response)
  } catch (error) {
    console.error('Error fetching borrow records:', error)
    const response: GetBorrowRecordsResponse = {
      success: false,
      records: [],
      message: 'Failed to fetch borrow records'
    }
    return c.json(response, 500)
  }
})

// Get active borrows
app.get('/api/borrow-records/active', async (c) => {
  try {
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
    .orderBy(desc(borrowRecords.borrowedAt))
    
    const response: GetBorrowRecordsResponse = {
      success: true,
      records,
      message: 'Active borrow records retrieved successfully'
    }
    
    return c.json(response)
  } catch (error) {
    console.error('Error fetching active borrow records:', error)
    const response: GetBorrowRecordsResponse = {
      success: false,
      records: [],
      message: 'Failed to fetch active borrow records'
    }
    return c.json(response, 500)
  }
})

// Get notifications
app.get('/api/notifications', async (c) => {
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
        description: tools.description,
        qrCode: tools.qrCode,
        status: tools.status,
        createdAt: tools.createdAt,
        updatedAt: tools.updatedAt,
      }
    }).from(notifications)
    .leftJoin(tools, eq(notifications.toolId, tools.id))
    .orderBy(desc(notifications.createdAt))
    
    const response: GetNotificationsResponse = {
      success: true,
      notifications: notificationsList,
      message: 'Notifications retrieved successfully'
    }
    
    return c.json(response)
  } catch (error) {
    console.error('Error fetching notifications:', error)
    const response: GetNotificationsResponse = {
      success: false,
      notifications: [],
      message: 'Failed to fetch notifications'
    }
    return c.json(response, 500)
  }
})

// Mark notification as read
app.patch('/api/notifications/:id/read', async (c) => {
  try {
    const notificationId = c.req.param('id')
    
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, notificationId))
    
    return c.json({ success: true, message: 'Notification marked as read' })
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return c.json({ success: false, message: 'Failed to mark notification as read' }, 500)
  }
})

export default app
