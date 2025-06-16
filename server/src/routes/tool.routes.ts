import { Hono } from 'hono';
import {
    getAllToolsController,
    createToolController,
    getToolByQrIdController,
    getToolByIdController,
    updateToolController,
    deleteToolController,
    forceDeleteToolController
} from '../controllers/tool.controllers';

const toolRoutes = new Hono();

// Get all tools
toolRoutes.get('/', getAllToolsController);

// Create a new tool
toolRoutes.post('/', createToolController);

// Get tool by ID
toolRoutes.get('/:id', getToolByIdController);

// Update a tool
toolRoutes.put('/:id', updateToolController);

// Delete a tool
toolRoutes.delete('/:id', deleteToolController);

// Force delete a tool (removes all related data)
toolRoutes.delete('/:id/force', forceDeleteToolController);

// Get tool by QR code
toolRoutes.get('/qr/:qrId', getToolByQrIdController);

export default toolRoutes;